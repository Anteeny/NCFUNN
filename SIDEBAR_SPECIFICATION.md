# ChurchFlow Sidebar Navigation — Specification & Review

This file defines the modular configuration for the **Sidebar Drawer Navigation** ([`SidebarDrawer.tsx`](file:///c:/Users/USER/Desktop/ATTENDANCE%20TRACKER/churchflow/src/components/ui/SidebarDrawer.tsx)). 

The live code configuration is located in:
👉 **[`sidebar.config.ts`](file:///c:/Users/USER/Desktop/ATTENDANCE%20TRACKER/churchflow/src/config/sidebar.config.ts)**

---

## 🧭 Sidebar Structure Map

```
+-------------------------------------------------------------+
| [✦] ChurchFlow                                          [X] |
|     NCF UNN MAIN PORTAL                                     |
+-------------------------------------------------------------+
| PRIMARY MODULES                                             |
|  [⊞] 1. Executive Dashboard                 ➔ /             |
|  [👥] 2. Membership Database                ➔ /members      |
|  [📅] 3. Attendance Tracker                 ➔ /attendance   |
|  [🎓] 4. Discipleship & Classes             ➔ /discipleship |
|  [🔥] 5. Soul Winning & Mob                 ➔ /soul-winning |
|  [🕸️] 6. G12 Management                     ➔ /g12          |
|  [🧭] 7. Connect Groups                     ➔ /connect      |
|  [🏢] 8. Departments & Units                ➔ /departments  |
|  [⚙️] 9. Settings & Admin                   ➔ /settings     |
+-------------------------------------------------------------+
| REPORTING ACTIONS                                           |
|  [📊] Open G12 Report Form                  ➔ /reports/g12  |
|  [🧭] Open Connect Report Form              ➔ /reports/cell |
|  [🏢] Open Dept Report Form                 ➔ /reports/dept |
|  [➕] Register First-Timer (MVP)            ➔ /mvp          |
+-------------------------------------------------------------+
| (AD) NCF Administrator                                      |
|      Executive Super Admin                                  |
+-------------------------------------------------------------+
```

---

## 📝 Editable Sidebar Configuration Fields

### 1. Brand Header
- **Symbol**: `✦` (or any emoji like `🕊️`)
- **App Name**: `ChurchFlow`
- **Portal Name**: `NCF UNN MAIN PORTAL`

---

### 2. Primary Modules (`primaryNav.items`)
| # | Label | Route (`to`) | Icon | Visible |
|---|---|---|---|---|
| 1 | `1. Executive Dashboard` | `/` | `LayoutDashboard` | `true` |
| 2 | `2. Membership Database` | `/members` | `Users` | `true` |
| 3 | `3. Attendance Tracker` | `/attendance` | `CalendarCheck` | `true` |
| 4 | `4. Discipleship & Classes` | `/discipleship` | `GraduationCap` | `true` |
| 5 | `5. Soul Winning & Mob` | `/soul-winning` | `Flame` | `true` |
| 6 | `6. G12 Management` | `/g12` | `Network` | `true` |
| 7 | `7. Connect Groups` | `/connect` | `Compass` | `true` |
| 8 | `8. Departments & Units` | `/departments` | `Building2` | `true` |
| 9 | `9. Settings & Admin` | `/settings` | `Settings` | `true` |

---

### 3. Reporting Actions (`actionForms.items`)
| Action Form | Route (`to`) | Color Accent | Icon | Visible |
|---|---|---|---|---|
| `Open G12 Report Form` | `/reports/g12` | `#38bdf8` (Sky Blue) | `FileSpreadsheet` | `true` |
| `Open Connect Report Form` | `/reports/cell` | `#34d399` (Emerald) | `Compass` | `true` |
| `Open Dept Report Form` | `/reports/department` | `#a78bfa` (Purple) | `Building2` | `true` |
| `Register First-Timer (MVP)` | `/mvp` | `#fbbf24` (Amber) | `PlusCircle` | `true` |

---

### 4. User Footer Profile (`userProfile`)
- **Initials**: `AD`
- **Name**: `NCF Administrator`
- **Role**: `Executive Super Admin`
