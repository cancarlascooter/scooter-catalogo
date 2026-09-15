CREATE TABLE `inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`product_id` text NOT NULL,
	`stock_key` text NOT NULL,
	`branch` text NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL CONSTRAINT inventory_quantity_nonnegative CHECK (`quantity` >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_variant_branch_idx` ON `inventory` (`shop_id`,`stock_key`,`branch`);--> statement-breakpoint
CREATE TABLE `inventory_events` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`product_id` text NOT NULL,
	`stock_key` text NOT NULL,
	`branch` text NOT NULL,
	`mode` text NOT NULL,
	`quantity` integer NOT NULL,
	`expected` integer,
	`product_name` text NOT NULL,
	`options` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `inventory_events_shop_date_idx` ON `inventory_events` (`shop_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `products` ADD `inventory_tracked` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
