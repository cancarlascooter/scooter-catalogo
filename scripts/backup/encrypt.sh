#!/usr/bin/env bash
set -euo pipefail
umask 077
: "${BACKUP_WORKDIR:?}"
: "${BACKUP_OUTPUT_DIR:?}"
: "${BACKUP_PASSPHRASE:?}"
mkdir -p "$BACKUP_OUTPUT_DIR"
private_dir=$(mktemp -d)
trap 'rm -rf "$private_dir"' EXIT
chmod 700 "$private_dir"
printf '%s' "$BACKUP_PASSPHRASE" > "$private_dir/passphrase"
archive="$private_dir/backup.tar.gz"
tar -czf "$archive" -C "$BACKUP_WORKDIR" .
gpg --batch --homedir "$private_dir" --pinentry-mode loopback \
  --passphrase-file "$private_dir/passphrase" --symmetric --cipher-algo AES256 \
  --output "$BACKUP_OUTPUT_DIR/backup.tar.gz.gpg" "$archive"
gpg --batch --homedir "$private_dir" --pinentry-mode loopback \
  --passphrase-file "$private_dir/passphrase" --decrypt \
  --output "$private_dir/verified.tar.gz" "$BACKUP_OUTPUT_DIR/backup.tar.gz.gpg"
cmp "$archive" "$private_dir/verified.tar.gz"
(cd "$BACKUP_OUTPUT_DIR" && sha256sum backup.tar.gz.gpg > SHA256SUMS)
echo 'Encrypted backup verified.'
