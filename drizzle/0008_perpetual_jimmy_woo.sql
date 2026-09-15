CREATE TABLE `product_imports` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`request_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `products` ADD `shipping_price` integer;