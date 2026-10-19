# React SaaS Rebuild Implementation Plan

## Purpose

Replace the copied, standalone HTML pages with one maintainable React application while preserving the existing reporting workflows, Supabase data, public links, and reminder automation. The rebuild should improve the actual user experience and reliability, not just restyle the pages.

This document is a migration plan. It does not create the React application or change production code.

## Current Starting Point

- The root `package.json` contains only `@vercel/analytics`; it has no React, TypeScript, bundler, or test scripts.
- Several HTML versions of the G12, department, and connect workflows exist in separate folders, alongside the consolidated `implementation/` portal.
- The current forms talk directly to Supabase from browser code. Some writes consist of multiple requests, and the G12 duplicate check is separate from the subsequent insert.
- The profile tool is a separate static page. `Update/vercel.json` rewrites `/u/:token` and `/update/:token` to `update-profile.html`; the current client then treats the path value as a member record ID.
- Reminder schedules and delivery live outside the browser app in Supabase Cron and the `send-reminders` Edge Function. These should remain operational during the UI migration.
- The deployed source tree, live RLS policies, and canonical production URLs still need confirmation before choosing a cutover target.

## Product and Architecture Decisions

### Recommended frontend foundation

- React + TypeScript + Vite, built as a static single-page app for Vercel or the confirmed existing static host.
- React Router for report, member, and legacy-link routes.
- Supabase JS client in one module, with public configuration only. Never put a Supabase service-role key in the browser bundle.
- React Hook Form and Zod for form state and shared client-side validation. Server/database validation remains authoritative.
- Use the existing Supabase project and database initially. Do not combine a full database redesign with the frontend replacement.
- Adopt a small shared design system for navigation, form fields, tables, status messages, dialogs, loading states, and responsive layouts. Keep the portal task-focused: quick report entry, readable member lists, and clear submission state.

### Target application shape

```text
src/
  app/             router, app shell, route guards, error boundary
  features/
    reports/       G12, department, service, connect workflows
    members/       MVP registration, profile update, member search
    reminders/     pending status and operational view, if retained in scope
  components/      shared accessible controls and feedback states
  lib/             Supabase client, date/timezone, validation, error mapping
  services/        typed database/RPC calls; no raw database writes in views
  types/           domain types and database-generated types
```

Feature modules own their workflow; shared code contains only behavior genuinely shared across workflows. Avoid a single large component with conditionals for every form.

## Target User Flows

### Report submission

1. Resolve route and query parameters, such as tab, leader, or department. Validate those values before using them in the form.
2. Load only the selected workflow and its required reference data. Show the shell immediately and a local loading state for the form/data.
3. Collect and validate fields using a typed workflow schema. Preserve entered values on recoverable errors.
4. Create or reuse a stable idempotency key for the current logical submission.
5. Send one command to a server-side Supabase RPC or Edge Function. It validates authorization and business rules, enforces uniqueness, and atomically persists all related rows.
6. Return a typed result: created, already submitted, invalid, unauthorized, or retryable failure. Render the matching state and request ID.
7. Refresh pending status from the canonical server-side calculation after success.

### Member profile update

1. Resolve `/u/:token` or `/update/:token`, retaining compatibility with existing links.
2. Validate a purpose-built expiring token server-side. Do not treat a database member ID as proof of authorization.
3. Return only the fields this link is allowed to display or update.
4. Validate the submitted allowlisted fields and save through a server-side operation.
5. Show success only after the write is confirmed; keep form values if the request fails.

### Pending reports and scheduled reminders

1. Use a canonical service-date calculation in `Africa/Lagos` and a shared server-side definition of expected reporters and submitted reports.
2. Return pending status for the UI and calculate reminder recipients from the same canonical source.
3. Keep scheduled jobs in Supabase Cron and keep WhatsApp delivery in the existing function/integration until independently migrated and verified.
4. Make reminder runs observable and idempotent so a repeated cron invocation does not create confusing duplicate dispatches.

## Migration Phases

### Phase 0: Discovery and Contract Freeze

