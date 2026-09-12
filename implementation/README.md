# 🏛️ Solution A: Unified NCF Reporting Portal (Implementation)

This directory houses the consolidated single-portal architecture for **New Covenant Family (NCF), UNN**, solving the multi-file HTML sprawl without changing a single form question, input ID, or Supabase schema column.

---

## 📂 Directory Structure

```
implementation/
├── index.html                  # Master Unified Portal (Tab Switcher + Missing Reports Alert)
├── README.md                   # This specification & deployment guide
├── images.png                  # NCF Logo Asset
├── fyf.jpg                     # Ambient background asset
├── eagle2026.png               # Banner asset
│
├── shared/
│   ├── supabase.js             # Single shared Supabase client (https://cjbedftdexzcsydwayig.supabase.co)
│   ├── leaders.js              # Canonical LEADER_DICTIONARY & normalizeLeaderName()
│   └── theme.css               # Shared glassmorphic design system & tab navigation styles
│
├── tabs/                       # 100% UNTOUCHED form templates (preserving questions & Supabase bindings)
│   ├── g12.html                # Discipleship cell report (writes to g12_reports)
│   ├── dept.html               # Departmental attendance (writes to dept_reports)
│   ├── connect.html            # Connect group meeting report (writes to cell_reports)
│   ├── service.html            # Sunday/Midweek attendance (writes to service_reports)
│   └── mvp.html                # Worker/volunteer onboarding (writes to mvps & members)
│
└── redirects/                  # Instant forwarding shims for WhatsApp links & existing bookmarks
    ├── G12report.html          # Redirects to index.html?tab=g12
    ├── Department.html         # Redirects to index.html?tab=dept
    ├── connect.html            # Redirects to index.html?tab=connect
    ├── cellreport.html         # Redirects to index.html?tab=connect
    ├── servicereport.html      # Redirects to index.html?tab=service
    └── mvp.html                # Redirects to index.html?tab=mvp
```

---

## 🔒 Guarantee: Zero Breaking Changes to Forms or Supabase

As instructed:
1. **No Questions Changed:** All questions, labels, options, placeholders, and descriptions are preserved exactly as they were in the original HTML files.
2. **No Field Names or IDs Changed:** All `id`, `name`, `class`, and JavaScript variable names are identical.
3. **No Database Schema Alterations:** The exact Supabase tables (`g12_reports`, `dept_reports`, `cell_reports`, `service_reports`, `mvps`, `members`) receive the exact same JSON payloads.

---

## 🚀 How Deep-Linking & WhatsApp Reminders Work

The master `index.html` accepts `?tab=...` query parameters:

| Desired Form | Direct Link | When Used |
| :--- | :--- | :--- |
| **G12 Discipleship Report** | `https://reports.ncfunn.site/?tab=g12` | Wednesday/Sunday WhatsApp Reminders |
| **Department Report** | `https://reports.ncfunn.site/?tab=dept` | Wednesday/Sunday Department Reminders |
| **Connect Group Report** | `https://reports.ncfunn.site/?tab=connect` | Weekly cell group meetings |
| **Service Attendance** | `https://reports.ncfunn.site/?tab=service` | Sunday/Midweek Church services |
| **MVP Registration** | `https://reports.ncfunn.site/?tab=mvp` | First-timer / Worker onboarding |

### Forwarding Parameters:
If a reminder sends `https://reports.ncfunn.site/?tab=g12&leader=Tony%20Ubagu`, the master portal passes `&leader=Tony%20Ubagu` straight to the G12 form so the leader's name is pre-selected automatically.

---

## 🛡️ Backward Compatibility Guarantee

If a leader has an old URL bookmarked or taps an old WhatsApp message linking to:
* `https://reports.ncfunn.site/Department.html`
* `https://reports.ncfunn.site/G12report.html`

The shims in `redirects/` immediately forward their browser to:
* `https://reports.ncfunn.site/index.html?tab=dept`
* `https://reports.ncfunn.site/index.html?tab=g12`

No links break.

---

## 🛠️ Deployment Steps (When Ready to Go Live)

When you are ready to make this live on `reports.ncfunn.site`:
1. Copy the contents of `implementation/redirects/*.html` to `Ncfreport/` (or keep them active).
2. Copy `implementation/index.html`, `implementation/shared/`, and `implementation/tabs/` to your web server / hosting root.
