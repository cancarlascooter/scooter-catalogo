# Respaldo diario cifrado

Estado: **preparado en GitHub privado; horario desactivado hasta resolver el permiso de exportación D1 y completar la prueba**.

Los cuatro secretos están configurados. La prueba confirmó que D1 Read permite
consultar la base, pero la exportación devuelve HTTP 401 / código 10000.
Está pendiente autorizar el permiso D1 Edit y repetir la prueba completa.
No confundir el repositorio de código con una copia de D1/R2.

## Qué prepara este proyecto

- `scripts/backup/export.py`: exportación SQL completa de D1, restauración temporal
  en SQLite y comprobación de integridad; descarga paginada de todos los objetos R2.
- `manifest.json`: claves originales, metadatos, tamaños y SHA-256 de los archivos.
- `scripts/backup/encrypt.sh`: archivo cifrado GPG AES-256 y verificación mediante
  descifrado y comparación del contenido, antes de subirlo al destino elegido.
- No modifica ni elimina datos de producción. Si R2 cambia mientras se copia,
  falla para que se repita; D1 y R2 no ofrecen aquí una instantánea transaccional conjunta.

## Credenciales necesarias en GitHub Actions Secrets

- `CLOUDFLARE_BACKUP_TOKEN`: token específico con el permiso mínimo que permita exportar D1.
- `R2_BACKUP_ACCESS_KEY_ID` y `R2_BACKUP_SECRET_ACCESS_KEY`: acceso S3 de **solo lectura**,
  limitado al bucket `catalogo-pedidos-media`.
- `BACKUP_PASSPHRASE`: contraseña de cifrado larga y aleatoria. El propietario debe
  conservarla también en un gestor de contraseñas independiente de GitHub.

No usar el inicio de sesión OAuth de Wrangler de una computadora como credencial
de la automatización. No poner claves, archivos SQL o copias sin cifrar en commits.

Identificadores públicos: usar los recursos D1/R2 de `wrangler.json`.
Variables de ejecución: `CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_ID`, `R2_BUCKET`,
`BACKUP_WORKDIR` (carpeta nueva) y `BACKUP_OUTPUT_DIR`.
Instalar Python, las dependencias de `scripts/backup/requirements.txt` y GnuPG.

## Restauración

1. Descargar una copia cifrada y comprobar `sha256sum -c SHA256SUMS`.
2. Descifrar con GnuPG y la contraseña conservada por el propietario.
3. Extraer en una carpeta privada y comprobar los SHA-256 del manifiesto.
4. Probar primero la importación SQL en una **nueva** base D1, nunca sobre producción.
5. Reponer los objetos en un bucket de prueba usando las claves y metadatos originales
   del manifiesto. Verificar fotos, productos y pedidos antes de cambiar los recursos activos.
6. Los secretos de ejecución (incluidas las claves VAPID) requieren custodia separada;
   la exportación D1/R2 no los incluye. Para un desastre total también conservar el código.

## Pendientes antes de activar

Resolver acceso de exportación D1, medir la copia cifrada y completar
la prueba de descarga/descifrado/restauración antes de habilitar el horario. GitHub Free incluye 500 MB compartidos de
almacenamiento de artefactos; con videos puede ser insuficiente para 30 copias completas.

## Tarea diaria en GitHub

El workflow `Respaldo diario cifrado` está preparado para las 07:17 UTC
(01:17 de Monterrey). GitHub puede retrasar ejecuciones programadas.
Solo se habilita el horario cuando la variable `BACKUP_ENABLED` vale `true`.
Antes deben configurarse los cuatro secretos y pasar una ejecución manual.
Los archivos cifrados se guardan como artifacts privados durante 30 días;
no se agregan los datos de clientes al historial Git.

Para descargar una copia: repositorio → Actions → Respaldo diario cifrado →
una ejecución exitosa → Artifacts → scooter-backup. Conserva la contraseña
fuera de GitHub, en tu administrador de contraseñas. Sin ella no se puede
recuperar el contenido. El código del proyecto se conserva en el repositorio.
Las credenciales del servicio no están incluidas en el respaldo de datos.

El espacio disponible depende de la cuenta y de otros consumos compartidos.
Si GitHub rechaza la subida por cuota, la ejecución falla: no existe una copia
nueva hasta solucionar la cuota y volver a ejecutar. No se contrata espacio
extra automáticamente. Revisa Actions y configura notificaciones de fallos
para tu cuenta. Se verificó en la cuenta cancarlascooter que Actions tiene activados avisos
en GitHub y por correo, solo para fallos; correo predeterminado cancarla19@gmail.com.
La entrega de un correo real no ha sido comprobada.
