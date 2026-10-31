begin;
do $$declare account_id uuid; story_id uuid:=gen_random_uuid();begin
 select id into strict account_id from public.profiles where is_active limit 1;
 insert into public.spot_stories(id,owner_id,media_path,media_type,drawings) values(story_id,account_id,account_id::text||'/qa-drawing-'||gen_random_uuid()||'.jpg','image','[{"id":"qa","color":"#ffdc85","width":6,"opacity":0.4,"points":[[0.2,0.3],[0.6,0.7]]}]'::jsonb);
 if (select drawings->0->'points'->0->>0 from public.spot_stories where id=story_id)<>'0.2' then raise exception 'Drawing coordinates did not persist';end if;
 if (select (drawings->0->>'opacity')::numeric from public.spot_stories where id=story_id)<>0.4 then raise exception 'Drawing opacity did not persist';end if;
 begin update public.spot_stories set drawings='{}'::jsonb where id=story_id;raise exception 'Invalid drawing object accepted';exception when check_violation then null;end;
 begin update public.spot_stories set drawings=(select jsonb_agg(jsonb_build_object('id',i)) from generate_series(1,51) i) where id=story_id;raise exception 'Excess drawing count accepted';exception when check_violation then null;end;
end $$;
rollback;
select 'PASS: drawing coordinates and opacity persisted; non-array/excess count rejected; fixtures rolled back' result;
