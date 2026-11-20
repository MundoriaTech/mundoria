-- Public Mag / blog images. Admins upload; anyone can read (covers and in-body photos).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mag-media',
  'mag-media',
  true,
  8388608,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins upload mag media" on storage.objects;
create policy "Admins upload mag media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'mag-media'
  and public.has_role('admin'::public.user_role)
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Admins update mag media" on storage.objects;
create policy "Admins update mag media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'mag-media'
  and public.has_role('admin'::public.user_role)
)
with check (
  bucket_id = 'mag-media'
  and public.has_role('admin'::public.user_role)
);

drop policy if exists "Admins delete mag media" on storage.objects;
create policy "Admins delete mag media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'mag-media'
  and public.has_role('admin'::public.user_role)
);

drop policy if exists "Public can read mag media" on storage.objects;
create policy "Public can read mag media"
on storage.objects for select
to public
using (bucket_id = 'mag-media');
