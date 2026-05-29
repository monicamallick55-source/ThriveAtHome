-- Memory Books: stores metadata for generated Memory Book PDFs

CREATE TABLE memory_books (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title            text NOT NULL DEFAULT 'My Memory Book',
  dedication       text,
  layout_style     text NOT NULL DEFAULT 'classic',
  entry_ids        uuid[] NOT NULL DEFAULT '{}',
  cover_photo_path text,
  storage_path     text,
  page_count       int,
  status           text NOT NULL DEFAULT 'generated'
);

ALTER TABLE memory_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family_all_own_memory_books" ON memory_books FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.member_id = memory_books.member_id
      AND fm.supabase_auth_id = auth.uid()
  )
);

CREATE POLICY "admin_read_memory_books" ON memory_books FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
      AND fm.role IN ('admin', 'navigator')
  )
);

-- Storage bucket for Memory Book PDFs (private, 50MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'memory-books',
  'memory-books',
  false,
  52428800,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: family members can upload PDFs for their linked member
CREATE POLICY "family_upload_memory_books"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'memory-books'
  AND (storage.foldername(name))[1] IN (
    SELECT m.id::text
    FROM members m
    JOIN family_members fm ON fm.member_id = m.id
    WHERE fm.supabase_auth_id = auth.uid()
  )
);

-- Storage policy: family members can read their PDFs
CREATE POLICY "family_read_memory_books"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'memory-books'
  AND (storage.foldername(name))[1] IN (
    SELECT m.id::text
    FROM members m
    JOIN family_members fm ON fm.member_id = m.id
    WHERE fm.supabase_auth_id = auth.uid()
  )
);

-- Storage policy: admin/navigator can read all memory books
CREATE POLICY "admin_read_all_memory_books"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'memory-books'
  AND EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
      AND fm.role IN ('admin', 'navigator')
  )
);
