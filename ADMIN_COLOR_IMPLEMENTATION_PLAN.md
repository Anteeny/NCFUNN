# NCF UNN Admin Portal — Color Implementation Plan

This document outlines the complete design token specification, component-by-component color mappings, surface treatments, borders, and contrast hierarchies for the **NCF UNN Main Admin Portal** (`Website/index.html`).

---

## 1. Dual-Palette System Architecture

The admin portal operates on a synchronized dual-theme system:
* **Light Mode (Executive Hybrid)**: Corporate high-contrast design with clean white cards, crisp royal blue branding, and subtle slate workspace tones.
* **Dark Mode (Cyber Navy / Deep Space)**: Glassmorphic layers on deep midnight obsidian (`rgba(15, 23, 42, 0.88)`), accented with vibrant sky/cyan blue (`#38bdf8`) and luminous borders.

### Global CSS Design Tokens

| Token Name | Light Mode (Default) | Dark Mode (`[data-theme="dark"]`) | Role & Purpose |
| :--- | :--- | :--- | :--- |
| `--blue` (Primary) | `#2563eb` (Royal Blue) | `#38bdf8` (Sky Blue) | Primary interactive actions, active borders, link hovers |
| `--blue-light` | `#e0f2fe` (Ice Blue) | `#0284c7` (Ocean Blue) | KPI backgrounds, soft badges |
| `--blue-soft` | `rgba(37, 99, 235, 0.12)` | `rgba(56, 189, 248, 0.20)` | Glow highlights, active tab fills, focus rings |
| `--navy` | `#0b1320` (Dark Obsidian) | `#0b1320` (Obsidian Navy) | Executive portal header card, sidebar drawer background |
| `--navy-mid` | `#111c2e` | `#1e293b` (Slate Midnight) | Secondary container fills |
| `--navy-soft` | `rgba(15, 23, 42, 0.05)` | `rgba(255, 255, 255, 0.08)` | Bar chart tracks, hover backgrounds on white surfaces |
| `--bg-app` | `#f8fafc` (Slate 50) | `#090e1a` + Backdrop Blur | Base viewport background |
| `--card` | `#ffffff` (Pure White) | `rgba(15, 23, 42, 0.88)` | Dashboard cards, tables, modals, input backgrounds |
| `--text` | `#0f172a` (Slate 900) | `#f8fafc` / `#ffffff` | Primary headings, table text, numbers |
| `--text-muted` | `#64748b` (Slate 500) | `#94a3b8` / `#cbd5e1` | Subtitles, date stamps, table headers, descriptions |
| `--border` | `rgba(0, 0, 0, 0.07)` (`#e5e7eb`) | `rgba(255, 255, 255, 0.12)` | Card perimeter borders, table row dividers |
| `--shadow-card` | `0 1px 3px rgba(0,0,0,0.04), 0 8px 20px -4px rgba(0,0,0,0.03)` | `0 10px 30px rgba(0, 0, 0, 0.45)` | Elevation depth |

---

## 2. Header, Banners & Topbar Containers

| Element / Class | Property | Light Mode Color | Dark Mode Color | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Executive Header Card** (`.portal-header-card`) | Background | `#0b1320` (`--navy`) | `#0b1320` (`--navy`) | Retains executive dark navy in both modes |
| | Border | `1px solid rgba(255, 255, 255, 0.08)` | `1px solid rgba(255, 255, 255, 0.08)` | Subtle white border |
| | Title (`.ann-title`) | `#ffffff` | `#ffffff` | Font: Playfair Display / Bold |
| | Subtitle (`.ann-sub`) | `rgba(255, 255, 255, 0.78)` | `rgba(255, 255, 255, 0.78)` | High legibility muted text |
| | Logo Box | `rgba(255, 255, 255, 0.08)` | `rgba(255, 255, 255, 0.08)` | Border: `rgba(255, 255, 255, 0.22)` |
| | Date Text | `#94a3b8` | `#94a3b8` | Monospace/sans date |
| | Menu Button (`.header-menu-btn`) | `rgba(255, 255, 255, 0.08)` | `rgba(255, 255, 255, 0.08)` | Hover: `rgba(59, 130, 246, 0.3)` + `#60a5fa` |
| | Status Badge (`.ann-badge`) | Bg: `rgba(202, 138, 4, 0.2)`<br>Text: `#fde047` | Bg: `rgba(202, 138, 4, 0.2)`<br>Text: `#fde047` | Gold status badge, border: `rgba(202, 138, 4, 0.4)` |
| **Sticky Topbar** (`.topbar`) | Background | `#ffffff` | `rgba(15, 23, 42, 0.85)` (25px blur) | Sticks to top on scroll |
| | Border Bottom | `1px solid rgba(0, 0, 0, 0.07)` | `1px solid rgba(255, 255, 255, 0.08)` | Divider |
| | Page Title (`.page-title`) | `#0f172a` | `#ffffff` | Serif brand font |
| | Topbar Date | `#64748b` | `#94a3b8` | Muted time stamp |
| | Topbar Action (`.topbar-btn.primary`) | Bg: `#2563eb`<br>Text: `#ffffff` | Bg: `#38bdf8`<br>Text: `#0b1320` | Action button |