- Confirm the production host, deployed folder/branch, current Vercel project configuration, and every live URL in WhatsApp or bookmarks.
- Inspect RLS policies and test current browser access using anonymous and authenticated roles. Confirm which profile fields are intended to be member-editable.
- Record each form's fields, required/optional rules, date semantics, table writes, and success behavior. Use current production behavior as a compatibility contract until a rule is explicitly changed.
- Capture representative Supabase payloads and table constraints. Identify old/alternate column names and decide how long schema fallbacks remain supported.
- Define baseline and target metrics: page shell time, form-ready time, report submission success rate, duplicate rate, and error recovery rate.

**Gate:** No production route or database behavior is assumed from a backup folder; deployment source and current security policies are verified.

### Phase 1: Create the React Delivery Foundation

- Add React, TypeScript, Vite, lint/typecheck/test scripts, and a production build command. Keep generated build output outside source control unless the current deployment requires otherwise.
- Configure local development, preview deployment, production environment variables, and SPA fallback routing. Keep static assets and Supabase Edge Function routes from being shadowed by the fallback.
- Add route-level error boundaries, accessible page titles, responsive shell, offline/network error handling, and analytics only after privacy requirements are reviewed.
- Create the typed Supabase client, shared error mapper, `Africa/Lagos` date utility, and route parameter parser.
- Add CI checks for install, lint, typecheck, unit tests, build, and route/link compatibility.

**Gate:** A deployed preview can load directly on nested routes and refresh without a 404; no secrets are present in the client bundle.

### Phase 2: Build Shared UX and Domain Types

- Define TypeScript types for members, leaders, departments, service dates, report rows, and API results. Generate database types from the Supabase schema where practical.
- Build accessible shared inputs, searchable select/autocomplete, date inputs, attendance controls, absence-reason fields, submit controls, and status/error banners.
- Set loading, empty, saving, success, conflict, unauthorized, and retryable-error states as explicit UI states rather than ad hoc alerts.
- Use responsive layouts designed around repeated data entry: optimized tab order, keyboard operation, readable member rows, touch-sized controls, and preserved form state.
- Establish visual tokens and test the actual forms at narrow mobile and desktop widths before implementing every workflow.

**Gate:** Shared components pass keyboard, screen-reader-label, validation, and mobile layout checks.

### Phase 3: Migrate One Vertical Slice at a Time

Recommended order:

1. G12 report: member loading, leader/date prefill, attendance, absence reason, duplicate/conflict state, successful submit.
2. Department report: department prefill, attendance and absence reasons, new joiners, transactional save.
3. Service and connect reports: typed field validation, numeric/date handling, and confirmed result states.
4. MVP registration: consistent registration and member records in one transaction.
5. Admin member search/profile-link generation and member profile update.

For each slice:

- Match existing question labels, values, and database fields unless a behavior change is approved.
- Move Supabase operations into feature services; React components should not construct SQL-like query chains directly.
- Add unit tests for normalization/validation and integration tests for the data command.
- Compare test payloads against the HTML version, then run the React form against a staging Supabase project.
- Keep the old route available until the new route passes workflow acceptance checks.

**Gate:** Each workflow is individually usable, tested, and reversible before the next workflow is cut over.

### Phase 4: Make Writes Correct Before General Cutover

- Define one business key per report type with church operations; do not infer uniqueness only from UI fields. Determine whether service type and zone distinguish valid reports.
- Add database uniqueness/transactional RPC or Edge Function enforcement. For batch attendance, persist the report and member rows atomically.
- Add idempotency keys for network retries and double submissions. Return the prior result when the same command is retried.
- Make MVP and member profile writes atomic and validate editable fields on the server.
- Backfill/normalize existing names only after testing canonicalization against real data; retain an audit trail and a rollback plan.

**Gate:** Concurrent requests produce one logical report; failure injection proves no partial batch/profile/signup writes; existing valid reports remain readable.

### Phase 5: Pending Status, Search, and Responsiveness

