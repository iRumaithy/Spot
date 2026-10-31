-- Non-destructive metadata for decorations authored before story publication.
alter table public.spot_stories add column if not exists overlays jsonb not null default '[]'::jsonb;
alter table public.spot_stories add constraint spot_story_overlays_shape check (
 (case when jsonb_typeof(overlays)='array' then jsonb_array_length(overlays)<=12 else false end)
 and octet_length(overlays::text)<=12000
);
-- Existing authenticated owner INSERT and visible-story SELECT policies apply.
-- Published stories remain immutable: no UPDATE policy is added.
