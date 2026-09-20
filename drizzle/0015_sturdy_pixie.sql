ALTER TABLE `admin_invites` ADD `permissions` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `admin_users` ADD `permissions` text DEFAULT '[]' NOT NULL;
--> statement-breakpoint
UPDATE admin_users SET permissions='["mis-ventas","pedidos","negocio","productos","configuracion-catalogo","inventario","videos-admin","promociones","notificaciones"]';

--> statement-breakpoint
UPDATE admin_invites SET permissions='["mis-ventas","pedidos","negocio","productos","configuracion-catalogo","inventario","videos-admin","promociones","notificaciones"]';