- Replace duplicate pending calculations with one server-side result used by the React UI and scheduled reminder function.
- Fetch only columns needed by each screen and paginate member searches. Debounce search input and discard stale responses when the query changes.
- Lazy-load route modules and reference data. Avoid loading all workflows and all members at initial page load.
- Update pending state after successful report submission and on a defined refresh policy; show when displayed data is stale and provide retry.
- Add request timeouts and retry only idempotent commands. Do not automatically replay a write that has no idempotency guarantee.
- Measure performance on real mobile network conditions and larger-than-current sample datasets.

**Gate:** Pending and reminders agree for the same snapshot/timezone; no stale search response replaces a newer result; performance targets are met on the agreed test devices.

### Phase 6: Preserve URLs and Cut Over Gradually

- Add React routes for canonical paths and compatibility mappings for existing `.html` paths, query-string forms, and `/u/:token` / `/update/:token` links.
- Preserve parameter names and values (`tab`, `leader`, `dept`, `token`, and `id`) during redirects; test encoded names and browser refresh/back navigation.
- Do not switch all links at once. Deploy preview, run admin acceptance, then route a small user group or selected workflow to React.
- Compare submission counts, duplicate conflicts, report totals, pending lists, and reminder logs against the old portal.
- Maintain a fast rollback to the old static portal while database writes remain compatible.
- After the compatibility period, remove old form implementations from deployable source while retaining a clearly archived backup outside the build/deploy path.

**Gate:** All legacy links resolve correctly; data parity is confirmed; rollback has been exercised before full traffic cutover.

### Phase 7: Security, Monitoring, and Operational Handoff

- Enforce RLS and server-side authorization for every read/write path. Profile tokens must be scoped, expiring/revocable, and stored hashed server-side.
- Keep service-role credentials only in Edge Function secrets. Review built assets and source maps for accidental credential exposure.
- Record correlation ID, workflow, result category, latency, and retry/duplicate outcome. Minimize personal data in logs.
- Alert on elevated failed submissions, duplicate conflicts, reminder failures, and slow queries; provide a runbook for recovery.
- Document deployment, database migration, cron, token revocation, and rollback operations.

**Gate:** Security tests pass for anonymous, authenticated, and server roles; operators can diagnose failed runs without relying on browser screenshots.

## Test Strategy

| Layer | Coverage |
| --- | --- |
| Unit | Date/service-day boundaries, leader and department normalization, field validation, payload mapping, idempotency result handling. |
| Component | Attendance controls, conditional absence reasons, form state preservation, loading/conflict/success/error UI, keyboard use. |
| Integration | Supabase RPC/Edge Function commands, transaction rollback, uniqueness under concurrency, RLS, token expiration/revocation. |
| End-to-end | All workflows on mobile and desktop, direct nested-route refresh, query-prefilled forms, old `.html` redirects, `/u/:token`, retry after timeout. |
| Operational | Cron dry-run, duplicate cron invocation, WhatsApp failure, network outage, rollback and restore procedure. |

## Suggested First Release Scope

Keep the first React release focused on the reporting portal and preserve the existing form contracts. Do not add unrelated dashboard features during the rewrite. Profile token security and transactional write enforcement are prerequisites for exposing the corresponding workflows broadly, even if their visual migration comes later.

## Key Risks and Mitigations

- **Unknown deployed copy:** verify live deployment before selecting canonical source; use route-by-route migration.
- **Schema drift:** capture payloads and generate schema types; remove compatibility fallbacks only after database state is verified.
- **Duplicate writes during cutover:** make server/database idempotency available to both old and new clients before switching traffic.
- **Broken WhatsApp links:** retain and test redirects with all parameters; do not change reminder URLs until compatibility is confirmed.
- **Unauthorized profile edits:** complete RLS and token authorization before broad launch; member ID in a URL is not authorization.
- **React app becomes a monolith:** migrate feature slices and keep business/data operations out of rendering components.

## Completion Criteria

- One React codebase serves the maintained workflows, with no duplicate HTML form implementations in the deployment source.
- Existing URLs, deep links, and reminder links continue to work.
- Each submission is validated, authorized, transactional, and idempotent according to an agreed business key.
- Portal pending status and scheduled reminder selection share the same date and completeness rules.
- Users receive clear, accessible feedback and can recover from slow or failed requests without losing form input.
- CI, security checks, performance checks, monitoring, documentation, and rollback procedures are in place.