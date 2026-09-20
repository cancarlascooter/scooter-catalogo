ALTER TABLE `orders` ADD `salesperson_id` text;
--> statement-breakpoint
UPDATE orders SET salesperson_id=(
 SELECT u.id FROM order_payment_events e
 JOIN admin_users u ON u.email=e.actor
 JOIN shops s ON s.owner=u.owner_id AND s.id=e.shop_id
 WHERE e.order_id=orders.id AND e.shop_id=orders.shop_id AND e.status='paid'
 ORDER BY e.created_at DESC,e.rowid DESC LIMIT 1
) WHERE status='paid';
