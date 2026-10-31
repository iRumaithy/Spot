# Spot 3.5.0 verification

## Scope
Story camera, full-screen viewer, author avatar, publication clock time, owner-only viewer list, profile avatar story rings, and owner-only review editing. Existing 3.4 privacy and notification flows are retained.

## Automated and live checks
- JavaScript syntax checks and whitespace checks passed.
- Release routing: 13 installed/published-version cases and 3 preview path cases passed. Unreleased 3.5 cannot be selected publicly.
- Five behavioral Node tests passed: strict review ownership (including administrators), story clock/source labels, all camera tracks stopped, profile story visibility/seen state, and changing UI translations/recording labels/timers across Arabic/English switches.
- `tests/ownership-story-audience.sql` was executed successfully on the live database in a rollback-only transaction. Administrator and unrelated member could not update another member’s review; the owner could update it. A story viewer row was hidden from an unrelated member and visible to the story owner. Album metadata persisted. All fixtures and trigger side effects rolled back.
- Metadata columns, owner audience SELECT policy and audience-time index are applied in the live database. Content/storage mutation policies require actual ownership. Account administration remains separate.
- Supabase security advisor was checked after the change. No newly introduced story/review RLS finding was returned. Existing broader project advisories (other apps/functions and Auth configuration) remain outside this change.

## Browser QA
Isolated in-memory accounts and a synthetic canvas camera were used; no personal camera or microphone was accessed. QA fixtures are excluded from deployment by `prepare-spot-site.mjs`.
- Main feed: owner edit action present; another member’s review has no edit action even for an administrator.
- Profile: story ring on avatar opens that account’s stories. Seen ring state updates.
- Viewer: circular fixed-size account image, clock time, album origin at top, pause/resume and navigation, two actual fixture viewers in owner sheet, no audience control on another member’s story.
- Camera: opens directly, photo preview and publication; video start/stop, four-second video preview and publication. Recording button label remains correct after the i18n fix.
- Camera denied: clear permission guidance and native camera/album alternatives remain usable.
- Album: selected PNG decoded at 600 × 1000, published and decoded at the same dimensions in the viewer; source label remained visible.
- Upload failure: image/caption preserved, retry succeeded. Initial malformed QA file selection also exposed missing image validation; decoded-image validation now rejects unreadable images before publication.
- Screenshot `story-studio-qa.jpg` uses synthetic test content, not a member’s photo.

## Limits and release status
Physical iPhone camera/microphone permissions and Safari recording still need device verification. Real system notification receipt on an iPhone has not been observed in this change. Existing 3.4 backend delivery was verified separately; do not equate a sent push job with physical receipt.

This commit is a candidate for Madar’s existing owner approval flow. GitHub Pages deployment must use the exact approved commit and pass backend preflight and live-manifest verification before activation. It does not directly set `stable_version` to 3.5.0.
