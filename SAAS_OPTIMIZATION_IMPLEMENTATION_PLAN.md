# SaaS Reliability and Responsiveness Implementation Plan

## Purpose

Improve the attendance and member-management SaaS so users can submit reports reliably, avoid accidental duplicate submissions, get current status quickly, and maintain the system without copying fixes across several portal versions.

This is a plan only. It does not change application code, forms, database schema, or deployment configuration.

## Goals

- Keep one authoritative implementation for each workflow while preserving existing public URLs.
- Prevent duplicate reports even when a user double-clicks, retries after a timeout, or submits from two tabs.
- Ensure related database writes either all succeed or all fail.
- Give users immediate, clear feedback while data is loading or being saved.
- Ensure pending-report and reminder calculations use the same date, identity, and eligibility rules.
- Protect member records through database-enforced authorization, not link obscurity alone.

## Current State and Risks

- The portal exists in multiple copies: `Ncfreport/`, `DCNSK/Ncfreport/`, `Ncfreport_backup_original/`, and the consolidated `implementation/` tree. Similar report submission functions appear in several of those copies. A bug fix can therefore land in one version but not the version being deployed.
- The G12 form checks for an existing report and then inserts attendance rows. The check and insert are separate operations, so concurrent submissions can both pass the check. The department form inserts rows without an equivalent duplicate check.
- MVP registration writes to `mvps` and `members` in separate requests. One write can succeed while the other fails, leaving inconsistent records.
- The portal calculates pending G12/departments in the browser and caches results for the page session. The scheduled reminder Edge Function performs a separate calculation. These implementations can disagree, and the browser calculation uses UTC date construction while the reminder function computes the service date in WAT.
- The profile updater loads a member by ID from the link and updates through the Supabase browser client. Access control must therefore be enforced by Supabase Row Level Security (RLS) policies and must not rely on the ID being difficult to guess.
- Several browser queries select all columns, including profile search. This transfers data not needed for the displayed result and can slow the page as tables grow.

Relevant implementation references: [implementation/README.md](implementation/README.md), [implementation/index.html](implementation/index.html), [implementation/tabs/g12.html](implementation/tabs/g12.html), [implementation/tabs/dept.html](implementation/tabs/dept.html), [implementation/tabs/mvp.html](implementation/tabs/mvp.html), [Update/index.html](Update/index.html), [Update/update-profile.html](Update/update-profile.html), [supabase/functions/send-reminders/index.ts](supabase/functions/send-reminders/index.ts), and [supabase/cron_schedules.sql](supabase/cron_schedules.sql).

## Target Architecture

1. Treat `implementation/` as the canonical portal source, subject to confirming that it matches the live deployment.
2. Keep legacy entry points as small redirects that preserve query parameters such as `leader`, `dept`, and `tab`.
3. Put shared browser behavior in versioned shared modules: Supabase client creation, date/service-day handling, leader normalization, submission status, and error display.
4. Put data-integrity decisions in Postgres transactions or narrowly scoped Supabase RPC/Edge Function endpoints. Browser checks may improve the experience, but are not the authority for uniqueness or authorization.
5. Keep report facts and recipient eligibility consistent between the portal pending view and scheduled reminders by sharing canonical database functions or a single server-side calculation.

## Phased Implementation

### Phase 0: Establish Baselines and Deployment Source

- Confirm which directory and commit currently deploy to `reports.ncfunn.site` and which host configuration serves it.
- Capture current table schemas, RLS policies, report counts, and representative form payloads before changing behavior.
- Add a small regression checklist for all portal routes and query-string prefill behavior.
- Measure initial page-visible time, form submission duration, and error/duplicate rates where existing logs permit.

**Exit criteria:** The production source and rollback target are known; existing report fields and URL behavior are recorded.

### Phase 1: Eliminate Source Duplication

