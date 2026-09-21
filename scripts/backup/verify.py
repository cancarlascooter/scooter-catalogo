"""Verify a downloaded encrypted artifact, restoring SQL only to temporary SQLite."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile


def sha(stream):
    h = hashlib.sha256()
    for chunk in iter(lambda: stream.read(1024 * 1024), b''):
        h.update(chunk)
    return h.hexdigest()


def main():
    os.umask(0o077)
    root = Path(os.environ['BACKUP_VERIFY_DIR'])
    artifact = root / 'backup.tar.gz.gpg'
    expected = (root / 'SHA256SUMS').read_text().split()[0]
    with artifact.open('rb') as f:
        assert sha(f) == expected, 'Encrypted artifact hash mismatch'
    with tempfile.TemporaryDirectory() as temp:
        temp = Path(temp)
        key = temp / 'passphrase'
        key.write_text(os.environ['BACKUP_PASSPHRASE'])
        archive = temp / 'backup.tar.gz'
        subprocess.run(['gpg', '--batch', '--homedir', str(temp), '--pinentry-mode',
            'loopback', '--passphrase-file', str(key), '--output', str(archive),
            '--decrypt', str(artifact)], check=True, stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL)
        with tarfile.open(archive, 'r:gz') as tar:
            manifest = json.load(tar.extractfile('./manifest.json'))
            sql = tar.extractfile('./database.sql').read()
            assert hashlib.sha256(sql).hexdigest() == manifest['database_sha256']
            sqlfile = temp / 'database.sql'
            sqlfile.write_bytes(sql)
            spec = importlib.util.spec_from_file_location('backup_export', Path(__file__).with_name('export.py'))
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            module.validate_sql(sqlfile)
            for obj in manifest['objects']:
                member = tar.getmember('./' + obj['file'])
                assert member.isfile() and member.size == obj['size']
                with tar.extractfile(member) as data:
                    assert sha(data) == obj['sha256']
    print('Downloaded backup verified: decryption, SQLite restore, and every media hash passed.')


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print(f'Backup recovery verification failed ({type(exc).__name__}).')
        raise SystemExit(1)
