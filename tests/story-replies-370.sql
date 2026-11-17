-- Isolated transaction: only fixture rows are inserted; all are rolled back.
begin;
select set_config('spot.test.owner',(select id::text from public.profiles where is_active and not is_private order by id limit 1),true);
select set_config('spot.test.sender',(select id::text from public.profiles where is_active and id<>current_setting('spot.test.owner')::uuid order by id limit 1),true);
select set_config('spot.test.third',(select id::text from public.profiles where is_active and id not in(current_setting('spot.test.owner')::uuid,current_setting('spot.test.sender')::uuid) order by id limit 1),true);
select set_config('spot.test.story',gen_random_uuid()::text,true),set_config('spot.test.expired',gen_random_uuid()::text,true),set_config('spot.test.message',gen_random_uuid()::text,true);
insert into storage.objects(bucket_id,name) values('spot-stories',current_setting('spot.test.owner')||'/qa-story-370.jpg');
insert into public.spot_stories(id,owner_id,media_path,media_type,caption,expires_at)
values(current_setting('spot.test.story')::uuid,current_setting('spot.test.owner')::uuid,current_setting('spot.test.owner')||'/qa-story-370.jpg','image','Server story caption',now()+interval '24 hours');
insert into public.spot_stories(id,owner_id,media_path,media_type,caption,created_at,expires_at)
values(current_setting('spot.test.expired')::uuid,current_setting('spot.test.owner')::uuid,current_setting('spot.test.owner')||'/qa-story-370-expired.jpg','image','Expired fixture',now()-interval '25 hours',now()-interval '1 hour');
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('spot.test.sender'),'role','authenticated')::text,true);
insert into storage.objects(bucket_id,name) values('spot-dm-previews',current_setting('spot.test.sender')||'/'||current_setting('spot.test.message')||'.jpg');
insert into public.spot_direct_messages(id,sender_id,recipient_id,body,story_id,story_preview_path,story_context)
values(current_setting('spot.test.message')::uuid,current_setting('spot.test.sender')::uuid,current_setting('spot.test.owner')::uuid,'Story reply fixture',current_setting('spot.test.story')::uuid,current_setting('spot.test.sender')||'/'||current_setting('spot.test.message')||'.jpg','{"caption":"forged caption"}');
do $$ declare bad_id uuid:=gen_random_uuid();begin
 if (select story_context->>'caption' from public.spot_direct_messages where id=current_setting('spot.test.message')::uuid)<>'Server story caption' then raise exception 'Context was not derived by server';end if;
 begin
  insert into public.spot_direct_messages(sender_id,recipient_id,body,story_id,story_preview_path) values(current_setting('spot.test.sender')::uuid,current_setting('spot.test.third')::uuid,'Wrong recipient',current_setting('spot.test.story')::uuid,'invalid');
  raise exception 'Wrong recipient accepted';exception when raise_exception then if sqlerrm='Wrong recipient accepted' then raise;end if;end;
 begin
  insert into public.spot_direct_messages(sender_id,recipient_id,body,story_id,story_preview_path) values(current_setting('spot.test.third')::uuid,current_setting('spot.test.owner')::uuid,'Spoofed sender',current_setting('spot.test.story')::uuid,'invalid');
  raise exception 'Spoofed sender accepted';exception when raise_exception then if sqlerrm='Spoofed sender accepted' then raise;end if;end;
 begin
  insert into public.spot_direct_messages(sender_id,recipient_id,body,story_id,story_preview_path) values(current_setting('spot.test.sender')::uuid,current_setting('spot.test.owner')::uuid,'Expired story',current_setting('spot.test.expired')::uuid,'invalid');
  raise exception 'Expired story accepted';exception when raise_exception then if sqlerrm='Expired story accepted' then raise;end if;end;
 begin
  insert into public.spot_direct_messages(id,sender_id,recipient_id,body,story_id,story_preview_path) values(bad_id,current_setting('spot.test.sender')::uuid,current_setting('spot.test.owner')::uuid,'Missing thumbnail',current_setting('spot.test.story')::uuid,current_setting('spot.test.sender')||'/'||bad_id::text||'.jpg');
  raise exception 'Missing thumbnail accepted';exception when raise_exception then if sqlerrm='Missing thumbnail accepted' then raise;end if;end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('spot.test.owner'),'role','authenticated')::text,true);
do $$ begin
 if not exists(select 1 from public.spot_direct_messages where id=current_setting('spot.test.message')::uuid) then raise exception 'Recipient cannot read reply';end if;
 if not exists(select 1 from storage.objects where bucket_id='spot-dm-previews' and name=current_setting('spot.test.sender')||'/'||current_setting('spot.test.message')||'.jpg') then raise exception 'Recipient cannot read preview';end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('spot.test.third'),'role','authenticated')::text,true);
do $$ begin
 if exists(select 1 from public.spot_direct_messages where id=current_setting('spot.test.message')::uuid) then raise exception 'Third-party DM disclosure';end if;
 if exists(select 1 from storage.objects where bucket_id='spot-dm-previews' and name=current_setting('spot.test.sender')||'/'||current_setting('spot.test.message')||'.jpg') then raise exception 'Third-party thumbnail disclosure';end if;
 begin
  insert into storage.objects(bucket_id,name) values('spot-dm-previews',current_setting('spot.test.sender')||'/'||gen_random_uuid()::text||'.jpg');
  raise exception 'Cross-user upload accepted';exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
select 'PASS story reply persistence, server context, correct recipient, author validation, expiry, thumbnail required, recipient read, third-party isolation and upload ownership; rolled back' as result;
