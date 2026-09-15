CREATE TABLE `push_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`targets` text NOT NULL,
	`next_offset` integer DEFAULT 0 NOT NULL,
	`sent` integer DEFAULT 0 NOT NULL,
	`failed` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_shop_endpoint_idx` ON `push_subscriptions` (`shop_id`,`endpoint`);