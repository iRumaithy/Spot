-- Additive immutable story drawing metadata. Existing owner-only INSERT and visible-story SELECT apply.
alter table public.spot_stories add column if not exists drawings jsonb not null default '[]'::jsonb;
alter table public.spot_stories add constraint spot_story_drawings_shape check (
 (case when jsonb_typeof(drawings)='array' then jsonb_array_length(drawings)<=50 else false end)
 and octet_length(drawings::text)<=400000
);
