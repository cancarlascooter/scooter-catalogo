# Catálogo unificado en Cloudflare

## Enlaces

- Catálogo público: https://catalogo-pedidos.scootermexico.workers.dev/
- Administración: https://catalogo-pedidos.scootermexico.workers.dev/administrador
- Acceso: https://catalogo-pedidos.scootermexico.workers.dev/acceso

## Uso diario (sin IA)

1. Crea tu primera cuenta desde la pantalla de activación privada entregada por separado. El enlace solo sirve hasta crear la primera cuenta. No lo compartas.
2. Entra al administrador con tu correo y contraseña.
3. Actualiza el nombre del negocio y el WhatsApp que recibe los pedidos.
4. Pulsa Agregar producto. Carga una foto de tu dispositivo, nombre, precio, descripción, opciones y sucursales. Guarda.
5. Carga inventario por sucursal o registra restock. Paquetería comparte inventario con Monterrey y agrega $300 al pedido.
6. Para Excel, descarga primero la plantilla desde Importar productos. Las fotos se agregan desde Editar producto.
7. Comparte el enlace público. El resumen queda dentro de la página; el cliente envía el enlace del pedido por WhatsApp y tú acuerdas el pago.
8. Consulta y exporta los pedidos desde el panel. Administra promociones, videos y notificaciones ahí mismo.
9. En Mi cuenta y administradores puedes cambiar tu contraseña, generar invitaciones de 24 horas vinculadas a un correo y revocar administradores. Cambiar contraseña cierra las demás sesiones.

El catálogo real inicia vacío; los ejemplos están separados en /tienda/ejemplo. El nuevo dominio es independiente de la versión anterior de ChatGPT. Las apps instaladas y sus permisos de notificaciones del dominio anterior no se trasladan: instala desde el nuevo catálogo y activa sus notificaciones. No se requiere ChatGPT ni IA para usarlo.

## Proyecto completo

Ventas y administrador viven en un solo proyecto y usan la misma base D1 y el mismo almacenamiento R2. No se deben desplegar los dos ZIP anteriores por separado.

- app/tienda y app/pedido: catálogo y resumen.
- app/administrador y app/admin.tsx: administración.
- app/acceso, app/api/admin-auth y lib/admin-auth.ts: cuentas y sesiones.
- wrangler.json: recursos de Cloudflare.
- vite.cloudflare.config.ts: compilación independiente.
- drizzle: migraciones de base de datos.

## Publicar cambios de código

Node >=22.13. Ejecutar npm ci, npx wrangler login, npm run db:migrate:cloudflare y npm run deploy:cloudflare. Para actualizar productos no hacen falta estos comandos: se usa el panel.

Los secretos ADMIN_SETUP_TOKEN, VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY están en Cloudflare. No están en GitHub ni en el ZIP. Nunca subir .dev.vars ni dist/server/.dev.vars. AUTH_MODE=password es obligatorio en este alojamiento; no cambiarlo. El acceso anterior de Sites sigue aislado y no se usa en Cloudflare.

La cuenta propietaria se crea una sola vez mediante un token aleatorio. No hay registro público de administradores ni recuperación por correo automática. Conserva tu contraseña en un gestor; para recuperación sin sesión se requiere intervención técnica con acceso a tu cuenta Cloudflare. No vuelvas a abrir la inicialización borrando tablas.

## Validación local

npm run build:cloudflare
npx wrangler d1 migrations apply DB --local --config wrangler.json
npx wrangler dev --config dist/server/wrangler.json --local --port 8787 --persist-to .wrangler/state
node tests/cloudflare-smoke.mjs

La prueba crea datos solo en localhost y comprueba autenticación, permisos, imágenes, pedidos e invitaciones. Usa una base local de pruebas y ADMIN_SETUP_TOKEN en .dev.vars. Nunca apuntarla a producción.

## Copias de seguridad

GitHub y ZIP contienen el código y los recursos incluidos en public; no contienen los pedidos, productos o fotos guardados posteriormente en D1/R2. Respaldar D1 con wrangler d1 export DB --remote --config wrangler.json --output respaldo.sql y descargar los objetos de R2 desde la cuenta de Cloudflare o una herramienta compatible con S3. El respaldo puede contener datos personales: no subirlo a un repositorio público.
