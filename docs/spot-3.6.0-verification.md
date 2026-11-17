Spot 3.6.0 verification

Home: active stories above a single chronological feed, sorted by social_posts.created_at, with for-you/following tabs, 20-post batches, likes, save-place and edit actions.

Comments: persistent same-post root/reply foreign key; root-only replies; server-set timestamp; self-authored INSERT; SELECT follows the existing post audience; DELETE by comment author or post owner; client UPDATE denied. Invoker RPCs provide RLS-aware counts and 20-row pages. Realtime refresh preserves drafts and sheet scroll. Guests can read visible-post comments and sign in to write.

Passed checks:
- node --check spot-v3.6.0.js
- node tests/release-routing.mjs: retained 38 routing cases and new 3.6.0 candidate/stable/CSS regressions.
- node tests/cities.mjs: retained city behavior.
- node tests/feed-comments-360.mjs: publication order, privacy filter, HTML escaping, author badge, failed-send draft retention, successful payload, threaded reply, closed-sheet race.
- Live transaction-only database tests: authenticated insertion, owner reply, thread page, summary, spoofing rejection, immutable author, cross-post and nested-reply rejection. Temporary rows rolled back.
- Security advisor review: no finding for the added table/functions.
- Browser QA using local fixtures: desktop and 390px iframe, chronological feed despite a later place edit, story tray above feed, comments/reply submission and reopening, nested replies with author badge. No horizontal overflow (375px feed inside 390px viewport).

Submit the exact commit to Madar for owner review. Production stable remains 3.5.6 until owner approval.