- Select one canonical source tree after deployment verification. Do not blindly overwrite production with `implementation/` until its forms and data payloads are confirmed equivalent.
- Convert old URLs (`G12report.html`, `Department.html`, `connect.html`, `cellreport.html`, `servicereport.html`, and `mvp.html`) into redirects to the canonical portal. Preserve supported query parameters.
- Mark backup copies as archival and exclude them from deployment/build inputs. Keep backups outside the editable source of truth.
- Extract shared client and helper logic into shared modules rather than maintaining copied implementations.
- Add a check that fails deployment if a legacy path still contains an independent report form or if expected redirects are missing.

**Exit criteria:** Each workflow has one maintained implementation; old bookmarks and reminder links still open the correct form with prefilled values.

### Phase 2: Make Report Submission Idempotent and Atomic

- Define the business identity for a submission. Recommended initial keys:
  - G12: canonical leader + service date + service type (include zone if that is intended to permit separate reports).
  - Department: department + report date + service type, if applicable.
  - Service report: date + service type + zone.
  - Connect report: leader + report date + cell/location identity, if multiple cells per leader are allowed.
- Normalize leader, department, date, and service type once on the server/database. Do not let browser formatting or aliases create different identities for the same submission.
- Add an idempotency key to each submit attempt and enforce uniqueness in the database. A client-side “already submitted?” query remains useful for messaging but cannot prevent races.
- For G12 and department reports, where one submission writes many attendance rows, introduce a submission header/parent record with a unique business key and child attendance rows, or implement an equivalent transactional RPC. Validate the full payload and insert the header and all rows in one transaction.
- For MVP registration, use one transactional server-side operation to create the `mvps` and `members` records and return a stable result. Decide and document how legacy schemas are supported before removing fallback payloads.
- When a request times out after the server commits, allow the user to retry with the same idempotency key and return the original submission result instead of creating another report.
- Disable submit while sending, but do not treat a disabled button as the integrity mechanism.

**Exit criteria:** Concurrent requests with the same business key produce one submission; a simulated failure cannot leave half a G12/department/MVP write; a safe retry returns a clear success/duplicate status.

### Phase 3: Unify Date, Leader, and Pending-Report Rules

- Define one service-date function with an explicit timezone (`Africa/Lagos`) and use it in the browser display, Edge Function, and database checks.
- Centralize leader alias normalization and department canonicalization. Prefer a stable leader/member ID over names where the schema can support it; retain canonical names for display and legacy rows.
- Calculate report completeness from the same canonical data source used by reminders. Prefer a database view/RPC or server endpoint returning expected leaders, submitted keys, and missing keys.
- Remove indefinite per-page pending caches. Refresh when the report tab opens, after successful submission, when the date changes, and on an appropriate short refresh interval. Display “updated at” and a retry control if refresh fails.
- Keep a stale result visibly marked as stale instead of silently presenting it as current.
- Define whether reminders should be suppressed for inactive leaders, missing phone numbers, and departments without an active leader. Record skipped recipients in the run result.

**Exit criteria:** Given the same date and database snapshot, portal pending indicators and reminder recipient selection return the same missing set, including around midnight WAT and for leader aliases.

### Phase 4: Improve Perceived and Actual Responsiveness

- Load the portal shell and navigation immediately; lazy-load the selected report form and avoid loading inactive forms.
- Show explicit loading, empty, saving, success, and recoverable error states. Preserve entered values after network or server errors.
- Add a bounded request timeout and retry only safe reads or idempotent writes. Do not automatically retry a non-idempotent insert.
- Replace `select('*')` in interactive search and profile screens with explicit required columns. Add server-side pagination for larger member lists.
- Debounce member search, cancel or ignore stale requests when a newer query is issued, and cap result counts. Do not render database content through unsafe interpolated HTML; use text nodes or escaped rendering.
- Avoid rebuilding large lists one node at a time where batching is appropriate. Keep a loading indicator or skeleton while results load.
- For the embedded report form, show a stable frame loading/error state and ensure height updates do not cause layout jumps. Test the mobile menu, direct deep links, keyboard navigation, and back/forward behavior.
- Prevent duplicate clicks in profile updates and registration with button state plus server-side idempotency.

