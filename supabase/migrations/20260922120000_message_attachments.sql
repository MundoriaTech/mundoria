-- Message media attachments (photos / videos) + storage bucket

alter table public.messages
  add column if not exists attachments jsonb not null default '[]'::jsonb;

do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.messages'::regclass
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%char_length(trim(content))%'
  loop
    execute format('alter table public.messages drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.messages
  drop constraint if exists messages_content_or_attachments;

alter table public.messages
  add constraint messages_content_or_attachments check (
    char_length(trim(content)) > 0
    or jsonb_array_length(attachments) > 0
  );

comment on column public.messages.attachments is
  'JSON array of {url, type: image|video, mime, name?}';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'message-media',
  'message-media',
  true,
  26214400,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload own message media" on storage.objects;
create policy "Users upload own message media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'message-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users update own message media" on storage.objects;
create policy "Users update own message media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'message-media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'message-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users delete own message media" on storage.objects;
create policy "Users delete own message media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'message-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Authenticated read message media" on storage.objects;
create policy "Authenticated read message media"
on storage.objects for select
to authenticated
using (bucket_id = 'message-media');
