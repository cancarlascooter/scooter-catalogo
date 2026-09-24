# Versión de prueba

Rama: `codex/pruebas-catalogo`, creada desde `origin/main`.

La tienda pública permanece en Cloudflare. Esta rama tiene una prueba local con
base de datos y archivos separados. No copia pedidos ni cuentas de clientes.
Las credenciales del administrador de producción no sirven en esta prueba.

## Abrir prueba

1. Instalar dependencias con `npm ci`.
2. Aplicar las migraciones locales con `npm run db:migrate:preview`.
3. Ejecutar `npm run dev:preview`.
4. Abrir http://localhost:8795/tienda/ejemplo para el catálogo de muestra.

El administrador está en http://localhost:8795/acceso. Para crear su cuenta de
prueba, definir ADMIN_SETUP_TOKEN en `.dev.vars` (archivo ignorado por Git) y abrir
`/acceso#setup=EL_TOKEN_LOCAL`. No usar secretos de producción.

La vista local funciona mientras el servidor esté encendido en esta computadora.
No es un enlace público para compartir. Las fotos subidas y pedidos creados aquí
solo se guardan localmente.

## Guardar y aprobar

Guardar commits y subir únicamente a `origin codex/pruebas-catalogo`.
Verificar los cambios aquí y pedir la aprobación del propietario antes de fusionar
con main o publicar. La rama por sí misma no publica la tienda. El workflow de
respaldos continúa operando sobre producción desde main; no ejecutarlo desde esta rama.
