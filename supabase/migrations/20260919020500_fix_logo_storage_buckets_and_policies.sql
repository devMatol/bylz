INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES 
  ('logos', 'logos', true, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'], 5242880),
  ('company-assets', 'company-assets', true, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'], 5242880)
ON CONFLICT (id) DO UPDATE
SET public = true,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'],
    file_size_limit = 5242880;

DROP POLICY IF EXISTS "public read logos" ON storage.objects;
DROP POLICY IF EXISTS "users read own logos" ON storage.objects;
CREATE POLICY "public read logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('logos', 'company-assets'));

DROP POLICY IF EXISTS "users upload own logos" ON storage.objects;
DROP POLICY IF EXISTS "authenticated upload logos and company-assets" ON storage.objects;
CREATE POLICY "authenticated upload logos and company-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('logos', 'company-assets'));

DROP POLICY IF EXISTS "authenticated update logos and company-assets" ON storage.objects;
CREATE POLICY "authenticated update logos and company-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id IN ('logos', 'company-assets'))
WITH CHECK (bucket_id IN ('logos', 'company-assets'));

DROP POLICY IF EXISTS "authenticated delete logos and company-assets" ON storage.objects;
CREATE POLICY "authenticated delete logos and company-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id IN ('logos', 'company-assets'));
