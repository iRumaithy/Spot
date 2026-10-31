# Spot 3.5.2 verification

## Changes
Full Unicode 18 emoji catalog (3963 qualified sequences) with official CLDR Arabic annotations, lazy loading, categories, search, pagination and native-keyboard input. Finger drawing supports pen, marker, width/colors, stroke erasing, undo/redo and clearing. A background tap on the photo opens the text field at that location. Tools use a compact dock and floating sheets so the preview does not shrink when a panel opens.

Physical story direction is independent of interface language: right tap/right arrow = next; left tap/left arrow = previous. Account swipes retain their existing direction. Footer controls and transition directions match.

## Camera permission handling
The browser remains the authority for permission. The app reuses a live video track within a visible app session and sets its enabled property to false after capture/close. It stops tracks on pagehide, hidden document, logout, camera switch or account change. Pending requests are shared, and stale composers cannot disable a successor’s stream. No localStorage flag is treated as a camera grant. Safari may ask again after releasing the session if the website setting is Ask; the help panel explains how to choose Allow for Spot only.

## Validation
- 17 behavioral Node tests passed, including complete emoji sequences/Arabic search, camera request sharing/reuse/cleanup, safe bounded SVG paths, drawing/erasing/undo/redo, story ownership and existing cache/navigation/image checks.
- 22 release routing cases and 3 preview paths passed.
- Browser QA in an isolated 390-pixel frame: camera opened, closed and reopened; video getUserMedia request count remained 1. Photo capture succeeded.
- Tapping the actual photo opened the text field. Entered Arabic text, searched the full emoji library for قهوة, selected ☕, and drew a gold stroke using a real pointer drag.
- Undo removed the stroke and redo restored it. Publishing retained exactly the pre-publication SVG markup and both text/emoji layers.
- Real side taps advanced from story 1 to 2 on the right and returned from 2 to 1 on the left.
- Live rollback-only SQL verified drawing coordinates/opacity persistence and rejection of invalid array shape and excess stroke count. Existing owner-only INSERT and visible-story SELECT policies remain. The migration adds no UPDATE access.
- JavaScript syntax and whitespace checks passed; security advisor checked after the additive migration.

## Sources and limits
Emoji data and Arabic annotations are from Unicode; source hashes are in emoji-sources.json and licensing is in UNICODE-LICENSE.txt. Native emoji appearance depends on device fonts. Drawing and decoration rendering require the updated client.

The test camera uses synthetic canvas frames, not a person’s camera or microphone. A physical iPhone/Safari permission prompt and finger touch have not been observed here. Actual permanent permission cannot be forced by website JavaScript. Production remains 3.5.1 until the exact 3.5.2 candidate is approved in Madar and deployed successfully.
