# Publicación de mejoras de ropa y accesorios

Autorizada por el propietario después de revisar la prueba.

- Respaldo cifrado nuevo de D1 y R2: GitHub Actions 35961807090, completado y recuperación verificada.
- Código anterior: etiqueta `respaldo-antes-actualizacion-2026-09-24`, commit 2743df9.
- Worker anterior: versión `1510797c-f760-4dbf-9d56-3753e3e1b431`.
- Se conservan dominio, D1, R2, marca, cookies de administrador y flujo de respaldos originales.
- No se transfieren productos, usuarios, claves ni medios de prueba.
- Migraciones 0017–0019 agregan precios promocionales, revisiones/auditoría y verificación privada; identifican las líneas de pedidos históricos que descontaron inventario. No cambian precios, cantidades ni totales anteriores.
- La verificación incorpora explicación y consentimiento, eliminación por el propio cliente y limpieza por hora. Los respaldos nuevos omiten el prefijo temporal `verification/`; los datos de perfiles siguen en los respaldos cifrados de D1 (30 días).
- Reconocimiento de perfil mediante cookie privada y coincidencia de nombre/teléfono en ese navegador. No identifica rostros automáticamente ni autentica otro navegador usando solo datos personales.

Validación antes de publicar: TypeScript, compilación, despliegue simulado, 36 comprobaciones de integración locales y migración histórica probada con inventario mixto.

Recuperación: las migraciones son aditivas y el código anterior puede volver a desplegarse. Restaurar D1 completo solo con análisis previo, porque perdería pedidos posteriores al respaldo. No borrar tablas ni reemplazar las imágenes para revertir una versión de código.

## Resultado

Publicado correctamente en `scootermxmenu.com` y el Worker existente.
Versión: `98d469c2-d628-442f-b40a-910127325c49`. Código publicado: `2839766`.
Limpieza de documentos programada cada hora, minuto 17 UTC.

Comparación posterior: 4 productos con todos sus campos anteriores conservados y las 4 imágenes con el mismo SHA-256. Se conservaron 35 pedidos, 1 administrador y 862 unidades de inventario. Logo original confirmado. Las rutas privadas de pedidos, verificación y resumen rechazan acceso sin sesión (401).
