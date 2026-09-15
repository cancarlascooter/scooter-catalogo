CREATE TABLE `videos` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`title` text NOT NULL,
	`source` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `videos_shop_created_idx` ON `videos` (`shop_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `products` ADD `department` text DEFAULT 'General' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `category` text DEFAULT 'General' NOT NULL;