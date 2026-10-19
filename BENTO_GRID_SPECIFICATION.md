# ChurchFlow Executive Dashboard — Bento Grid Specification & Review

This file defines the modular **Bento Grid** architecture for the ChurchFlow Executive Dashboard. You can review, edit card titles, change metric sources, toggle card visibility, adjust grid spans (col-span / row-span), and update action links.

---

## 🍱 Bento Grid Layout Map (Visual Wireframe)

```
+---------------------------------------------------------------------------------------------------------------+
| [SPECIAL ANNOUNCEMENT BANNER] (Full Width Banner — Linked directly with Live Ticker)                          |
+---------------------------------------------------------------------------------------------------------------+
| [LIVE TICKER: Birthday Alerts · Live Feed · Broadcast Links] (Infinite Seamless Scroll)                       |
+------------------------------------+------------------------------------+------------------------------------+
| CARD 1: Registered Members         | CARD 2: Active Workers             | CARD 3: Connect Groups             |
| Total: 500+ members [Blue Pill]    | Total: 120+ workers [Green Pill]   | Total: 18 Cells, Across 9 Zones    |
+------------------------------------+------------------------------------+------------------------------------+
| CARD 4: MVPs / First-Timers        | CARD 5: Souls Won This Week        | CARD 6: Retention & Health Rate    |
| Weekly Assimilation Report [Amber] | Field Outreach Harvest [Rose Pill] | Attendance Retention: 87.4% [Gold] |
+------------------------------------+------------------------------------+------------------------------------+
| CARD 7: Service Attendance Growth Curve (D3) — [2 Column Span]          | CARD 8: 6-Stage Growth Pipeline    |
| 1M / 3M / 6M / 1Y Interactive Growth Curve SVG Line Chart               | Convert ➔ Worker ➔ Cell Leader...  |
+-------------------------------------------------------------------------+------------------------------------+
| CARD 9: Unit Workforce Attendance [1 Column Span]                       | CARD 10: Retention Care Pipeline   |
| Angels, Ushers, Media, MVP, Temple, Intercessory, Admin, Tech           | 24h Message, 72h Care, Cell Connect|
+-------------------------------------------------------------------------+------------------------------------+
| CARD 11: Monthly Attendance Heatmap [1 Column Span]                     | CARD 12: Platform Modules Launcher |
| GitHub-style 7-day service frequency grid                               | Quick jump to M4, M5, M6, M7, M8   |
+-------------------------------------------------------------------------+------------------------------------+
| CARD 13: Recent Synchronized Members Table [Full Width 3-Column Span]                                         |
| Live Supabase membership sync table with search, filters, and export button                                   |
+---------------------------------------------------------------------------------------------------------------+
```

---

## 📝 Editable Bento Card Configurations

