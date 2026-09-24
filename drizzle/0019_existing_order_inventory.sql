-- Preserve which historical order lines actually deducted tracked inventory.
UPDATE orders SET snapshot=json_set(snapshot,'$.items',json((
 SELECT json_group_array(json(json_set(line.value,'$.inventoryTracked',json(CASE WHEN EXISTS(
 SELECT 1 FROM inventory_events e WHERE e.id LIKE orders.id||':%' AND e.shop_id=orders.shop_id
 AND e.product_id=json_extract(line.value,'$.id') AND e.stock_key=json_extract(line.value,'$.stockKey')
 AND e.mode='order' AND e.quantity<0
 ) THEN 'true' ELSE 'false' END))))
 FROM json_each(orders.snapshot,'$.items') line
))) WHERE EXISTS(SELECT 1 FROM json_each(orders.snapshot,'$.items') line WHERE json_type(line.value,'$.inventoryTracked') IS NULL);
