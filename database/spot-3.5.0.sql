-- Story studio metadata and owner-only audience insights.
alter table public.spot_stories add column if not exists capture_source text not null default 'unknown' check(capture_source in ('camera','album','unknown'));
alter table public.spot_stories add column if not exists media_duration numeric check(media_duration is null or (media_duration>0 and media_duration<=30.5));
alter table public.spot_stories add column if not exists fit_mode text not null default 'contain' check(fit_mode in ('contain','cover'));
create policy "Story owner reads audience" on public.spot_story_views for select to authenticated using(exists(select 1 from public.spot_stories s where s.id=spot_story_views.story_id and s.owner_id=(select auth.uid())));
create index if not exists spot_story_views_time on public.spot_story_views(story_id,viewed_at desc);
-- A platform administrator may manage accounts, but may not rewrite another member's reviews.
alter policy "Place owner insert" on public.places with check(owner_id=(select auth.uid()) and private.can_manage_owner(owner_id));
alter policy "Place owner update" on public.places using(owner_id=(select auth.uid()) and private.can_manage_owner(owner_id)) with check(owner_id=(select auth.uid()) and private.can_manage_owner(owner_id));
alter policy "Place owner delete" on public.places using(owner_id=(select auth.uid()) and private.can_manage_owner(owner_id));
alter policy "Visit owner insert" on public.visits with check(owner_id=(select auth.uid()) and private.can_manage_owner(owner_id) and exists(select 1 from public.places p where p.id=visits.place_id and p.owner_id=visits.owner_id));
alter policy "Visit owner update" on public.visits using(owner_id=(select auth.uid()) and private.can_manage_owner(owner_id)) with check(owner_id=(select auth.uid()) and private.can_manage_owner(owner_id) and exists(select 1 from public.places p where p.id=visits.place_id and p.owner_id=visits.owner_id));
alter policy "Visit owner delete" on public.visits using(owner_id=(select auth.uid()) and private.can_manage_owner(owner_id));
alter policy "Item owner insert" on public.items with check(owner_id=(select auth.uid()) and private.can_manage_owner(owner_id) and exists(select 1 from public.visits v where v.id=items.visit_id and v.place_id=items.place_id and v.owner_id=items.owner_id));
alter policy "Item owner update" on public.items using(owner_id=(select auth.uid()) and private.can_manage_owner(owner_id)) with check(owner_id=(select auth.uid()) and private.can_manage_owner(owner_id) and exists(select 1 from public.visits v where v.id=items.visit_id and v.place_id=items.place_id and v.owner_id=items.owner_id));
alter policy "Item owner delete" on public.items using(owner_id=(select auth.uid()) and private.can_manage_owner(owner_id));
alter policy "Blog media upload" on storage.objects with check(bucket_id='blog-media' and (storage.foldername(name))[1]=(select auth.uid())::text and private.can_manage_owner((select auth.uid())));
alter policy "Blog media update" on storage.objects using(bucket_id='blog-media' and (storage.foldername(name))[1]=(select auth.uid())::text and private.can_manage_owner((select auth.uid()))) with check(bucket_id='blog-media' and (storage.foldername(name))[1]=(select auth.uid())::text and private.can_manage_owner((select auth.uid())));
alter policy "Blog media delete" on storage.objects using(bucket_id='blog-media' and (storage.foldername(name))[1]=(select auth.uid())::text and private.can_manage_owner((select auth.uid())));
