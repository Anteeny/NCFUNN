# Automated WhatsApp Reminders - Deployment & Configuration Guide

This guide details the step-by-step instructions to deploy the `send-reminders` Supabase Edge Function and configure Meta's official WhatsApp Business Cloud API.

---

## 📋 Prerequisites

1. **Supabase CLI:** Installed on your local machine (if not installed, run `npm install -g supabase`).
2. **Meta Developer Account:** Sign up at [developers.facebook.com](https://developers.facebook.com).
3. **WhatsApp Business API Setup:**
   - Create a Business Meta App.
   - Go to **WhatsApp -> Quickstart** in the Meta app dashboard to set up a sender phone number.
   - Whitelist your test number (for development/testing) or register a production phone number.

---

## 🚀 Step 1: Deploy the Supabase Edge Function

Open your terminal in the root of your project directory (`c:/Users/USER/Desktop/ATTENDANCE TRACKER`) and run the following commands:

```bash
# 1. Login to your Supabase account
supabase login

# 2. Link your local project to your live Supabase project
# (Replace PROJECT_REFERENCE_ID with the ID from your Supabase URL dashboard)
supabase link --project-ref PROJECT_REFERENCE_ID

# 3. Deploy the Edge Function
supabase functions deploy send-reminders
```

---

## 🔒 Step 2: Configure Environment Secrets

Supabase Edge Functions securely retrieve API credentials from environment variables. Set them in your live project dashboard using the CLI:

```bash
supabase secrets set META_ACCESS_TOKEN="your_permanent_access_token_here" \
                     META_PHONE_NUMBER_ID="your_whatsapp_phone_number_id" \
                     META_TEMPLATE_NAME="ncf_report_reminder" \
                     NCF_PORTAL_URL="https://ncf-unn-attendance.netlify.app"
```

* **`META_ACCESS_TOKEN`:** The permanent access token generated under your Facebook Business Settings (System User token).
* **`META_PHONE_NUMBER_ID`:** Found in the Meta Developer Console under **WhatsApp -> API Setup**.
* **`META_TEMPLATE_NAME`:** The name of your approved message template (defaults to `ncf_report_reminder`).
* **`NCF_PORTAL_URL`:** The domain where your NCF portal website is hosted.

---

## 💬 Step 3: Set Up the Meta Message Template

In your **Meta App Dashboard**, go to **WhatsApp -> Message Templates** and create a template with the following properties:

* **Template Name:** `ncf_report_reminder` (or configure a custom name in `META_TEMPLATE_NAME`).
* **Category:** Utility
* **Language:** English (en)
* **Header:** None
* **Body:**
  ```text
  Hi {{1}}, friendly reminder to submit your NCF {{2}} report for the latest service! 📋 Submit here: {{3}}
  ```
  * *Parameters map as follows:*
    * `{{1}}` - Leader's Name (e.g., Ukamaka Augustine)
    * `{{2}}` - Leader's Category (e.g., G12 or DH)
    * `{{3}}` - Pre-filled Form Link (e.g., `https://domain.com/Ncfreport/G12report.html?leader=...&type=...`)
* **Buttons:** None

---

## ⏰ Step 4: Automate the Trigger (Scheduling)

To invoke the Edge Function automatically at **7:00 PM on Sundays and Wednesdays**, you have three options:

### Option A: pg_cron inside Supabase (Recommended - Built-in)
Enable DDL execution for `pg_cron` in your Supabase SQL editor and schedule the HTTP request:

```sql
-- 1. Enable pg_cron and pg_net extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Schedule the cron job to trigger your Edge Function
-- Replace PROJECT_REF with your real project reference ID
select cron.schedule(
  'whatsapp-reminders-job',
  '0 19 * * 0,3', -- 7:00 PM on Sundays (0) and Wednesdays (3)
  $$
  select net.http_post(
    url := 'https://PROJECT_REF.supabase.co/functions/v1/send-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_OR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

### Option B: External Cron Service (Free & Easy)
Use a free scheduler service like [cron-job.org](https://cron-job.org) or [Upstash QStash](https://upstash.com/docs/qstash/overall/compare):
1. Create a job scheduled for `0 19 * * 0,3` (UTC or your local timezone).
2. Configure it to make a **POST** request to:
   `https://PROJECT_REF.supabase.co/functions/v1/send-reminders`
3. Add the authorization header:
   - **Key:** `Authorization`
   - **Value:** `Bearer YOUR_ANON_KEY`

---

## 🧪 Testing the Setup

You can manually trigger the Edge Function at any time to verify its logic without waiting for the scheduled time:

```bash
curl -X POST https://PROJECT_REF.supabase.co/functions/v1/send-reminders \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

If the Meta credentials (`META_ACCESS_TOKEN` / `META_PHONE_NUMBER_ID`) are not yet configured in the secrets dashboard, the function will execute a **Dry Run**, returning the calculated list of missing leaders and confirming database reading works!
