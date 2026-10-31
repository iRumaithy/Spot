create policy "Spot protect private uploads" on storage.objects as restrictive for insert to authenticated with check(bucket_id<>'blog-media' or (storage.foldername(name))[2]='avatars' or not exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_private));
create policy "Spot protect private replacements" on storage.objects as restrictive for update to authenticated using(true) with check(bucket_id<>'blog-media' or (storage.foldername(name))[2]='avatars' or not exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_private));
revoke all on public.spot_stories, public.spot_story_views, public.spot_follow_requests from anon, authenticated;
grant select,insert,delete on public.spot_stories to authenticated;
grant select,insert on public.spot_story_views to authenticated;
grant select on public.spot_follow_requests to authenticated;
