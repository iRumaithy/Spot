-- Transactional integration test. Every change and notification is rolled back.
begin;
select set_config('spot.test_owner',(select id::text from public.profiles where is_active and role<>'admin' order by id limit 1),true);
select set_config('spot.test_viewer',(select id::text from public.profiles where is_active and role<>'admin' order by id offset 1 limit 1),true);
select set_config('request.jwt.claims','{"role":"service_role"}',true);
update public.profiles set is_private=true where id=current_setting('spot.test_owner')::uuid;
delete from public.social_follows where follower_id=current_setting('spot.test_viewer')::uuid and followed_id=current_setting('spot.test_owner')::uuid;
delete from public.spot_follow_requests where requester_id=current_setting('spot.test_viewer')::uuid and recipient_id=current_setting('spot.test_owner')::uuid;
select set_config('spot.test_story',gen_random_uuid()::text,true);
select set_config('spot.test_media',current_setting('spot.test_owner')||'/qa-'||gen_random_uuid()||'.jpg',true);
insert into storage.objects(bucket_id,name) values('spot-stories',current_setting('spot.test_media'));
insert into public.spot_stories(id,owner_id,media_path,media_type) values(current_setting('spot.test_story')::uuid,current_setting('spot.test_owner')::uuid,current_setting('spot.test_media'),'image');
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',current_setting('spot.test_viewer'))::text,true);
do $$begin
 if private.spot_can_view_content(current_setting('spot.test_owner')::uuid) then raise exception 'FAIL: private account visible'; end if;
 if exists(select 1 from public.spot_stories where id=current_setting('spot.test_story')::uuid) then raise exception 'FAIL: private story visible'; end if;
 if exists(select 1 from public.places where owner_id=current_setting('spot.test_owner')::uuid) or exists(select 1 from public.items where owner_id=current_setting('spot.test_owner')::uuid) or exists(select 1 from public.visits where owner_id=current_setting('spot.test_owner')::uuid) then raise exception 'FAIL: private content visible'; end if;
 if exists(select 1 from public.search_published_reviews() where owner_id=current_setting('spot.test_owner')::uuid) then raise exception 'FAIL: search leak'; end if;
 begin
  insert into public.social_follows(follower_id,followed_id) values(current_setting('spot.test_viewer')::uuid,current_setting('spot.test_owner')::uuid);
  raise exception 'FAIL: direct follow bypass';
 exception when insufficient_privilege then null; end;
 if public.spot_request_follow(current_setting('spot.test_owner')::uuid)<>'requested' then raise exception 'FAIL: request creation'; end if;
 if private.spot_can_view_content(current_setting('spot.test_owner')::uuid) then raise exception 'FAIL: pending grants access'; end if;
 begin
  perform public.spot_resolve_follow(current_setting('spot.test_viewer')::uuid,true);
  raise exception 'FAIL: requester approved self';
 exception when raise_exception then if sqlerrm<>'Request unavailable' then raise; end if; end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',current_setting('spot.test_owner'))::text,true);
select public.spot_resolve_follow(current_setting('spot.test_viewer')::uuid,true);
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',current_setting('spot.test_viewer'))::text,true);
do $$begin
 if not private.spot_can_view_content(current_setting('spot.test_owner')::uuid) then raise exception 'FAIL: accepted follower denied'; end if;
 if not exists(select 1 from public.spot_stories where id=current_setting('spot.test_story')::uuid) then raise exception 'FAIL: accepted story denied'; end if;
 if not exists(select 1 from storage.objects where bucket_id='spot-stories' and name=current_setting('spot.test_media')) then raise exception 'FAIL: story media denied'; end if;
 insert into public.spot_story_views(story_id,viewer_id) values(current_setting('spot.test_story')::uuid,current_setting('spot.test_viewer')::uuid);
 if not exists(select 1 from public.spot_story_views where story_id=current_setting('spot.test_story')::uuid) then raise exception 'FAIL: seen state'; end if;
 begin
  insert into public.spot_story_views(story_id,viewer_id) values(current_setting('spot.test_story')::uuid,current_setting('spot.test_owner')::uuid);
  raise exception 'FAIL: forged seen state';
 exception when insufficient_privilege then null; end;
 if public.spot_request_follow(current_setting('spot.test_owner')::uuid)<>'unfollowed' then raise exception 'FAIL: unfollow'; end if;
 if private.spot_can_view_content(current_setting('spot.test_owner')::uuid) then raise exception 'FAIL: access after unfollow'; end if;
 if public.spot_request_follow(current_setting('spot.test_owner')::uuid)<>'requested' then raise exception 'FAIL: second request'; end if;
 if public.spot_request_follow(current_setting('spot.test_owner')::uuid)<>'cancelled' then raise exception 'FAIL: request cancellation'; end if;
end $$;
reset role;
update public.spot_stories set created_at=now()-interval '2 days',expires_at=now()-interval '1 day' where id=current_setting('spot.test_story')::uuid;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',current_setting('spot.test_owner'))::text,true);
do $$begin
 if exists(select 1 from public.spot_stories where id=current_setting('spot.test_story')::uuid) then raise exception 'FAIL: expired story visible'; end if;
 begin
  update public.spot_stories set created_at=now(),expires_at=now()+interval '24 hours' where id=current_setting('spot.test_story')::uuid;
  raise exception 'FAIL: expiry extended';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: private content, search, request/accept/cancel, media, seen ownership and expiry. Fixtures rolled back.' as result;
