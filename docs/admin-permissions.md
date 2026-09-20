# Permisos por perfil

En Mi cuenta y administradores, el propietario selecciona las secciones al invitar o usa Guardar permisos para un perfil existente. Usar perfil de ventas habilita Pedidos y pagos + Mis ventas. Un perfil sin secciones conserva su cambio de contraseña.

- Tu negocio hoy y el historial global son exclusivos del propietario: no aparecen como permisos delegables, y las API los rechazan para otros usuarios.
- Las otras secciones son accesos completos (ver y usar), no permisos separados de lectura y edición.
- Cada API privada comprueba los permisos guardados en cada solicitud. El menú se sincroniza cada 30 segundos y al volver a la ventana.
- Las ventas personales corresponden al usuario que marca el pago. No se puede elegir otro vendedor mediante parámetros del reporte.
- Los vendedores con acceso a pedidos ven los pendientes compartidos y sus propios pedidos pagados. No ven pedidos pagados por otros vendedores en la lista privada ni en sus exportaciones.
- Solo el propietario puede corregir un pago de otro perfil. El cambio de estado y la atribución se aplican juntos para evitar duplicar o tomar una venta durante solicitudes simultáneas.
- Las cifras se agrupan por fecha del pedido en horario de Monterrey; incluyen descuentos y envío. Solo cuentan pagos registrados, no pendientes.
- Los pagos anteriores se vinculan con el perfil que figura en el registro de pago, cuando esa cuenta todavía existe. Si no se puede identificar, quedan en el reporte global y no se atribuyen a un vendedor arbitrario.
- La migración conserva las demás secciones que los administradores existentes ya podían usar, pero retira el acceso global a quienes no son propietarios.

Validación: tests/admin-permissions.mjs ejecuta pruebas locales de invitaciones, aislamiento, bloqueo de API, permisos en sesiones abiertas y pagos simultáneos. Prueba visual adicional en navegador móvil para propietario y vendedor.
