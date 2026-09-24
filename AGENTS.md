# Trabajo de prueba de Scooter

El usuario pidió trabajar en `codex/pruebas-catalogo` sin publicar todavía.
- No publicar en Cloudflare, cambiar dominios, fusionar a main ni ejecutar migraciones remotas sin una instrucción explícita posterior del propietario.
- Usar `npm run dev:preview` y `npm run db:migrate:preview` con recursos locales independientes definidos en wrangler.preview.json.
- No copiar credenciales de producción, datos de clientes ni suscripciones push a la prueba.
- Guardar cambios únicamente en la rama de trabajo, no en main.
- Antes de publicar cambios aprobados, revisar migraciones, verificar permisos y probar catálogo y administrador.
