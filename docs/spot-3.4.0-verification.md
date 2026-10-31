# Spot 3.4.0 verification

- JavaScript syntax checks and `git diff --check`: passed.
- Release router: 9 cases passed, including installed 3.3.0 retention and unreleased candidate exclusion.
- Browser QA with isolated local fixtures: home layout, opening a story, timed advance, persisted seen ring, private profile gate, follow request/cancellation, and acceptance surface passed. No fixture is included in the deployment.
- Live backend schema and policy snapshot saved in `database/spot-3.4.0-schema.json`. All new tables use RLS, their default grants were restricted, and new public mutation RPCs use SECURITY INVOKER wrappers with authenticated-only access to private implementations.
- Live anonymous API probes check that stories are inaccessible and follow, privacy and push endpoints reject anonymous callers.
- Existing delivery evidence before this update: 8 social events marked sent, 1 skipped for no subscribed devices, no pending or failed social events; both existing notification cron jobs were active and their latest runs succeeded. Five device subscriptions were present.
- Full transaction-based two-account SQL test was prepared in `tests/privacy-stories.sql`, but the execution confirmation expired. Do not report that test as passed.
- A physical iPhone notification receipt has not been observed. Use the per-device test button in the installed published app; the private preview does not request system notification permission.

The live server functions were updated using their existing VAPID/processor credentials. Source snapshots intentionally reference secret environment variables instead of committing those existing secret values; provision SPOT_VAPID_PRIVATE and SPOT_PUSH_PROCESS_SECRET before deploying the checked-in push snapshot independently.
