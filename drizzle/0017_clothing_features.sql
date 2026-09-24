ALTER TABLE products ADD sale_price INTEGER CHECK(sale_price IS NULL OR (sale_price>0 AND sale_price<price));
ALTER TABLE orders ADD revision INTEGER NOT NULL DEFAULT 0;
CREATE TABLE order_edits(id TEXT PRIMARY KEY,order_id TEXT NOT NULL,shop_id TEXT NOT NULL,actor TEXT NOT NULL,action TEXT NOT NULL,snapshot TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE customer_verifications(id TEXT PRIMARY KEY,shop_id TEXT NOT NULL,name TEXT NOT NULL,instagram TEXT NOT NULL,phone TEXT NOT NULL,secret_hash TEXT NOT NULL,consent_version TEXT NOT NULL DEFAULT '2026-09-24',status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),id_key TEXT NOT NULL,selfie_key TEXT NOT NULL,created_at TEXT NOT NULL,reviewed_at TEXT,reviewer TEXT);
CREATE INDEX verification_shop ON customer_verifications(shop_id,created_at);
