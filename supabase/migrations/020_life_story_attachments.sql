-- Phase 40 ISSUE fix — Life Story: entry_type + file attachments
-- NOTE: Before running this migration, create a Storage bucket named "life-story-attachments"
--       in Supabase dashboard: Storage → New Bucket → name: life-story-attachments → Private

ALTER TABLE life_story_entries
  ADD COLUMN IF NOT EXISTS attachments text[] NOT NULL DEFAULT '{}';

-- Storage policies for life-story-attachments bucket
-- Family members can upload files whose path starts with their linked member_id
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'life-story-attachments',
  'life-story-attachments',
  false,
  10485760,  -- 10 MB
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "family_upload_life_story_attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'life-story-attachments'
  AND EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
      AND split_part(name, '/', 1) = fm.member_id::text
  )
);

CREATE POLICY "family_read_life_story_attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'life-story-attachments'
  AND EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
      AND split_part(name, '/', 1) = fm.member_id::text
  )
);

CREATE POLICY "family_delete_life_story_attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'life-story-attachments'
  AND EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
      AND split_part(name, '/', 1) = fm.member_id::text
  )
);

CREATE POLICY "admin_read_life_story_attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'life-story-attachments'
  AND EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
      AND fm.role IN ('admin', 'navigator')
  )
);
