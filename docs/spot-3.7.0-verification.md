Spot 3.7.0 — private story replies

Behavior:
- A reply composer appears on other members' stories and pauses playback while typing.
- A reply uses the existing direct message channel and notification queue. It includes a 180×320 JPEG thumbnail (a video frame for video stories) and server-derived story context.
- Thumbnails use a separate private bucket. The sender and recipient can read them; unrelated members cannot. The thumbnail and context remain after the ephemeral story expires.
- Live story references can be opened from the conversation. Expired/unavailable stories retain their conversation preview.
- Input survives failure; retries reuse the same message ID and uploaded thumbnail, including an ambiguous-save lookup. Account changes clear local reply state.
- Visual viewport resizing keeps the reply field visible; story navigation does not intercept text cursor keys. The story stage cannot auto-scroll its header offscreen when the input receives focus.

Validation:
- JavaScript syntax and retained release-routing/comment regressions passed.
- tests/story-replies-370.mjs: failure retention, idempotent retry, upload reuse, recipient binding, ambiguous-save recovery, expiry guard and escaped video context passed.
- tests/story-replies-370.sql ran against Supabase in a rolled-back transaction: reply persistence, derived context, recipient/author validation, expiry rejection, preview required, recipient visibility, third-party isolation and upload ownership passed. No fixture messages or files were committed.
- Security advisor review found no new feature findings.
- Browser QA at 390px: reply from first click, playback pause, sent status, thumbnail in DM (natural size 180×320), stable header and input focus. Local test fixtures were used for UI inspection.

The additive database migration is applied. Submit the exact source commit to Madar for owner review before publication.
