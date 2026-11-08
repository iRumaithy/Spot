-- Applied as the hosted migration spot_canonical_abu_dhabi_city.
-- Narrow normalization only; unrelated or legacy city names remain untouched.
create or replace function private.spot_canonical_place_city() returns trigger
language plpgsql security invoker set search_path = '' as $function$
begin
  if regexp_replace(translate(coalesce(new.city,''),'أإآ','ا'),'[[:space:]ـً-ٰٟ]','','g') = 'ابوظبي' then
    new.city := 'ابوظبي';
  end if;
  return new;
end;
$function$;
revoke all on function private.spot_canonical_place_city() from public, anon, authenticated;
create trigger spot_canonical_place_city before insert or update of city on public.places
for each row execute function private.spot_canonical_place_city();
update public.places set city='ابوظبي'
where city <> 'ابوظبي'
and regexp_replace(translate(coalesce(city,''),'أإآ','ا'),'[[:space:]ـً-ٰٟ]','','g')='ابوظبي';
