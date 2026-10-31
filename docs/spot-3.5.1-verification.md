# Spot 3.5.1 verification

## Result
Profile avatar and name now occupy separate, correctly sized grid columns. Story taps traverse stories, swipes traverse accounts, and previous-account navigation restores the last position. The composer supports text, sticker, clock and date layers on images and videos before publication.

## Performance
- Opening a fresh tray no longer waits for three metadata queries. Background refresh uses a 15-second freshness window and shares concurrent work.
- Nearby image/video resources are warmed across story and account boundaries. Signed URLs are requested in batches and reused in account-scoped memory for at most 90 seconds and never beyond story expiry. Cache targets eight entries and at most two videos; active and in-flight resources are protected. Nothing is persisted to disk.
- Save Data disables prewarming. Detected 2G/3G reduces image prefetching and disables video prefetching.
- Large album images are resized to a 2048-pixel maximum dimension before upload; small images retain original bytes. PNG transparency is preserved.
- Local browser fixture telemetry showed one story metadata read before opening and one afterward: zero additional metadata reads for the open action. Cached image was already complete. This is a functional request-count check, not a measured production network speed guarantee. A cold first open still depends on network and file size.

## Verification
- Eleven behavioral Node tests passed: existing ownership/clock/seen/i18n/resource checks, URL reuse/concurrency/expiry/account separation, opening without metadata round trips, account/story boundaries and remembered position, actual gesture event mapping, safe decoration serialization, and photo resizing.
- Eighteen release-routing cases and three preview paths passed; unapproved 3.5.1 cannot be selected by public clients. Existing 3.5.0 users retain their selected version.
- Browser responsive QA at 320, 390 and 430 CSS pixels: no avatar/name intersection and no profile-card horizontal overflow.
- Browser QA: same-account next, next-account and previous-account position restored. Another member’s pre-authored overlay rendered.
- Browser composer QA: text, gold color, size, clock, date and emoji sticker added to a PNG. Keyboard movement and a real pointer drag changed positions. After publication, DOM positions, scale and text exactly matched the pre-publication values for all four elements.
- Synthetic recorded video published with a clock layer; playback reached readyState 4 at 720 × 1280 and displayed the clock. No physical camera/microphone was used.
- Live rollback-only SQL test passed: overlay text/coordinates persist; non-array data and more than 12 elements fail constraints. Existing owner INSERT and visible-content SELECT policies remain; no published-story UPDATE access was added.
- JavaScript syntax and whitespace checks passed. Security advisor checked after the additive migration; no new story-specific advisor was introduced.
- QA fixtures and screenshots are excluded from the public deployment. `story-decorations-351-qa.jpg` contains synthetic content.

## Release and limits
Migration `spot_story_decorations_351` is applied and compatible with 3.5.0. Decoration rendering requires the new client. Physical iPhone Safari permissions/touch/video behavior still need device confirmation. The existing Madar exact-commit approval workflow remains responsible for publication; production is currently 3.5.0 until 3.5.1 approval and verification succeed.
