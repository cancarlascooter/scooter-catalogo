export const adminSections=[
 {id:'verificaciones',label:'Verificaciones',description:'Revisar documentos privados y aprobar o rechazar clientes.'},
 {id:'mis-ventas',label:'Mis ventas',description:'Solo las ventas que este perfil marque como pagadas; filtros por día, semana, quincena o mes.'},
 {id:'pedidos',label:'Pedidos y pagos',description:'Datos de clientes, reportes y marcar pedidos como pagados.'},
 {id:'negocio',label:'Negocio y WhatsApp',description:'Cambiar nombre y número para recibir pedidos.'},
 {id:'productos',label:'Productos',description:'Crear, editar, eliminar e importar productos desde Excel.'},
 {id:'configuracion-catalogo',label:'Símbolos y alertas',description:'Cambiar símbolos de departamentos y umbral de inventario bajo.'},
 {id:'inventario',label:'Inventario y restock',description:'Consultar movimientos y actualizar existencias.'},
 {id:'videos-admin',label:'Videos',description:'Subir y eliminar videos.'},
 {id:'promociones',label:'Promociones',description:'Crear, editar y activar descuentos y mensajes promocionales.'},
 {id:'notificaciones',label:'Notificaciones',description:'Consultar suscriptores y enviar avisos a clientes.'},
] as const;
export type AdminSection=typeof adminSections[number]['id']|'resumen'|'ventas';
export const selectableAdminPermissions=adminSections.map(s=>s.id);
export const allAdminPermissions:AdminSection[]=['resumen','ventas',...selectableAdminPermissions];
export function parseAdminPermissions(value:unknown):AdminSection[]{try{const list=typeof value==='string'?JSON.parse(value):value;return Array.isArray(list)?selectableAdminPermissions.filter(id=>list.includes(id)):[]}catch{return []}}
export function effectivePermissions(user:{is_owner:number,permissions?:unknown}){return user.is_owner?[...allAdminPermissions]:parseAdminPermissions(user.permissions)}
