-- Additive: existing experiences and publication dates remain untouched.
create table public.spot_post_comments (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.social_posts(id) on delete cascade,
 author_id uuid not null references public.profiles(id) on delete cascade,
 parent_id uuid,
 body text not null check (char_length(btrim(body)) between 1 and 2000),
 created_at timestamptz not null default now(),
 unique(id,post_id),
 foreign key(parent_id,post_id) references public.spot_post_comments(id,post_id) on delete cascade,
 check(parent_id is null or parent_id<>id)
);
create index spot_comments_post_thread_time on public.spot_post_comments(post_id,parent_id,created_at,id);
create index spot_comments_author on public.spot_post_comments(author_id);
create index spot_comments_parent on public.spot_post_comments(parent_id,post_id);
alter table public.spot_post_comments enable row level security;
revoke all on public.spot_post_comments from anon,authenticated;
grant select on public.spot_post_comments to anon,authenticated;
grant insert(id,post_id,author_id,parent_id,body),delete on public.spot_post_comments to authenticated;
create policy "Comments follow post audience" on public.spot_post_comments for select to anon,authenticated
using (exists(select 1 from public.social_posts p where p.id=post_id and private.spot_can_view_content(p.owner_id)));
create policy "Active members comment on visible posts" on public.spot_post_comments for insert to authenticated
with check (author_id=(select auth.uid())
 and exists(select 1 from public.profiles me where me.id=(select auth.uid()) and me.is_active)
 and exists(select 1 from public.social_posts p where p.id=post_id and private.spot_can_view_content(p.owner_id)));
create policy "Comment author or post owner can delete" on public.spot_post_comments for delete to authenticated
using (exists(select 1 from public.profiles me where me.id=(select auth.uid()) and me.is_active)
 and exists(select 1 from public.social_posts p where p.id=post_id and private.spot_can_view_content(p.owner_id)
 and (author_id=(select auth.uid()) or p.owner_id=(select auth.uid()))));
create function private.spot_validate_comment_thread() returns trigger language plpgsql set search_path='' as $$
begin
 if new.parent_id is not null and not exists(select 1 from public.spot_post_comments p where p.id=new.parent_id and p.post_id=new.post_id and p.parent_id is null) then
  raise exception 'Reply must reference a visible root comment on the same post';
 end if;
 return new;
end $$;
create trigger spot_validate_comment_thread before insert on public.spot_post_comments for each row execute function private.spot_validate_comment_thread();
create function public.spot_comment_summary(p_ids uuid[]) returns table(post_id uuid,total bigint)
language sql stable security invoker set search_path='' as $$
 select c.post_id,count(*) from public.spot_post_comments c where c.post_id=any(p_ids) group by c.post_id
$$;
create function public.spot_comment_page(p_post uuid,p_parent uuid default null,p_offset integer default 0)
returns table(id uuid,post_id uuid,author_id uuid,parent_id uuid,body text,created_at timestamptz,reply_count bigint)
language sql stable security invoker set search_path='' as $$
 select c.id,c.post_id,c.author_id,c.parent_id,c.body,c.created_at,
 (select count(*) from public.spot_post_comments r where r.parent_id=c.id) as reply_count
 from public.spot_post_comments c where c.post_id=p_post and c.parent_id is not distinct from p_parent
 order by case when p_parent is null then c.created_at end desc,c.created_at,c.id limit 21 offset greatest(0,least(coalesce(p_offset,0),100000))
$$;
revoke all on function private.spot_validate_comment_thread() from public,anon,authenticated;
revoke all on function public.spot_comment_summary(uuid[]),public.spot_comment_page(uuid,uuid,integer) from public;
grant execute on function public.spot_comment_summary(uuid[]),public.spot_comment_page(uuid,uuid,integer) to anon,authenticated;
alter publication supabase_realtime add table public.spot_post_comments;
notify pgrst,'reload schema';
