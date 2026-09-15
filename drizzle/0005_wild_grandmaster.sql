CREATE TABLE `promotions` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`code` text NOT NULL,
	`percent` integer NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `promotions_shop_code_idx` ON `promotions` (`shop_id`,`code`);