---

## 3. Sidebar Drawer & Navigation

| Component | Property | Color Specification | Hover / Active State |
| :--- | :--- | :--- | :--- |
| **Sidebar Container** (`.sidebar`) | Background | `rgba(10, 16, 27, 0.96)` with 25px blur | Border-left: `1px solid rgba(255, 255, 255, 0.1)` |
| **Section Labels** (`.nav-section`) | Text | `rgba(255, 255, 255, 0.30)` | Uppercase tracking |
| **Nav Item** (`.nav-item`) | Text | `rgba(243, 244, 246, 0.70)` | Hover: `#ffffff` on `rgba(255, 255, 255, 0.05)` |
| **Nav Item (Active)** (`.nav-item.active`) | Background / Text | Background: `rgba(59, 130, 246, 0.20)`<br>Text: `#ffffff` | Left Border: `3px solid #2563eb` (or `#38bdf8`) |
| **Nav Counter Badge** (`.nav-badge`) | Fill / Text | Background: `#2563eb`<br>Text: `#ffffff` | Pill badge for counts |
| **User Profile Footer** (`.sidebar-user`) | Divider / Text | Top Border: `1px solid rgba(255, 255, 255, 0.1)` | Name: `#ffffff`, Role: `rgba(255, 255, 255, 0.4)` |
| **User Avatar** (`.user-avatar`) | Fill / Text | Background: `#2563eb`<br>Text: `#0b1320` | Circle initial container |

---

## 4. Layout Grids & Structural Containers

| Grid Class | Structure / Gap | Purpose |
| :--- | :--- | :--- |
| `.grid-2` | 2 columns (`1fr 1fr`), `gap: 24px` | Comparative cards, side-by-side charts, two-column dashboards |
| `.grid-3` | 3 columns (`1fr 1fr 1fr`), `gap: 24px` | Breakdown blocks, multi-metric widgets |
| `.stats-grid` | Responsive auto-fit (`minmax(180px, 1fr)`), `gap: 16px` | Top-row KPI summary cards |
| `.form-grid` | 2 columns (`1fr 1fr`), `gap: 12px` | Modal and settings input forms |
| `.leader-grid-modern` | Dynamic responsive auto-fill, `gap: 18px` | G12, Cell, and Department leader profile cards |
| `.attendance-grid` | 7 columns (`repeat(7, 1fr)`), `gap: 4px` | GitHub-style monthly attendance frequency heatmap |

---

## 5. Cards, KPI Stats & Live Ticker

