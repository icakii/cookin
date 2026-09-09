-- Run this in the Supabase SQL Editor to add profile picture storage.
-- Uploaded images are screened client-side (nsfwjs, in the browser, before
-- the upload ever happens) - this just wires up where the file lands.

alter table profiles add column if not exists avatar_url text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Files are stored as "<user_id>/avatar.<ext>" so folder-name checks scope
-- writes to the owner. The bucket is public, so reads don't need a policy.
create policy "Users upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
