CREATE TABLE `promotion_uses` (
	`request_key` text PRIMARY KEY NOT NULL,
	`promotion_id` text NOT NULL,
	`customer_hash` text NOT NULL,
	`config` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `promotion_uses_customer` ON `promotion_uses` (`promotion_id`,`customer_hash`);--> statement-breakpoint
ALTER TABLE `promotions` ADD `config` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
CREATE TRIGGER promotion_availability_guard BEFORE INSERT ON promotion_uses
WHEN NOT EXISTS(SELECT 1 FROM promotions p WHERE p.id=NEW.promotion_id AND p.active=1 AND p.config=NEW.config AND (json_extract(p.config,'$.expiresAt') IS NULL OR julianday(json_extract(p.config,'$.expiresAt'))>julianday('now')))
BEGIN
 SELECT RAISE(ABORT,'promotion_unavailable');
END;
--> statement-breakpoint
CREATE TRIGGER promotion_limit_guard BEFORE INSERT ON promotion_uses
WHEN (SELECT COUNT(*) FROM promotion_uses WHERE promotion_id=NEW.promotion_id AND customer_hash=NEW.customer_hash)>=(SELECT json_extract(config,'$.maxUses') FROM promotions WHERE id=NEW.promotion_id)
BEGIN
 SELECT RAISE(ABORT,'promotion_limit');
END;
