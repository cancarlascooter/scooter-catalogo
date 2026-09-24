CREATE TABLE order_edit_guards(id TEXT PRIMARY KEY, order_id TEXT NOT NULL, revision INTEGER NOT NULL);
CREATE TRIGGER guard_order_revision BEFORE INSERT ON order_edit_guards
WHEN NOT EXISTS(SELECT 1 FROM orders WHERE id=NEW.order_id AND revision=NEW.revision AND status<>'cancelled')
BEGIN SELECT RAISE(ABORT,'order_changed'); END;