| Card Type | Element | Light Mode Color | Dark Mode Color |
| :--- | :--- | :--- | :--- |
| **Standard Card** (`.card`, `.leader-card-modern`) | Background | `#ffffff` | `rgba(15, 23, 42, 0.88)` |
| | Border | `1px solid rgba(0, 0, 0, 0.07)` | `1px solid rgba(255, 255, 255, 0.12)` |
| | Title (`.card-title`) | `#0f172a` | `#ffffff` |
| | Shadow | `0 1px 3px rgba(0,0,0,0.04)` | `0 10px 30px rgba(0, 0, 0, 0.45)` |
| **Stat Card** (`.stat-card`) | Background | `#ffffff` | `rgba(15, 23, 42, 0.88)` |
| | Big Number (`.stat-num`) | `#0f172a` | `#ffffff` |
| | Metric Label (`.stat-label`) | `#64748b` | `#cbd5e1` |
| | Trend Up (`.stat-change.up`) | `#16a34a` (Green) | `#22c55e` (Light Emerald) |
| | Trend Down (`.stat-change.down`) | `#e11d48` (Rose Red) | `#f87171` (Light Coral) |
| **Stat Card Icons** (`.stat-icon`) | Blue / Primary | Bg: `#e0f2fe`<br>Icon: `#0284c7` | Bg: `rgba(56, 189, 248, 0.20)`<br>Icon: `#38bdf8` |
| | Green / Growth | Bg: `#dcfce7`<br>Icon: `#166534` | Bg: `rgba(52, 211, 153, 0.20)`<br>Icon: `#6ee7b7` |
| | Red / Alert | Bg: `#fee2e2`<br>Icon: `#991b1b` | Bg: `rgba(248, 113, 113, 0.20)`<br>Icon: `#fca5a5` |
| | Orange / Pending | Bg: `#ffedd5`<br>Icon: `#c2410c` | Bg: `rgba(251, 146, 60, 0.20)`<br>Icon: `#fb923c` |
| | Purple / Ministry | Bg: `#f3e8ff`<br>Icon: `#7e22ce` | Bg: `rgba(168, 85, 247, 0.20)`<br>Icon: `#c084fc` |
| **Unit Department Card** (`.unit-card`) | Background | `rgba(255, 255, 255, 0.94)` | `rgba(15, 23, 42, 0.88)` |
| | Unit Bar Track | `#f8fafc` | `rgba(255, 255, 255, 0.08)` |
| **Live Ticker Container** (`.dash-ticker-wrap`) | Background | `#ffffff` | `rgba(15, 23, 42, 0.92)` |
| | Ticker Label | `#2563eb` | `#38bdf8` |
| | Today Birthday Pill | Bg: `rgba(245, 158, 11, 0.18)`<br>Border: `rgba(245, 158, 11, 0.45)`<br>Text: `#000000` | Bg: `rgba(245, 158, 11, 0.25)`<br>Border: `#f59e0b`<br>Text: `#fde047` |
| | Upcoming Birthday Pill | Bg: `rgba(59, 130, 246, 0.14)`<br>Border: `rgba(59, 130, 246, 0.35)`<br>Text: `#000000` | Bg: `rgba(59, 130, 246, 0.25)`<br>Border: `#60a5fa`<br>Text: `#93c5fd` |

---

## 6. Data Tables (`table`, `.table-wrap`)

| Table Component | Light Mode Color | Dark Mode Color | Details |
| :--- | :--- | :--- | :--- |
| **Table Container** (`.table-wrap`) | Background: `#ffffff`<br>Border: `1px solid rgba(0, 0, 0, 0.07)` | Background: `rgba(17, 24, 39, 0.60)`<br>Border: `1px solid rgba(255, 255, 255, 0.08)` | Rounded container (`border-radius: 16px`) |
| **Header Row** (`th`) | Background: `#f8fafc`<br>Text: `#0b1320` (`--navy`) / `#374151`<br>Border Bottom: `1px solid #e5e7eb` | Background: `rgba(15, 23, 42, 0.92)`<br>Text: `#38bdf8` (Sky Blue accent)<br>Border Bottom: `1px solid rgba(255, 255, 255, 0.12)` | Uppercase, 11.5px, letter-spacing 0.05em |
| **Data Cells** (`td`) | Text: `#0f172a`<br>Border Bottom: `1px solid rgba(0, 0, 0, 0.07)` | Text: `#e2e8f0`<br>Border Bottom: `1px solid rgba(255, 255, 255, 0.05)` | Regular row content |
| **Row Hover** (`tr:hover td`) | Background: `rgba(59, 130, 246, 0.04)` | Background: `rgba(56, 189, 248, 0.08)` | Subtle interaction row highlight |

---

## 7. Status Badges, Heatmap & Timeline

| Component / Badge Variant | Background Fill | Border | Text Color |
| :--- | :--- | :--- | :--- |
| **Active / Verified** (`.badge-green`) | `rgba(52, 211, 153, 0.18)` | `1px solid rgba(52, 211, 153, 0.35)` | `#34d399` (or `#166534` light) |
| **Pending / Warning** (`.badge-amber`) | `rgba(251, 146, 60, 0.18)` | `1px solid rgba(251, 146, 60, 0.35)` | `#fb923c` |
| **Primary / Category** (`.badge-blue`) | `#e0f2fe` (Light) / `rgba(56, 189, 248, 0.18)` (Dark) | `1px solid #bae6fd` (Light) / `rgba(56, 189, 248, 0.35)` | `#0284c7` (Light) / `#38bdf8` (Dark) |
| **Alert / Inactive** (`.badge-red`) | `rgba(248, 113, 113, 0.18)` | `1px solid rgba(248, 113, 113, 0.35)` | `#f87171` |
| **Neutral / Tag** (`.badge-gray`, `.tag`) | `rgba(255, 255, 255, 0.10)` / `#f8fafc` | `1px solid rgba(255, 255, 255, 0.20)` / `#e5e7eb` | `#cbd5e1` / `#64748b` |
| **Heatmap High** (`.att-cell.high`) | `#3B6D11` (Deep Forest Green) | None | `#ffffff` |
| **Heatmap Mid** (`.att-cell.mid`) | `#97C459` (Leaf Olive) | None | `#27500A` |
| **Heatmap Low** (`.att-cell.low`) | `#eaf3de` (Soft Mint Tint) | None | `#3B6D11` |
| **Heatmap Inactive** (`.att-cell.none`) | `#f8fafc` | `0.5px solid rgba(0, 0, 0, 0.07)` | `#94a3b8` |
| **Timeline Dot (Primary)** | `var(--blue-soft)` (`rgba(37, 99, 235, 0.12)`) | None | `var(--blue)` (`#2563eb`) |
| **Timeline Dot (Navy)** | `var(--navy-soft)` | None | `var(--navy)` (`#0b1320`) |
| **Timeline Dot (Green)** | `#eaf3de` | None | `#3B6D11` |

