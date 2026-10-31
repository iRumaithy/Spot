-- Every write, fixture and trigger side effect is rolled back.
begin;
select set_config('spot.test_place',(select p.id::text from public.places p join public.profiles u on u.id=p.owner_id where u.is_active and not u.is_private and u.role<>'admin' order by p.id limit 1),true);
select set_config('spot.test_owner',(select owner_id::text from public.places where id=current_setting('spot.test_place')::uuid),true);
select set_config('spot.test_admin',(select id::text from public.profiles where is_active and role='admin' limit 1),true);
select set_config('spot.test_other',(select id::text from public.profiles where is_active and id not in (current_setting('spot.test_owner')::uuid,current_setting('spot.test_admin')::uuid) limit 1),true);
select set_config('spot.test_story',gen_random_uuid()::text,true);
insert into public.spot_stories(id,owner_id,media_path,media_type,capture_source) values(current_setting('spot.test_story')::uuid,current_setting('spot.test_owner')::uuid,current_setting('spot.test_owner')||'/qa-'||gen_random_uuid()||'.jpg','image','album');
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',current_setting('spot.test_admin'))::text,true);
do $$declare n integer;begin
 update public.places set name=name where id=current_setting('spot.test_place')::uuid; get diagnostics n=row_count;
 if n<>0 then raise exception 'FAIL: administrator edited another member review'; end if;
 update public.items set rating=rating where place_id=current_setting('spot.test_place')::uuid; get diagnostics n=row_count;
 if n<>0 then raise exception 'FAIL: administrator edited another member rating'; end if;
 update public.visits set notes=notes where place_id=current_setting('spot.test_place')::uuid; get diagnostics n=row_count;
 if n<>0 then raise exception 'FAIL: administrator edited another member visit'; end if;
end $$;
insert into public.spot_story_views(story_id,viewer_id) values(current_setting('spot.test_story')::uuid,current_setting('spot.test_admin')::uuid);
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',current_setting('spot.test_other'))::text,true);
do $$begin
 if exists(select 1 from public.spot_story_views where story_id=current_setting('spot.test_story')::uuid) then raise exception 'FAIL: viewer identities exposed to unrelated member'; end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',current_setting('spot.test_owner'))::text,true);
do $$declare n integer;begin
 update public.places set name=name where id=current_setting('spot.test_place')::uuid; get diagnostics n=row_count;
 if n<>1 then raise exception 'FAIL: owner cannot edit own review'; end if;
 if (select count(*) from public.spot_story_views where story_id=current_setting('spot.test_story')::uuid)<>1 then raise exception 'FAIL: owner cannot read audience'; end if;
 if (select capture_source from public.spot_stories where id=current_setting('spot.test_story')::uuid)<>'album' then raise exception 'FAIL: album source not persisted'; end if;
end $$;
reset role;
rollback;
select 'PASS: owner-only review editing, admin/other member denied, audience owner-only, album metadata; all fixtures rolled back' result;
