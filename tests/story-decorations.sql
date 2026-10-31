begin;
do $$declare account_id uuid; story_id uuid:=gen_random_uuid(); begin
 select id into strict account_id from public.profiles where is_active limit 1;
 insert into public.spot_stories(id,owner_id,media_path,media_type,overlays) values(story_id,account_id,account_id::text||'/qa-overlay-'||gen_random_uuid()||'.jpg','image','[{"id":"qa","kind":"text","text":"قهوة العصر","x":0.25,"y":0.4,"scale":1.1}]'::jsonb);
 if (select overlays->0->>'text' from public.spot_stories where id=story_id)<>'قهوة العصر' then raise exception 'Overlay text was not preserved';end if;
 if (select (overlays->0->>'x')::numeric from public.spot_stories where id=story_id)<>0.25 then raise exception 'Overlay position was not preserved';end if;
 begin
  update public.spot_stories set overlays='{}'::jsonb where id=story_id;
  raise exception 'Invalid overlay object was accepted';
 exception when check_violation then null;end;
 begin
  update public.spot_stories set overlays=(select jsonb_agg(jsonb_build_object('kind','text','text',i)) from generate_series(1,13) i) where id=story_id;
  raise exception 'More than 12 overlays were accepted';
 exception when check_violation then null;end;
end $$;
rollback;
select 'PASS: text and positions persisted; malformed/oversized decoration arrays rejected; fixtures rolled back' result;
