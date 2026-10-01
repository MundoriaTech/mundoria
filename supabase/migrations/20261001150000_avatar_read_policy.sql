-- Headshot and profile-photo uploads need a read policy on avatars.
-- Without it, storage rejects the new file with a row-level security error.

drop policy if exists "Users can read own avatar" on storage.objects;
create policy "Users can read own avatar"
on storage.objects for select
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Public can read avatars" on storage.objects;
create policy "Public can read avatars"
on storage.objects for select
to public
using (bucket_id = 'avatars');
