"""Read-only D1 + R2 export. Never print rows, object names, or signed URLs."""
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import tempfile
import time
import urllib.error
import urllib.request
import urllib.parse


def required(name):
    value = os.environ.get(name, '')
    if not value:
        raise RuntimeError(f'Missing configuration: {name}')
    return value


def digest(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def validate_sql(path):
    # Restore into a disposable SQLite database, never into production.
    with tempfile.TemporaryDirectory() as tmp:
        db = sqlite3.connect(str(Path(tmp) / 'check.sqlite'))
        try:
            db.executescript(path.read_text())
            if db.execute('PRAGMA integrity_check').fetchall() != [('ok',)]:
                raise RuntimeError('SQL integrity check failed')
            if db.execute('PRAGMA foreign_key_check').fetchone():
                raise RuntimeError('SQL foreign key check failed')
            tables = {r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
            if not {'shops', 'products', 'orders'}.issubset(tables):
                raise RuntimeError('Required store tables missing from export')
        finally:
            db.close()


def export_d1(account, database, destination):
    endpoint = f'https://api.cloudflare.com/client/v4/accounts/{account}/d1/database/{database}/export'
    body = {'output_format': 'polling'}
    for attempt in range(180):
        req = urllib.request.Request(endpoint, data=json.dumps(body).encode(), headers={
            'Authorization': 'Bearer ' + required('CLOUDFLARE_BACKUP_TOKEN'),
            'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=90) as response:
            payload = json.load(response)
        if not payload.get('success'):
            raise RuntimeError('D1 export request failed')
        result = payload['result']
        if result.get('status') == 'error' or result.get('success') is False:
            raise RuntimeError('D1 export failed')
        if result.get('status') == 'complete':
            url = result['result']['signed_url']
            if urllib.parse.urlparse(url).scheme != 'https':
                raise RuntimeError('Invalid export download URL')
            with urllib.request.urlopen(url, timeout=120) as source, destination.open('wb') as target:
                while chunk := source.read(1024 * 1024):
                    target.write(chunk)
            validate_sql(destination)
            return result.get('at_bookmark')
        bookmark = result.get('at_bookmark')
        if not bookmark:
            raise RuntimeError('D1 export did not return a polling bookmark')
        body['current_bookmark'] = bookmark
        time.sleep(5)
    raise RuntimeError('D1 export timed out')


def list_objects(s3, bucket):
    objects = {}
    for page in s3.get_paginator('list_objects_v2').paginate(Bucket=bucket):
        for item in page.get('Contents', []):
            objects[item['Key']] = {'etag': item['ETag'], 'size': item['Size']}
    return objects


def export_r2(s3, bucket, root):
    before = list_objects(s3, bucket)
    manifest = []
    for key, item in sorted(before.items()):
        # Hashed local names handle slashes, traversal, Unicode and folder markers safely.
        filename = hashlib.sha256(key.encode()).hexdigest()
        path = root / filename
        obj = s3.get_object(Bucket=bucket, Key=key, IfMatch=item['etag'])
        with path.open('wb') as f, obj['Body'] as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b''):
                f.write(chunk)
        if path.stat().st_size != item['size']:
            raise RuntimeError('Incomplete R2 download')
        metadata = {name: obj[name] for name in [
            'ContentType', 'CacheControl', 'ContentDisposition', 'ContentEncoding',
            'ContentLanguage', 'Metadata'] if name in obj}
        manifest.append({'key': key, 'file': 'objects/' + filename,
                         **item, 'sha256': digest(path), 'metadata': metadata})
    if list_objects(s3, bucket) != before:
        raise RuntimeError('R2 changed during export; retry to avoid an incomplete snapshot')
    return manifest


def main():
    import boto3
    from botocore.config import Config
    os.umask(0o077)
    root = Path(required('BACKUP_WORKDIR'))
    root.mkdir(parents=True, exist_ok=False)
    (root / 'objects').mkdir()
    account, database, bucket = (required(x) for x in [
        'CLOUDFLARE_ACCOUNT_ID', 'D1_DATABASE_ID', 'R2_BUCKET'])
    started = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    bookmark = export_d1(account, database, root / 'database.sql')
    s3 = boto3.client('s3', endpoint_url=f'https://{account}.r2.cloudflarestorage.com',
        region_name='auto', aws_access_key_id=required('R2_BACKUP_ACCESS_KEY_ID'),
        aws_secret_access_key=required('R2_BACKUP_SECRET_ACCESS_KEY'),
        config=Config(retries={'mode': 'standard', 'max_attempts': 5}))
    objects = export_r2(s3, bucket, root / 'objects')
    manifest = {'version': 1, 'started_utc': started, 'database_id': database,
        'd1_bookmark': bookmark, 'database_sha256': digest(root / 'database.sql'),
        'bucket': bucket, 'objects': objects,
        'consistency': 'D1 snapshot followed by stable R2 export; not a cross-service transaction.'}
    (root / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
    print(f'Export validated: {len(objects)} objects, {sum(x["size"] for x in objects)} media bytes.')


if __name__ == '__main__':
    try:
        main()
    except urllib.error.HTTPError as exc:
        codes = []
        try:
            payload = json.loads(exc.read())
            codes = [item.get('code') for item in payload.get('errors', []) if isinstance(item.get('code'), int)]
        except Exception:
            pass
        print(f'Cloudflare export failed: HTTP {exc.code}, error codes {codes}.')
        raise SystemExit(1)
    except Exception as exc:
        # SDK/HTTP exceptions can embed private object names or signed URLs.
        print(f'Backup failed ({type(exc).__name__}). Check credentials, service status and configuration.')
        raise SystemExit(1)
