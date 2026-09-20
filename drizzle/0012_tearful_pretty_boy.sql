CREATE TABLE `shop_settings` (
	`shop_id` text PRIMARY KEY NOT NULL,
	`department_icons` text DEFAULT '{}' NOT NULL,
	`low_stock_threshold` integer DEFAULT 5 NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `store_presence` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`visitor` text NOT NULL,
	`last_seen` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `store_presence_shop_seen` ON `store_presence` (`shop_id`,`last_seen`);