CREATE TABLE `inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`product_id` text NOT NULL,
	`stock_key` text NOT NULL,
	`branch` text NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL
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
CREATE TRIGGER inventory_nonnegative_insert BEFORE INSERT ON inventory WHEN NEW.quantity < 0 BEGIN SELECT RAISE(ABORT,'inventory_unavailable'); END;
--> statement-breakpoint
CREATE TRIGGER inventory_nonnegative_update BEFORE UPDATE OF quantity ON inventory WHEN NEW.quantity < 0 BEGIN SELECT RAISE(ABORT,'inventory_unavailable'); END;
--> statement-breakpoint
CREATE TRIGGER inventory_event_guard BEFORE INSERT ON inventory_events WHEN NEW.mode IN ('set','add') BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM products WHERE id=NEW.product_id AND shop_id=NEW.shop_id) THEN RAISE(ABORT,'inventory_product_missing') END;
 SELECT CASE WHEN NEW.mode='set' AND COALESCE((SELECT quantity FROM inventory WHERE shop_id=NEW.shop_id AND stock_key=NEW.stock_key AND branch=NEW.branch),0) != NEW.expected THEN RAISE(ABORT,'inventory_changed') END;
END;
--> statement-breakpoint
CREATE TRIGGER inventory_event_apply AFTER INSERT ON inventory_events WHEN NEW.mode IN ('set','add') BEGIN
 INSERT INTO inventory(id,shop_id,product_id,stock_key,branch,quantity) VALUES(NEW.id,NEW.shop_id,NEW.product_id,NEW.stock_key,NEW.branch,0) ON CONFLICT(shop_id,stock_key,branch) DO NOTHING;
 UPDATE inventory SET quantity=CASE WHEN NEW.mode='set' THEN NEW.quantity ELSE quantity+NEW.quantity END WHERE shop_id=NEW.shop_id AND stock_key=NEW.stock_key AND branch=NEW.branch;
 UPDATE products SET inventory_tracked=1 WHERE id=NEW.product_id AND shop_id=NEW.shop_id;
END;
--> statement-breakpoint
CREATE TRIGGER order_inventory_guard BEFORE INSERT ON orders BEGIN
 SELECT CASE WHEN EXISTS(
 SELECT 1 FROM json_each(NEW.snapshot,'$.items') item JOIN products p ON p.id=json_extract(item.value,'$.id') AND p.shop_id=NEW.shop_id
 WHERE p.inventory_tracked=1 AND COALESCE((SELECT quantity FROM inventory WHERE shop_id=NEW.shop_id AND stock_key=json_extract(item.value,'$.stockKey') AND branch=CASE WHEN json_extract(NEW.snapshot,'$.fulfillment')='cdmx' THEN 'cdmx' ELSE 'mty' END),0)<json_extract(item.value,'$.quantity')
 ) THEN RAISE(ABORT,'inventory_unavailable') END;
END;
--> statement-breakpoint
CREATE TRIGGER order_inventory_apply AFTER INSERT ON orders BEGIN
 UPDATE inventory SET quantity=quantity-(SELECT SUM(json_extract(item.value,'$.quantity')) FROM json_each(NEW.snapshot,'$.items') item WHERE json_extract(item.value,'$.stockKey')=inventory.stock_key)
 WHERE shop_id=NEW.shop_id AND branch=CASE WHEN json_extract(NEW.snapshot,'$.fulfillment')='cdmx' THEN 'cdmx' ELSE 'mty' END
 AND stock_key IN(SELECT json_extract(item.value,'$.stockKey') FROM json_each(NEW.snapshot,'$.items') item JOIN products p ON p.id=json_extract(item.value,'$.id') AND p.shop_id=NEW.shop_id WHERE p.inventory_tracked=1);
 INSERT INTO inventory_events(id,shop_id,product_id,stock_key,branch,mode,quantity,expected,product_name,options,note,created_at)
 SELECT NEW.id||':'||item.key,NEW.shop_id,p.id,json_extract(item.value,'$.stockKey'),CASE WHEN json_extract(NEW.snapshot,'$.fulfillment')='cdmx' THEN 'cdmx' ELSE 'mty' END,'order',-json_extract(item.value,'$.quantity'),NULL,json_extract(item.value,'$.name'),COALESCE(json_extract(item.value,'$.options'),'[]'),'Pedido '||substr(NEW.id,1,8),NEW.created_at FROM json_each(NEW.snapshot,'$.items') item JOIN products p ON p.id=json_extract(item.value,'$.id') AND p.shop_id=NEW.shop_id WHERE p.inventory_tracked=1;
END;
