ALTER TABLE `products` ADD `options` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
CREATE INDEX `orders_shop_date_idx` ON `orders` (`shop_id`,`created_at`);