# ChurchFlow — Master SaaS Rebuild & Implementation Plan
**Flagship Deployment:** NCF UNN Attendance & Ministry Management Platform  
**Target Architecture:** Multi-Tenant Church Management & Attendance SaaS  
**Author:** Senior Full-Stack Architect & AI/SaaS Systems Engineer  
**Date:** October 2026  

---

## 1. Executive Summary & Vision

### 1.1 The Vision
Transform the scattered collection of standalone HTML files, duplicated forms, and manual scripts currently powering the NCF UNN Attendance Tracker into a unified, enterprise-grade React Single-Page Application (SPA) named **ChurchFlow**.

### 1.2 The Two-Pronged Mission
1. **Immediate Mission (NCF UNN Flagship):** Provide a rock-solid, lightning-fast, and beautiful platform that handles 100% of NCF UNN's live operations (G12 networks, departments, cell connect groups, Sunday/midweek services, MVP tracking, and member profile updates) with zero workflow downtime, zero data loss, and complete backward compatibility with all active WhatsApp links.
2. **Commercial SaaS Mission (Market Ready):** Architect the platform from Day 1 with multi-tenant domain isolation (`tenant_id`), configurable hierarchy terminology (Zones, Cells, Lifegroups, Departments), Role-Based Access Control (RBAC), and customizable branding so it can be packaged, marketed, and sold to other churches, campus fellowships, and global ministry networks.

---

## 2. Current State Audit & Technical Debt Elimination

### 2.1 The Problem Matrix (What We Are Eliminating)

| Issue | Current Architecture | ChurchFlow Rebuild Solution |
| :--- | :--- | :--- |
| **Fragmented Codebase** | 8+ independent HTML files (`Website/index.html` with 16k+ lines, `Ncfreport/*.html`, `Attendance/tracker.html`, `Update/update-profile.html`, `DCNSK/`). | Single React + TypeScript component-driven codebase with shared layouts, design tokens, and modular feature slices. |
| **Duplicate Logic & Queries** | Same leader lists, Supabase connections, and date calculations re-declared across 6 different files. | Single authoritative Data Service Layer using TanStack Query (React Query) for smart caching, background revalidation, and zero redundant queries. |
| **Race Conditions & Double Submissions** | Client-side `checkDuplicate()` followed by a separate `insert()` creates race conditions on double-clicks or unstable mobile connections. | Database-enforced atomic RPCs (PostgreSQL functions) with idempotency keys; guaranteed atomic write of parent report + child attendance rows. |
| **Un-atomic Multi-Table Writes** | MVP registration writes to `mvps` and `members` in separate network calls; if call 2 fails, database is corrupted. | Single transactional RPC `create_mvp_registration()` wrapped in a Postgres transaction (`BEGIN...COMMIT`). |
| **Timezone Inconsistencies** | Client browser uses local device clock / UTC while Supabase edge functions use WAT (`Africa/Lagos`), causing midnight date mismatches. | Canonical Date Utility locked to `Africa/Lagos` (WAT) across client and server. |
| **Security & Profile Access** | `update-profile.html` loads member by raw database UUID from URL path, vulnerable if RLS is loose. | Cryptographic expiring magic tokens verified server-side with strict column allowlists. |
| **UX & Error Handling** | Disparate alert boxes (`alert()`), jarring page reloads, and inconsistent color styles. | Unified Toast/Modal feedback system, optimistic UI updates, skeleton loading states, and executive dual-theme aesthetic. |

---

