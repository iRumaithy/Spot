-- Story context survives expiry; the preview is a separate private thumbnail.
alter table public.spot_direct_messages
 add column story_id uuid,
 add column story_preview_path text,
 add column story_context jsonb;
alter table public.spot_direct_messages add constraint spot_dm_story_context_complete check (
 (story_id is null and story_preview_path is null and story_context is null)
 or (story_id is not null and story_preview_path is not null and story_context is not null and jsonb_typeof(story_context)='object')
);
create unique index spot_dm_story_preview_unique on public.spot_direct_messages(story_preview_path) where story_preview_path is not null;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('spot-dm-previews','spot-dm-previews',false,262144,array['image/jpeg']);
create policy "Active senders upload private DM previews" on storage.objects for insert to authenticated
with check(bucket_id='spot-dm-previews'
 and (storage.foldername(name))[1]=(select auth.uid())::text
 and name ~ ('^'||(select auth.uid())::text||'/[0-9a-f-]{36}\.jpg$')
 and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active));
create policy "Only DM participants read story previews" on storage.objects for select to authenticated
using(bucket_id='spot-dm-previews'
 and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active)
 and ((storage.foldername(name))[1]=(select auth.uid())::text
 or exists(select 1 from public.spot_direct_messages m where m.story_preview_path=objects.name
 and (m.sender_id=(select auth.uid()) or m.recipient_id=(select auth.uid())))));
create function private.spot_validate_story_reply() returns trigger
language plpgsql security invoker set search_path='' as $$
declare story public.spot_stories%rowtype;
begin
 if new.story_id is null then
  if new.story_preview_path is not null or new.story_context is not null then raise exception 'Story reference required';end if;
  return new;
 end if;
 if new.sender_id is distinct from (select auth.uid()) then raise exception 'Invalid story reply author';end if;
 select * into story from public.spot_stories s where s.id=new.story_id and s.expires_at>now();
 if not found or not private.spot_can_view_content(story.owner_id) then raise exception 'Story is unavailable';end if;
 if new.recipient_id<>story.owner_id or new.sender_id=story.owner_id then raise exception 'Reply recipient must own the story';end if;
 if new.story_preview_path is distinct from new.sender_id::text||'/'||new.id::text||'.jpg' then raise exception 'Invalid preview path';end if;
 if not exists(select 1 from storage.objects o where o.bucket_id='spot-dm-previews' and o.name=new.story_preview_path) then raise exception 'Preview upload required';end if;
 new.story_context=jsonb_build_object('owner_id',story.owner_id,'media_type',story.media_type,
 'caption',left(story.caption,300),'created_at',story.created_at,'expires_at',story.expires_at);
 return new;
end $$;
revoke all on function private.spot_validate_story_reply() from public,anon,authenticated;
create trigger spot_validate_story_reply before insert on public.spot_direct_messages
for each row execute function private.spot_validate_story_reply();
-- Retain the existing read-receipt behavior while also protecting new context fields.
create or replace function private.spot_secure_dm_updates() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if (to_jsonb(new)-'read_at') is distinct from (to_jsonb(old)-'read_at') then raise exception 'Messages are immutable';end if;
 if old.read_at is not null and new.read_at is distinct from old.read_at then raise exception 'Read status cannot be reset';end if;
 return new;
end $$;
notify pgrst,'reload schema';
