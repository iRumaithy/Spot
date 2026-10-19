Spot v3.3.0 — Social Features + Username/Password + Owner-Approved Recovery
==============================================================================

This updated package REPLACES the previous v3.3.0 ZIP (not yet uploaded).

REPLACE / ADD THESE SIX FILES in the root of GitHub repository iRumaithy/Spot:
- index.html
- spot-v3.2.css
- spot-v3.3.0.js
- owner-preview-spot330.html
- release-router.js
- sw.js

Do not delete other existing files such as config.js, spot-v3.2.1.js,
manifest.webmanifest or existing icons. No manual SQL upload is required.
The Supabase tables, protected spot-accounts Edge Function, and social
notification worker have been configured in the project already.

NEW ACCOUNT FLOW:
- New users sign up with display name, unique username (4-24 lowercase English
  letters or numbers), and password (min 8 characters).
- There is no email field and no email confirmation message.
- Existing accounts can continue to sign in by username/password; their data
  and passwords are unchanged.
- For backend Supabase Auth compatibility, the server creates a non-deliverable
  internal technical email address. This is NOT shown to the user and email
  delivery or email verification is NOT involved.

OWNER-APPROVED PASSWORD RECOVERY (NO EMAIL):
- In Login > Forgot password, the member submits a username.
- A request appears in Platform Admin > Manage Users > Password reset requests.
- Owner MUST verify identity by a trusted offline channel, then approve.
- Only the owner receives a one-time 40-character code (valid for one hour).
- Owner passes the code securely to the VERIFIED member, never publicly.
- Member opens Forgot password > I have a reset code, enters request ID, the
  code and their new password. The code is single-use and limited in attempts.
- Without that code, approval alone cannot be used to take over an account.
- For security, the platform owner's password recovery requires separate
  provider-level administration; ordinary users cannot request owner takeover.

OWNER-FIRST RELEASE:
Preview only: https://irumaithy.github.io/Spot/owner-preview-spot330.html
After uploading, confirm the GitHub Pages workflow succeeded. The platform
owner tests first. In Manage Users > I finished testing > Approve to all.
Stable remains v3.2.1 until owner explicitly approves v3.3.0.

OTHER v3.3 FEATURES RETAINED:
- Post likes / unlike with counts, independent of saved places
- External push on follow/like/private message/published review (subject to
  device/browser push permissions)
- Member search by display name or username

QA: Passed JavaScript syntax checks and simulated mobile signup, login and
forgot-password UI. Owner's end-to-end approval and actual Auth account
creation/password change need testing with two real accounts after upload.
