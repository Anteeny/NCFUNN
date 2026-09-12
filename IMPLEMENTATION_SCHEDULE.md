# NCF UNN Automation: Implementation Schedule & Architecture

This document details the automated scheduling, execution times, routing logic, database cron jobs, and leader identification rules for the **NCF UNN Attendance Reminders & Birthday Alerts** pipeline using **Whapi.cloud**, **Make.com**, and **Supabase Edge Functions**.

---

## 📅 Master Automation Schedule Table

| Job Name | Frequency & Service Days | Trigger Time (WAT - UTC+1) | UTC Cron Time | Target Recipients | What It Does |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Service Day 7 PM Call** | **Wednesdays & Sundays** | **7:00 PM WAT** | `18:00 UTC` (`0 18 * * 0,3`) | Pending G12 & Department Leaders | Sends friendly first-call WhatsApp DM with report links (skips early submitters). |
| **2. Service Day 11 PM Final Call** | **Wednesdays & Sundays** | **11:00 PM WAT** | `22:00 UTC` (`0 22 * * 0,3`) | Leaders with unsubmitted reports | Sends urgent final-call WhatsApp DM alerting that portal closes at midnight. |
| **3. Daily Birthday Alerts** | **Every Day (Monday – Sunday)** | **8:00 AM WAT** | `07:00 UTC` (`0 7 * * *`) | Admin (`08106939820`) & Celebrant's G12 Leader | Scans `members` table for today's celebrants; dispatches celebration WhatsApp DMs. |

---

## 🔍 How Leaders Are Identified in the Database

### 1. G12 Leaders
* **Source Table:** `members` table in Supabase.
* **Leader Name Resolution:**
  * Every member has a **`g12_leader`** column (e.g. *"Tony Ubagu"*, *"Mmesoma Ozor"*).
  * The Edge Function pulls all distinct names from `g12_leader`, ignoring blank values and *"Unassigned"*.
  * **Title Normalization:** Common prefixes like *Pastor*, *Pst.*, *Bro.*, *Sis.*, and *Deacon* are automatically stripped so *"Bro Tony Ubagu"* and *"Tony Ubagu"* match the exact same person.
* **Phone Number Resolution:**
  * Retrieved from `g12_phone` on member rows or from the leader's own row in `members` (`member_phone`).
* **Missing Report Evaluation (Service Days):**
  * On Wednesdays & Sundays, queries the **`g12_reports`** table for `report_date = today`.
  * Any G12 leader who has **not submitted a report yet for today** is added to **`missingG12Leaders[]`**.

### 2. Departmental Leaders
* **Source Table:** `members` table in Supabase.
* **Department Head Resolution:**
  * Identified where **`leader_type = 'DH'`** (Departmental Head).
  * Their specific ministry unit is read from the **`department`** column (e.g. *Media Unit*, *NCF Angels*, *Ushers*, *Technical Unit*, *Administration*, *MVP*, *Intercessory*, *Greeters*, *Evangelism*, *Deep Oasis*, *Temple tenders*).
* **Phone Number Resolution:**
  * Read from `member_phone` on their member profile.
* **Missing Report Evaluation (Service Days):**
  * Queries the **`dept_reports`** table for `report_date = today`.
  * If a unit report has **not been submitted for that department today**, the leader is added to **`missingDeptLeaders[]`** to receive the link for `/Department.html`.

### 3. Daily Birthday Celebrants
* **Source Table:** `members` table in Supabase.
* **Matching Rule:** Compares today's month & day against the member's **`birthday`** field.
* **Leader Lookup:** Reads the celebrant's `g12_leader` to retrieve the leader's phone number.
* **Recipients:** Sends alert to **Admin (`08106939820`)** and a personalized alert to the celebrant's **assigned G12 Leader**.

---

## 🛠️ System Architecture & Data Flow

```
[Supabase pg_cron (Database)]
        │  (Triggers on schedule: Wed/Sun 7PM, 11PM, Daily 8AM)
        ▼
[Supabase Edge Function: send-reminders]
        │  (Queries g12_reports, dept_reports, members; normalizes phone numbers)
        ▼
[Make.com Scenario: NCF Attendance Alerts]
        │
     [Router]
        ├─── Branch 1 (G12):        Iterator (missingG12Leaders[])  ──► HTTP: Whapi (/G12report.html)
        ├─── Branch 2 (Department): Iterator (missingDeptLeaders[]) ──► HTTP: Whapi (/Department.html)
        └─── Branch 3 (Birthdays):  Iterator (celebrants[])         ──► HTTP 1: Admin Alert (08106939820)
                                                                    ──► HTTP 2: Leader Alert
```

---

## 💻 How to Activate the Schedules in Supabase

1. Open your **[Supabase Dashboard](https://supabase.com/dashboard/project/cjbedftdexzcsydwayig)**.
2. Go to **SQL Editor** (left menu) $\rightarrow$ click **New Query**.
3. Open or copy the script from [`supabase/cron_schedules.sql`](file:///c:/Users/USER/Desktop/ATTENDANCE%20TRACKER/supabase/cron_schedules.sql).
4. Click **Run**.
5. Once executed, verify your active cron jobs by running:
   ```sql
   SELECT jobid, schedule, active, jobname FROM cron.job;
   ```

---

## 🔗 Important Reference Links

* **Reporting Portal Base:** `https://reports.ncfunn.site`
* **G12 Report Submission:** `https://reports.ncfunn.site/G12report.html`
* **Department Report Submission:** `https://reports.ncfunn.site/Department.html`
* **Whapi API Endpoint:** `https://gate.whapi.cloud/messages/text`
* **Admin Phone:** `2348106939820` (Tony Ubagu)