## 3. Technology Stack & System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CHURCHFLOW FRONTEND                      │
│   React 19 + TypeScript + Vite + Tailwind CSS / Tokens      │
├──────────────────────────────┬──────────────────────────────┤
│       Routing & Shell        │      State & Data Layer      │
│  React Router v7 (Lazy-loaded│  TanStack Query v5 (Caching) │
│   routes, link fallbacks)    │  Zustand (Global client UI)  │
├──────────────────────────────┼──────────────────────────────┤
│      UI Components & UX      │         Form Engine          │
│  Custom Design System Tokens │  React Hook Form + Zod       │
│  Radix UI Primitives         │  Type-safe client validation │
│  Lucide / Tabler Icons       │  Auto-saving draft cache     │
└──────────────────────────────┴──────────────────────────────┘
                               │
               HTTPS / Encrypted REST & Realtime
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND & DATA PLATFORM                   │
│                     Supabase PostgreSQL                     │
├─────────────────────────────────────────────────────────────┤
│ • Row-Level Security (RLS) per Tenant (`tenant_id`)         │
│ • Atomic RPC Stored Procedures (Transactions & Idempotency) │
│ • Supabase Edge Functions (WhatsApp Bot & Reminders)        │
│ • Supabase Cron (`pg_cron`) for Scheduled Jobs (WAT)        │
└─────────────────────────────────────────────────────────────┘
```

### 3.1 Technology Selection
* **Core Framework:** React 19 / 18 with TypeScript for complete type safety.
* **Build Tool:** Vite for instantaneous HMR, optimized tree-shaking, and tiny bundle chunks.
* **State & Data Fetching:** TanStack Query (React Query v5) for query deduplication, garbage collection, and optimistic UI updates.
* **Forms & Validation:** React Hook Form paired with Zod schemas. Zero re-renders on keystrokes, instant validation feedback.
* **Design & Styling:** Custom CSS Tokens (established in `ADMIN_COLOR_IMPLEMENTATION_PLAN.md`) combined with Tailwind utilities for layout agility.
* **Icons & Animation:** Tabler Icons & Lucide Icons; lightweight CSS transitions and Framer Motion micro-interactions.
* **Backend Integration:** `@supabase/supabase-js` v2 initialized through a single authenticated client wrapper.

---

## 4. Directory & Module Structure

```text
churchflow/
├── public/                     # Static assets, logos, favicon, PWA manifest
├── src/
│   ├── app/                    # Application root
│   │   ├── App.tsx             # Root providers (QueryClient, Theme, Toast)
│   │   ├── router.tsx          # Route definitions & compatibility redirects
│   │   └── Layout.tsx          # Dynamic shell (TopBar, Sidebar, Footer)
│   │
│   ├── assets/                 # Brand graphics, wallpapers, logos
│   ├── config/                 # Environment variables, tenant defaults
│   │
│   ├── features/               # Domain-Driven Modules
│   │   ├── auth/               # Login, session management, RBAC guards
│   │   ├── dashboard/          # Executive dashboard, KPI stats, charts, ticker
│   │   ├── reports/            # Core reporting workflows
│   │   │   ├── g12/            # G12 Leader reports & attendance matrix
│   │   │   ├── department/     # Departmental worker attendance
│   │   │   ├── cell/           # Cell / Connect group reports
│   │   │   └── service/        # Sunday / Midweek mass service audits
│   │   ├── members/            # Directory, member profile editor, magic link handler
│   │   ├── mvp/                # MVP (First Timers) onboarding & follow-up
│   │   ├── attendance/         # Real-time service attendance tracker & QR scanner
│   │   └── settings/           # Church branding, tenant config, user roles
│   │
│   ├── components/             # Shared UI Component Library
│   │   ├── ui/                 # Buttons, Cards, Inputs, Select, Badges, Modals, Toasts
│   │   ├── data-table/         # Reusable paginated tables with sorting & filtering
│   │   ├── heatmap/            # GitHub-style 7-day attendance heatmaps
│   │   └── feedback/           # Skeleton loaders, empty states, error boundaries
│   │
│   ├── lib/                    # Infrastructure Utilities
│   │   ├── supabase.ts         # Authoritative Supabase client
│   │   ├── date.ts             # Africa/Lagos (WAT) date calculation engine
│   │   ├── leader-dictionary.ts# Canonical name mapping & alias resolution
│   │   └── error-mapper.ts     # User-friendly error message transformations
│   │
│   ├── services/               # Typed Supabase Database & RPC Calls
│   │   ├── report.service.ts
│   │   ├── member.service.ts
│   │   ├── analytics.service.ts
│   │   └── reminder.service.ts
│   │
│   └── types/                  # TypeScript Interfaces & Supabase Schema Types
│       ├── database.types.ts
│       ├── reports.types.ts
│       └── tenant.types.ts
```

---

## 5. Core Feature Specifications & Re-Engineering

### 5.1 Module 1: Executive Admin Dashboard & Analytics
* **Ported from:** `Website/index.html` (16k lines condensed into clean React components).
* **Components:**
  * **Portal Header Card:** Executive dark obsidian card with live time in WAT, service badge, and quick actions.
  * **Live Ticker Container:** Smooth auto-scrolling ticker with pause-on-hover, displaying today's birthdays, upcoming birthdays, and attendance milestones.
  * **KPI Summary Grid (`.stats-grid`):** Total attendance, growth rate percentage, active G12 cells, weekly retention, and department coverage.
  * **Interactive Charting:** Chart.js or Recharts widgets for Sunday attendance trends, zone distribution comparisons, and department retention.
  * **Attendance Heatmap:** 7-column monthly frequency matrix with graduated green density tiles (`.att-cell.high`, `.att-cell.mid`, `.att-cell.low`).

### 5.2 Module 2: The Unified Reporting Engine
* **Ported from:** `Ncfreport/*.html` and `implementation/tabs/*.html`.
* **Sub-Workflows:**
  1. **G12 Report:** Leader autocomplete, dynamic member checklist, absence reason categorization, and instant calculation of present vs. absent.
  2. **Department Report:** Unit selection, worker attendance, new volunteer capture, and operational remarks.
  3. **Cell / Connect Report:** Zone/group dropdown, venue tracking, meeting topics, and financial record capture.
  4. **Sunday & Midweek Service Report:** Headcounts (Men, Women, Children, Teens), first-time visitors, vehicles, and offering audit.
* **Integrity Guarantee:**
  * Client sends an `idempotency_key` (UUID v4 generated per form session).
  * Backend RPC `submit_g12_report()` checks for existing report by `(leader_id, service_date, service_type)` inside a serializable transaction. If found, updates or returns existing; if new, writes report header + all attendance lines atomically.

### 5.3 Module 3: Member Directory & Profile Self-Service
* **Ported from:** `Update/update-profile.html`.
* **Features:**
  * **Public Token Route (`/u/:token` & `/update/:token`):** Fully preserves existing WhatsApp broadcast links.
  * **Safe Field Editing:** Members can edit their phone, birthday, department, hostel/residence, and fellowship status. Sensitive admin fields remain read-only.
  * **Leader Autocomplete:** Integrated search with keyboard arrow navigation against the canonical leader dictionary.
  * **Admin Member Management:** Full table view with debounced instant search, column filters (by Zone, Department, G12, Graduating Year), and CSV export.

### 5.4 Module 4: MVP (First-Timer) Onboarding Pipeline
* **Ported from:** `implementation/tabs/mvp.html`.
* **Features:**
  * Captures personal info, prayer requests, born-again status, and host cell.
  * Single atomic transaction inserts into `mvps` and creates a linked shadow record in `members` without orphaned rows.
  * Automated WhatsApp welcome trigger dispatch via Supabase Edge Function.

### 5.5 Module 5: Automated Reminders & Pending Reconciler
* **Ported from:** `supabase/functions/send-reminders/` and `supabase/cron_schedules.sql`.
* **Re-Engineering:**
  * Unified SQL View `v_pending_reports` shared by both the dashboard UI and WhatsApp reminder bot.
  * Eliminates the bug where client cache and backend bot disagree on who has submitted.
  * Scheduled runs strictly locked to `Africa/Lagos` Sunday 2:00 PM and Wednesday 8:00 PM WAT.

---

## 6. Multi-Tenant SaaS Commercialization Layer

To transform this platform into a commercially viable product (**ChurchFlow**) that can be sold to other ministries:

1. **Tenant Separation:**
   * Add `tenant_id UUID REFERENCES tenants(id)` to all core tables (`members`, `reports`, `departments`, `zones`).
   * Postgres Row Level Security (RLS) automatically scopes every query to `auth.jwt() -> 'tenant_id'`.
2. **Dynamic Vocabulary Engine:**
   * NCF UNN uses: *Zones*, *G12*, *Cells*, *Units*.
   * Another church can configure: *Districts*, *Life Groups*, *Home Fellowships*, *Ministries*.
   * Configurable JSON schema loaded at tenant initialization.
3. **White-Label Branding:**
   * Configurable church logo, brand colors (Primary Blue, Dark Accent), custom domain support (`portal.mychurch.org`).
4. **Role-Based Access Control (RBAC):**
   * **Super Admin (Platform Owner):** Multi-tenant provisioning and billing.
   * **Church Lead Pastor / Admin:** Full access to all church reports, member databases, and settings.
   * **Department Head:** Access restricted to their specific department attendance and roster.
   * **G12 / Cell Leader:** Access restricted to their cell members and reports.

---

## 7. Phased Implementation Roadmap

```
Phase 1: Project Setup & Foundation           [Days 1 - 3]
Phase 2: Database Hardening & Atomic RPCs      [Days 4 - 6]
Phase 3: Unified Reporting Engine Migration   [Days 7 - 12]
Phase 4: Member Portal & Profile Self-Service [Days 13 - 16]
Phase 5: Executive Dashboard & Analytics      [Days 17 - 21]
Phase 6: Multi-Tenant Config & Staging Test   [Days 22 - 25]
Phase 7: Zero-Downtime Production Cutover     [Days 26 - 28]
```

### Phase 1: Project Setup & Foundation
* Initialize Vite + React 19 + TypeScript in a clean architecture directory.
* Install dependencies: `@supabase/supabase-js`, `react-router-dom`, `@tanstack/react-query`, `react-hook-form`, `zod`, `lucide-react`, `chart.js`.
* Implement the global design token system matching `ADMIN_COLOR_IMPLEMENTATION_PLAN.md`.
* Build standard UI primitives: `Button`, `Card`, `Input`, `Select`, `Modal`, `Toast`, `Badge`.

### Phase 2: Database Hardening & Atomic RPCs
* Write and test PostgreSQL migration scripts in Supabase:
  * `rpc_submit_g12_report()` — Atomic header + items with duplicate protection.
  * `rpc_submit_dept_report()` — Atomic department attendance insert.
  * `rpc_submit_mvp_registration()` — Cohesive dual-write to `mvps` and `members`.
  * `v_pending_reports` — Centralized view for pending status in WAT.
* Verify RLS policies to prevent unauthorized member updates.

### Phase 3: Unified Reporting Engine Migration
* Build the reactive G12 report form with member loading, absence checkboxes, and leader prefill.
* Build the Department report form with worker rosters.
* Build the Cell / Connect report and Service audit forms.
* Integrate React Hook Form + Zod with optimistic UI states.
* Test against live Supabase staging data.

### Phase 4: Member Portal & Profile Self-Service
* Build the `/u/:token` magic link route with backwards compatibility for all WhatsApp broadcasts.
* Implement the autocomplete leader selector with keyboard navigation.
* Build the Admin Member Management view with debounced search, filtering, and pagination.

### Phase 5: Executive Dashboard & Analytics
* Rebuild the Executive Portal Header Card and Topbar.
* Rebuild the Live Ticker with smooth infinite scrolling and birthday highlights.
* Rebuild the KPI cards (`.stats-grid`) and monthly heatmap (`.attendance-grid`).
* Implement interactive Chart.js visualizations.
* Rebuild the slide-out navigation drawer (`.sidebar`) with role-based routing.

### Phase 6: Multi-Tenant Config & Staging Testing
* Introduce the tenant configuration provider (`useTenantConfig()`).
* Run comprehensive end-to-end tests across mobile devices (iOS Safari, Android Chrome) and desktop browsers.
* Validate that legacy URLs (`/G12report.html`, `/Department.html`, etc.) redirect cleanly to the new React routes with all query parameters (`?leader=...&dept=...`) preserved.

### Phase 7: Production Cutover & Deployment
* Deploy production build to Vercel with SPA fallback rewrites.
* Verify zero 404s on deep links.
* Provide an immediate rollback mechanism if needed.

---

## 8. Safety, Compatibility & Zero-Downtime Guarantee

1. **Preservation of Existing Links:**
   All links currently circulating on WhatsApp or saved on leaders' home screens (`/u/:id`, `/update/:id`, `/G12report.html?leader=JohnDoe`, etc.) will be seamlessly handled by React Router compatibility redirects. Leaders will not experience broken links.
2. **Preservation of Data:**
   No existing tables will be dropped or renamed during this migration. The React application will connect directly to the existing Supabase project, reading and writing to the verified schemas.
3. **Side-by-Side Validation:**
   The new React app can run on a preview staging URL (e.g. `v2.ncfunn.site` or Vercel preview) where church administrators can test actual submissions side-by-side with the old system before flipping the primary domain DNS.

---

## 9. Next Steps & Approval Request

With this master plan documented:
1. **Review:** Review the architectural blueprint above and confirm any specific adjustments.
2. **Approval to Proceed:** Upon your go-ahead, we will begin **Phase 1: Project Setup & Foundation** by bootstrapping the React + TypeScript app shell and the core component library.
