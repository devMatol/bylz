/*
# Create private "documents" storage bucket for PDFs

1. Storage
- Create a private bucket "documents" (no public access) to hold generated
  quote/invoice PDFs, stored at {company_id}/{type}-{number}.pdf.
2. Security (RLS on storage.objects)
- Only authenticated users may operate on objects under "documents".
- A user may read/write only objects whose path prefix matches a company
  they own: the object key MUST start with their company id.
- The edge function (service role) bypasses RLS to write the PDF and to
  create a signed URL.
3. Notes
- Signed URLs (1h) are generated server-side by the generate-pdf edge
  function using the service role key; the frontend never reads the
  bucket directly.
*/

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Drop existing policies (idempotent) then recreate
drop policy if exists "documents_read_own" on storage.objects;
drop policy if exists "documents_write_own" on storage.objects;

-- Users can read objects under their own company prefix
create policy "documents_read_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'documents'
  and exists (
    select 1 from companies c
    where c.user_id = auth.uid()
    and (storage.foldername(name))[1] = c.id::text
  )
);

-- Users can write objects under their own company prefix
create policy "documents_write_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'documents'
  and exists (
    select 1 from companies c
    where c.user_id = auth.uid()
    and (storage.foldername(name))[1] = c.id::text
  )
);