**Exit criteria:** On agreed mobile and desktop test devices, the shell appears immediately, searches return responsive feedback, submissions cannot be repeated accidentally, and recoverable errors do not erase user input.

### Phase 5: Secure Profile Links and Write Access

- Audit RLS policies for `members`, all report tables, and `mvps` before deployment. Test as anonymous, authenticated, and service-role clients.
- Replace ID-only profile access with a purpose-built, expiring, single-use or revocable update token, stored hashed server-side and scoped to the permitted profile fields. Alternatively, require an authenticated user whose identity is linked to the member record.
- Route token validation and profile updates through a server-side endpoint/RPC. Never expose the service-role key in browser code.
- Allowlist fields that a member can edit; prevent profile links from changing leadership assignment, membership level, or other administrative attributes unless explicitly authorized.
- Add rate limits and audit events for token creation, failed token attempts, profile reads, and successful updates.

**Exit criteria:** An anonymous caller cannot read or modify arbitrary member records by changing the URL ID; an expired/revoked token cannot update a record; allowed profile fields still save correctly.

### Phase 6: Observability, Rollout, and Cleanup

- Return a request/correlation ID from submission and reminder endpoints. Log submission key, outcome, latency, and error category without logging unnecessary personal data.
- Add monitoring for report insert failures, duplicate conflicts, reminder delivery failures, stale pending calculations, and slow queries.
- Roll out first to a test environment or a small admin/leader group. Compare report counts and reminder recipients against the current system before switching all traffic.
- Keep legacy routes available during the compatibility window. Define rollback steps and a database migration rollback strategy before applying constraints or moving report data.
- Remove obsolete copies only after production parity, link compatibility, and rollback are verified.

**Exit criteria:** Operators can identify failed submissions and reminder runs, compare old/new behavior, and roll back without losing submitted data.

## Test and Acceptance Matrix

| Area | Required checks |
| --- | --- |
| Routes | Every legacy URL redirects to the matching canonical tab; query parameters survive redirects and prefill the expected leader/department. |
| G12 | Missing attendance is rejected; absence reason rules work as designed; same leader/date/service submitted concurrently creates one report; aliases resolve to one identity. |
| Department | Required attendance and absence reasons are validated; repeated and concurrent submissions are safely deduplicated. |
| MVP | Successful signup creates consistent `mvps` and `members` data; forced failure of either write leaves no partial registration; retry is safe. |
| Service/connect | Required fields, numeric values, date/timezone, and business keys are validated; duplicate rules match documented business policy. |
| Pending/reminders | Portal and Edge Function return the same missing set; test Wednesday/Sunday, non-service days, midnight WAT, no-phone leaders, and dry-run mode. |
| Profile update | Valid token updates only allowed fields; invalid/expired/revoked token fails; malformed fields and network errors preserve input. |
| Responsiveness | Test slow network, offline transition, double click, delayed responses, mobile viewport, keyboard-only use, and large member lists. |
| Security | Anonymous/authenticated/service-role RLS matrix; no service-role secret in client assets; HTML rendering of member data resists script injection. |

## Recommended Order

1. Confirm deployment source and RLS policies.
2. Consolidate source and preserve legacy URLs.
3. Implement transactional, database-enforced idempotency for reports and MVP registration.
4. Unify timezone and pending/reminder calculations.
5. Improve loading, error, and search behavior; reduce fetched data.
6. Replace ID-only profile access with scoped authorization.
7. Add monitoring, staged rollout, and remove archived code from deployment.

Do not combine the source consolidation, schema migration, and profile authorization cutover into one release. Each has a distinct rollback path and should be verified independently.