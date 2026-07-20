-- Create logos storage bucket
-- Creates a private bucket `logos` for user-uploaded company logos.
-- Enforces allowed MIME types: image/png and image/jpeg only, max 2MB.
-- RLS: authenticated users can upload and read objects under their own folder.

INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES ('logos', 'logos', false, ARRAY['image/png', 'image/jpeg'], 2097152)
ON CONFLICT (id) DO UPDATE
SET allowed_mime_types = ARRAY['image/png', 'image/jpeg'],
    file_size_limit = 2097152;

DROP POLICY IF EXISTS "users upload own logos" ON storage.objects;
CREATE POLICY "users upload own logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "users read own logos" ON storage.objects;
CREATE POLICY "users read own logos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);
