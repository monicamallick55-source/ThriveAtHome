-- Migration 079: Allow seniors who signed up directly (members.supabase_auth_id,
-- added in migration 049) to manage their own devices, wearables, EHR connections,
-- and fall-detection records.
--
-- The original policies on these tables (063_m22_device_integration.sql) only
-- recognized family_members.supabase_auth_id, so a direct-auth senior could never
-- link a device/wearable/EHR connection or see their own fall events — even though
-- app/api/devices/*, app/api/wearables/*, and app/api/ehr/* now resolve their
-- member_id correctly.

DROP POLICY IF EXISTS "member_direct_all_own_member_devices" ON member_devices;
CREATE POLICY "member_direct_all_own_member_devices" ON member_devices FOR ALL
  USING (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = member_devices.member_id
    AND m.supabase_auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = member_devices.member_id
    AND m.supabase_auth_id = auth.uid()
  ));

DROP POLICY IF EXISTS "member_direct_all_own_wearable_connections" ON wearable_connections;
CREATE POLICY "member_direct_all_own_wearable_connections" ON wearable_connections FOR ALL
  USING (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = wearable_connections.member_id
    AND m.supabase_auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = wearable_connections.member_id
    AND m.supabase_auth_id = auth.uid()
  ));

DROP POLICY IF EXISTS "member_direct_all_own_ehr_connections" ON ehr_connections;
CREATE POLICY "member_direct_all_own_ehr_connections" ON ehr_connections FOR ALL
  USING (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = ehr_connections.member_id
    AND m.supabase_auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = ehr_connections.member_id
    AND m.supabase_auth_id = auth.uid()
  ));

DROP POLICY IF EXISTS "member_direct_read_own_fhir_export_log" ON fhir_export_log;
CREATE POLICY "member_direct_read_own_fhir_export_log" ON fhir_export_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = fhir_export_log.member_id
    AND m.supabase_auth_id = auth.uid()
  ));

DROP POLICY IF EXISTS "member_direct_read_own_fall_events" ON fall_events;
CREATE POLICY "member_direct_read_own_fall_events" ON fall_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = fall_events.member_id
    AND m.supabase_auth_id = auth.uid()
  ));

DROP POLICY IF EXISTS "member_direct_read_own_device_signals" ON device_signals;
CREATE POLICY "member_direct_read_own_device_signals" ON device_signals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = device_signals.member_id
    AND m.supabase_auth_id = auth.uid()
  ));