You can edit any text, metric, accent color, or column span in this file or directly in [`bentoGrid.config.ts`](file:///c:/Users/USER/Desktop/ATTENDANCE%20TRACKER/churchflow/src/config/bentoGrid.config.ts).

### Banner 1: Special Announcement Banner
- **Config Key**: `announcementBanner`
- **Enabled**: `true`
- **Badge**: `GENERAL ANNOUNCEMENT`
- **Title**: `Sunday Service Reports & Discipleship Week`
- **Message**: `All G12 shepherds and Directorate heads are reminded that weekly attendance and follow-up logs must be submitted by 2:00 PM WAT.`
- **Action Label**: `Submit G12 Report`
- **Action Link**: `/reports/g12`
- **Linkage**: Automatically injected into the scrolling **Live Ticker** as a high-priority clickable broadcast!

---

### Banner 2: Live Ticker
- **Config Key**: `liveTicker`
- **Enabled**: `true`
- **Label**: `🔴 Live Feed`
- **Items**:
  - `Franco Zone: 14 cell attendees registered`
  - `Hilltop Squad: 8 souls won in Saturday field outreach`
  - `Media Directorate: Weekly Sunday checklist completed`
  - `Celebration Service: Birthday greetings sent to 4 members today`
- **Dynamic Elements**: Automatically synchronizes today's birthday celebrants with cake emojis from Supabase!

---

### Tile 1: Registered Members
- **ID**: `p1-members`
- **Grid Placement**: 1 Column (`col-1`)
- **Card Title**: `Registered Members`
- **Subtitle**: `Master Database`
- **Icon**: `Users`
- **Accent Color**: `var(--blue)`
- **Visible**: `true`
- **Action Target**: `/members`

---

### Tile 2: Active Workers
- **ID**: `p2-workers`
- **Grid Placement**: 1 Column (`col-1`)
- **Card Title**: `Active Workers`
- **Subtitle**: `Across 12 Units`
- **Icon**: `UserCheck`
- **Accent Color**: `var(--green)`
- **Visible**: `true`
- **Action Target**: `/departments`

---

### Tile 3: Active Connect Groups
- **ID**: `p3-connect`
- **Grid Placement**: 1 Column (`col-1`)
- **Card Title**: `Active Connect Groups`
- **Subtitle**: `Across 9 Zones`
- **Icon**: `Compass`
- **Accent Color**: `#06b6d4`
- **Visible**: `true`
- **Action Target**: `/connect`

---

### Tile 4: MVPs / First-Timers
- **ID**: `p4-mvp`
- **Grid Placement**: 1 Column (`col-1`)
- **Card Title**: `MVPs / First-Timers`
- **Subtitle**: `Weekly Assimilation Report`
- **Icon**: `HeartHandshake`
- **Accent Color**: `var(--amber)`
- **Visible**: `true`
- **Action Target**: `/mvp`

---

### Tile 5: Souls Won This Week
- **ID**: `p5-converts`
- **Grid Placement**: 1 Column (`col-1`)
- **Card Title**: `Souls Won This Week`
- **Subtitle**: `Field Outreach & Evangelism`
- **Icon**: `Flame`
- **Accent Color**: `#f43f5e`
- **Visible**: `true`
- **Action Target**: `/soul-winning`

---

### Tile 6: Service Retention Rate
- **ID**: `ret-retention`
- **Grid Placement**: 1 Column (`col-1`)
- **Card Title**: `Service Retention Rate`
- **Subtitle**: `Weekly Sunday consistency`
- **Icon**: `TrendingUp`
- **Accent Color**: `#8b5cf6`
- **Visible**: `true`
- **Action Target**: `/attendance`

---

### Tile 7: Spiritual Growth Journey (6 Progressive Stages)
- **Config Key**: `growthJourney`
- **Title**: `🌱 Spiritual Growth Journey (5 Levels of Growth)`
- **Stages**:
  1. `Level 1`: **New Convert/ MVP** (84 souls)
  2. `Level 2`: **Worker** (62 enrolled)
  3. `Level 3`: **Connect Group Leader** (45 ready)
  4. `Level 4`: **Departmental Leader** (120 active)
  5. `Level 5`: **Directorate Head** (36 shepherding)
  6. `Level 6`: **Pastorate** (36 shepherding)

---

### Tile 8: Unit Workforce Attendance
- **Config Key**: `directorateHealth`
- **Title**: `Unit Workforce Attendance`
- **Units & Heads**:
  - `NCF Angels`: 94% · Head: **Kosi Onyibor**
  - `Ushering`: 92% · Head: **Kosi Mbamalu**
  - `Media`: 88% · Head: **Nelson Okeke**
  - `MVP & Greeters`: 90% · Head: **janefrancis Igwilo**
  - `Temple Tending`: 85% · Head: **Ifeyinwa Umeadi**
  - `Intercessory`: 94% · Head: **Godreigns Anyachebelu**
  - `Administration`: 92% · Head: **Ella Okonkwo**
  - `Technical Crew`: 88% · Head: **Udochukwu Aneke**

---

### Tile 9: High-Priority Retention Pipeline
- **Config Key**: `priorityFollowUps`
- **Title**: `High-Priority Retention Pipeline`
- **Action Stages**:
  - `Stage 1`: **24hrs Appreciation message(Acknowledge)** (18 Pending)
  - `Stage 2`: **72 Hrs Personal interaction(Care)** (12 Pending)
  - `Stage 3`: **Saturday Cell Integration(Connect)** (24 Pending)

---

### Tile 10: Attendance Heatmap (New Config!)
- **Config Key**: `attendanceHeatmap`
- **Visible**: `true`
- **Title**: `Monthly Attendance Heatmap`
- **Subtitle**: `7-column weekly attendance frequency and consistency tracking`

---

### Tile 11: Primary Platform Modules Launcher (New Config!)
- **Config Key**: `primaryModules`
- **Visible**: `true`
- **Title**: `Primary Platform Modules`
- **Subtitle**: `Select a ministry department or management tool to review rosters and submit reports.`
- **Modules**:
  - `4. Discipleship & Foundation School` ➔ `/discipleship` (Badge: Active Cohort)
  - `5. Soul Winning & Field Mobilization` ➔ `/soul-winning` (Badge: Outreach Active)
  - `6. G12 Discipleship Network` ➔ `/g12` (Badge: 12 Shepherds)
  - `7. Connect Groups (3x3 Zones Grid)` ➔ `/connect` (Badge: 18 Cells)
  - `8. Departments & Units Directory` ➔ `/departments` (Badge: 8 Units)

---

### Tile 12: Recent Synchronized Members Table (New Config!)
- **Config Key**: `recentMembers`
- **Visible**: `true`
- **Title**: `Recent Synchronized Members`
- **Subtitle**: `Latest profiles active in the NCF UNN membership database`
- **Limit**: `6`
- **View All Action**: `Open Membership Database` ➔ `/members`
- **Columns**: `Member Name`, `Phone`, `Department`, `G12 Leader`, `Zone`, `Status`
