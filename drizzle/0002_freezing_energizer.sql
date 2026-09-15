CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`request_key` text NOT NULL,
	`request_hash` text NOT NULL,
	`shop_id` text NOT NULL,
	`created_at` text NOT NULL,
	`snapshot` text NOT NULL,
	`total` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_token_unique` ON `orders` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_request_key_unique` ON `orders` (`request_key`);