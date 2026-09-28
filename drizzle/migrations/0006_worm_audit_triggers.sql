-- WORM Audit Logs via DB Triggers - True Immutability for Financial Compliance
-- Application-level append-only is insufficient, need database-level enforcement

-- Trigger function that prevents UPDATE and DELETE on audit tables
CREATE OR REPLACE FUNCTION prevent_audit_update() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'WORM Compliance: % table is append-only, UPDATE/DELETE not allowed. Attempted % on record % at % by current_user=%', 
    TG_TABLE_NAME, TG_OP, COALESCE(NEW.id::text, OLD.id::text), NOW(), current_user
    USING ERRCODE = 'P0001', HINT = 'Audit logs are WORM-lite immutable per financial compliance. Use INSERT only.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to audit_log table - prevent UPDATE and DELETE
DROP TRIGGER IF EXISTS trg_audit_log_no_update ON audit_log;
CREATE TRIGGER trg_audit_log_no_update
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_update();

-- Apply trigger to audit_document_flow table - prevent UPDATE and DELETE
DROP TRIGGER IF EXISTS trg_audit_document_flow_no_update ON audit_document_flow;
CREATE TRIGGER trg_audit_document_flow_no_update
  BEFORE UPDATE OR DELETE ON audit_document_flow
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_update();

-- Additional: Ensure audit_log has no UPDATE/DELETE via RLS or additional check
-- Create audit_log_immutable view for compliance reporting
CREATE OR REPLACE VIEW audit_log_immutable AS
SELECT 
  id,
  table_name,
  record_id,
  record_number,
  action,
  old_values,
  new_values,
  changed_fields,
  changed_by,
  changed_at,
  description,
  transaction_id,
  created_at
FROM audit_log
ORDER BY changed_at DESC;

-- Comment for compliance documentation
COMMENT ON FUNCTION prevent_audit_update() IS 'WORM Compliance: Prevents UPDATE/DELETE on audit tables for financial compliance. Audit logs are append-only per SOX, GDPR, and internal audit requirements. Only INSERT allowed.';
COMMENT ON TRIGGER trg_audit_log_no_update ON audit_log IS 'WORM: Blocks UPDATE/DELETE on audit_log for compliance';
COMMENT ON TRIGGER trg_audit_document_flow_no_update ON audit_document_flow IS 'WORM: Blocks UPDATE/DELETE on audit_document_flow for compliance';

-- Ensure audit tables have proper indexes for WORM performance
CREATE INDEX IF NOT EXISTS idx_audit_log_worm_compliance ON audit_log USING btree (table_name, record_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_document_flow_worm ON audit_document_flow USING btree (root_type, root_id, created_at DESC);
