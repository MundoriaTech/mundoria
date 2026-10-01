-- Cleaners can remove their own ID and DBS files only while onboarding is still a draft.
-- After submission the documents are the review record and stay in storage.

drop policy if exists "Cleaners delete own draft documents" on storage.objects;

create policy "Cleaners delete own draft documents"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'cleaner-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.cleaner_profiles
    where id = auth.uid()
      and onboarding_complete = false
  )
);
