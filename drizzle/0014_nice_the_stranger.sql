CREATE TABLE `order_payment_events` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`shop_id` text NOT NULL,
	`actor` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL
);