---

## 8. Forms, Buttons, Modals & Dropdowns

| Element | Light Mode | Dark Mode |
| :--- | :--- | :--- |
| **Inputs, Selects & Textareas** | Background: `#ffffff`<br>Border: `1px solid #d1d5db`<br>Text: `#1f2937`<br>Focus: Border `#2563eb`, Glow `rgba(37, 99, 235, 0.12)` | Background: `rgba(15, 23, 42, 0.50)`<br>Border: `1px solid rgba(255, 255, 255, 0.08)`<br>Text: `#ffffff`<br>Focus: Border `#38bdf8`, Glow `rgba(56, 189, 248, 0.20)` |
| **Search Bar Wrap** (`.search-wrap`) | Background: `rgba(255, 255, 255, 0.92)`<br>Border: `0.5px solid rgba(0,0,0,0.07)`<br>Icon: `#64748b` | Background: `rgba(15, 23, 42, 0.50)`<br>Border: `1px solid rgba(255, 255, 255, 0.08)`<br>Icon: `#94a3b8` |
| **Primary Button** (`.btn-primary`, `.btn-blue`) | Background: `#2563eb` -> Hover: `#1d4ed8`<br>Text: `#ffffff` | Background: `#38bdf8` -> Hover: `#0284c7`<br>Text: `#0b1320` or `#ffffff` |
| **Outline Button** (`.btn-outline`) | Background: `transparent`<br>Border: `1px solid var(--border)`<br>Hover: `rgba(15, 23, 42, 0.05)` | Background: `transparent`<br>Border: `1px solid rgba(255, 255, 255, 0.12)`<br>Hover: `rgba(255, 255, 255, 0.08)` |
| **Danger Button** (`.btn-danger`) | Background: `#FCEBEB`, Text: `#A32D2D`, Border: `#F7C1C1` | Background: `rgba(239, 68, 68, 0.20)`, Text: `#fca5a5`, Border: `rgba(239, 68, 68, 0.40)` |
| **Modal Container** (`.modal`) | Background: `#ffffff`<br>Border: `1px solid rgba(0, 0, 0, 0.08)`<br>Shadow: `0 20px 60px rgba(0, 0, 0, 0.20)` | Background: `rgba(15, 23, 42, 0.95)`<br>Border: `1px solid rgba(255, 255, 255, 0.10)`<br>Shadow: `0 20px 50px rgba(0, 0, 0, 0.50)` |
| **Modal Backdrop** (`.modal-backdrop`) | Gradient: `linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.96) 100%)` | Gradient: `linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.96) 100%)` |
| **Dropdown Menu** (`.dropdown-menu`) | Background: `#ffffff`<br>Border: `1px solid #e5e7eb`<br>Item Hover: `rgba(59, 130, 246, 0.08)` + `#2563eb` | Background: `rgba(15, 23, 42, 0.95)`<br>Border: `1px solid rgba(255, 255, 255, 0.08)`<br>Item Hover: `rgba(56, 189, 248, 0.15)` + `#38bdf8` |

---

## 9. Glassmorphic Login Screen Container

* **Backdrop**: `FYF.jpg` with `rgba(13, 27, 42, 0.25)` tint and `6px blur`.
* **Login Panel (`.login-card-glass`)**: Background `rgba(255, 255, 255, 0.28)`, `backdrop-filter: blur(25px) saturate(140%)`, border `1.5px solid rgba(255, 255, 255, 0.35)`.
* **Input Fields (`.login-input-field`)**: Background `rgba(255, 255, 255, 0.20)`, border `1px solid rgba(255, 255, 255, 0.35)`, text `#ffffff`.
* **Social Follow Badges**:
  * Instagram: Radial gradient (`#fdf497` to `#d6249f` to `#285AEB`)
  * WhatsApp: `#25D366`
  * YouTube: `#FF0000`
  * Telegram: `#0088cc`
