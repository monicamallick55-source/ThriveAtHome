-- Migration 080: Allow seniors who signed up directly (members.supabase_auth_id,
-- added in migration 049) to manage their own service bookings and cultural
-- circle memberships/events/posts.
--
-- The original policies on these tables (025_services.sql, 010_cultural_circles.sql)
-- only recognized family_members.supabase_auth_id, so a direct-auth senior could
-- never book a service, join/leave a circle, RSVP to a circle event, or post to a
-- circle — even though app/api/services/* and app/api/circles/* now resolve their
-- member_id correctly.

DROP POLICY IF EXISTS "member_direct_all_own_bookings" ON service_bookings;
CREATE POLICY "member_direct_all_own_bookings" ON service_bookings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = service_bookings.member_id
    AND m.supabase_auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = service_bookings.member_id
    AND m.supabase_auth_id = auth.uid()
  ));

DROP POLICY IF EXISTS "member_direct_manage_own_memberships" ON circle_memberships;
CREATE POLICY "member_direct_manage_own_memberships" ON circle_memberships FOR ALL
  USING (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = circle_memberships.member_id
    AND m.supabase_auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = circle_memberships.member_id
    AND m.supabase_auth_id = auth.uid()
  ));

DROP POLICY IF EXISTS "member_direct_manage_own_rsvps" ON circle_event_rsvps;
CREATE POLICY "member_direct_manage_own_rsvps" ON circle_event_rsvps FOR ALL
  USING (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = circle_event_rsvps.member_id
    AND m.supabase_auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = circle_event_rsvps.member_id
    AND m.supabase_auth_id = auth.uid()
  ));

DROP POLICY IF EXISTS "member_direct_can_post_to_circles" ON circle_posts;
CREATE POLICY "member_direct_can_post_to_circles" ON circle_posts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = circle_posts.member_id
    AND m.supabase_auth_id = auth.uid()
  ));

DROP POLICY IF EXISTS "member_direct_can_delete_own_posts" ON circle_posts;
CREATE POLICY "member_direct_can_delete_own_posts" ON circle_posts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = circle_posts.member_id
    AND m.supabase_auth_id = auth.uid()
  ));
