-- Transaction-only verification: nothing is persisted and no notifications are sent.
begin;
select set_config('spot.test.owner',(select owner_id::text from public.social_posts group by owner_id having count(*)>1 limit 1),true);
select set_config('spot.test.post',(select id::text from public.social_posts where owner_id=current_setting('spot.test.owner')::uuid order by id limit 1),true);
select set_config('spot.test.otherpost',(select id::text from public.social_posts where owner_id=current_setting('spot.test.owner')::uuid and id<>current_setting('spot.test.post')::uuid limit 1),true);
select set_config('spot.test.member',(select id::text from public.profiles where is_active and id<>current_setting('spot.test.owner')::uuid limit 1),true);
select set_config('spot.test.other',(select id::text from public.profiles where is_active and id not in(current_setting('spot.test.owner')::uuid,current_setting('spot.test.member')::uuid) limit 1),true);
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('spot.test.member'),'role','authenticated')::text,true);
insert into public.spot_post_comments(id,post_id,author_id,body) values('11111111-3600-4360-8360-111111111111',current_setting('spot.test.post')::uuid,current_setting('spot.test.member')::uuid,'Transaction test');
do $$ begin
 if (select total from public.spot_comment_summary(array[current_setting('spot.test.post')::uuid]::uuid[]))<>1 then raise exception 'Count mismatch';end if;
 begin
 insert into public.spot_post_comments(post_id,author_id,body) values(current_setting('spot.test.post')::uuid,current_setting('spot.test.owner')::uuid,'Spoof');
 raise exception 'Spoof accepted';exception when insufficient_privilege then null;end;
 begin
 update public.spot_post_comments set author_id=current_setting('spot.test.owner')::uuid where id='11111111-3600-4360-8360-111111111111';
 raise exception 'Reassignment accepted';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('spot.test.owner'),'role','authenticated')::text,true);
insert into public.spot_post_comments(id,post_id,author_id,parent_id,body) values('22222222-3600-4360-8360-222222222222',current_setting('spot.test.post')::uuid,current_setting('spot.test.owner')::uuid,'11111111-3600-4360-8360-111111111111','Post owner reply');
do $$ begin
 if (select reply_count from public.spot_comment_page(current_setting('spot.test.post')::uuid))<>1 then raise exception 'Reply not attached';end if;
 begin
 insert into public.spot_post_comments(post_id,author_id,parent_id,body) values(current_setting('spot.test.otherpost')::uuid,current_setting('spot.test.owner')::uuid,'11111111-3600-4360-8360-111111111111','Cross post');
 raise exception 'Cross-post reply accepted';exception when raise_exception then if sqlerrm='Cross-post reply accepted' then raise;end if;end;
 begin
 insert into public.spot_post_comments(post_id,author_id,parent_id,body) values(current_setting('spot.test.post')::uuid,current_setting('spot.test.owner')::uuid,'22222222-3600-4360-8360-222222222222','Too deep');
 raise exception 'Nested reply accepted';exception when raise_exception then if sqlerrm='Nested reply accepted' then raise;end if;end;
end $$;
reset role;
rollback;
select 'PASS authenticated insert, owner reply, summary, thread page, impersonation rejection, immutable author, cross-post rejection and nested reply rejection; rolled back' as result;
