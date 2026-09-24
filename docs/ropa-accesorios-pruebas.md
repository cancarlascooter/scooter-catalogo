# Prueba independiente: ropa y accesorios

Rama `codex/ropa-accesorios-pruebas`. Solo recursos locales ficticios; no está publicada. No fusionar esta rama completa a producción: tiene configuraciones locales y la automatización de respaldo deshabilitada exclusivamente aquí.

## Iniciar

1. `npm ci`
2. `npm run db:migrate:preview`
3. En una base nueva: `node scripts/seed-clothing-preview.mjs` y `npx wrangler d1 execute DB --local --config wrangler.preview.json --file work/seed.sql`.
4. `npm run dev:preview`
5. Abrir `http://localhost:8796/acceso`. Las credenciales ficticias generadas están en `work/access.json`, ignorado por Git. No copiar credenciales de otra tienda.

## Cambios

- Menú superior izquierdo; conserva el resumen autorizado y muestra una sola sección.
- Pedidos: edición de datos, sucursal, variantes, cantidades y código de promoción; eliminación lógica con auditoría. Cambios atómicos con revisión para evitar sobrescribir otro cambio. Recalcula ventas pagadas e inventario. Eliminar también libera uso de cupón.
- Resumen: acción manual de WhatsApp al principio y nota de DiDi/Uber solo para MTY/CDMX. Sin número configurado no se permite enviar.
- Precio de promoción por producto: precio naranja arriba del original tachado. El ahorro fijo del precio base se descuenta también de variantes y paquetería; el servidor valida todos los precios.
- Verificaciones: revisión manual con permiso independiente, imágenes privadas y consentimiento. Solo usar documentos ficticios en esta prueba. Se eliminan al resolver la solicitud; después de siete días la limpieza se ejecuta al consultar el módulo, no mediante una tarea programada. Antes de uso real se requiere definir el aviso de privacidad y una limpieza programada.
- El reconocimiento requiere la cookie privada del navegador y que coincidan nombre y teléfono normalizados. No autentica otro navegador con nombre/teléfono solamente. No usa reconocimiento facial ni valida autenticidad de la INE automáticamente.

## Validación

`npx tsc --noEmit`, `npm run build:cloudflare` (solo compilación), `node tests/clothing-integration.mjs`.
El test usa exclusivamente localhost:8796 y `work/access.json`. Crea datos ficticios para probar precios, promociones, stock, cambios concurrentes, permisos de vendedor y privacidad de documentos. Ejecutar solo en esta prueba.

El dominio público y el respaldo de la rama principal permanecen separados.
