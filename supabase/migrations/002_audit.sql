-- ThriveAtHome — Audit Triggers (Migration 002)
-- Run this AFTER 001_initial_schema.sql

CREATE OR REPLACE FUNCTION log_data_access()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO audit_log (user_id, action, resource_type, resource_id)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id::text ELSE NEW.id::text END
  );
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER members_audit
  AFTER INSERT OR UPDATE OR DELETE ON members
  FOR EACH ROW EXECUTE FUNCTION log_data_access();

CREATE TRIGGER calls_audit
  AFTER INSERT OR UPDATE OR DELETE ON check_in_calls
  FOR EACH ROW EXECUTE FUNCTION log_data_access();

CREATE TRIGGER alerts_audit
  AFTER INSERT OR UPDATE OR DELETE ON alerts
  FOR EACH ROW EXECUTE FUNCTION log_data_access();
