import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Helper: E.164 Nigerian Phone Normalizer for WhatsApp
function formatWhatsAppPhone(phone: string): string {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('0') && clean.length === 11) {
    clean = '234' + clean.slice(1);
  } else if (clean.length === 10 && !clean.startsWith('234')) {
    clean = '234' + clean;
  }
  if (!clean.endsWith('@s.whatsapp.net')) {
    clean += '@s.whatsapp.net';
  }
  return clean;
}

// Helper: Parse member birthday across various formats
function parseMemberBirthday(val: unknown): { month: number; day: number } | null {
  if (!val) return null;
  const str = String(val).trim();
  if (!str) return null;

  // Standard YYYY-MM-DD or MM/DD/YYYY
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return { month: d.getUTCMonth() + 1, day: d.getUTCDate() };
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?$/);
  if (dmMatch) {
    const day = parseInt(dmMatch[1], 10);
    const month = parseInt(dmMatch[2], 10);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return { month, day };
    }
  }

  // Text month e.g. "12th August", "August 12"
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const mIndex = months.findIndex(m => str.toLowerCase().includes(m));
  if (mIndex !== -1) {
    const dayMatch = str.match(/\d{1,2}/);
    if (dayMatch) {
      return { month: mIndex + 1, day: parseInt(dayMatch[0], 10) };
    }
  }

  return null;
}

// Helper: Normalize leader names to prevent casing/alias issues
function normalizeLeaderName(name: string): string {
  if (!name) return '';
  const clean = name.replace(/^(Pastor|Bro|Sis|Deacon|Minister|Pst|Brother|Sister)\.?\s+/i, '');
  return clean.replace(/\s+/g, ' ').trim();
}

// Helper: Send WhatsApp text message via Whapi.cloud
async function sendWhapiMessage(toJid: string, message: string, whapiApiKey: string): Promise<boolean> {
  if (!whapiApiKey || !toJid) return false;
  try {
    const response = await fetch("https://gate.whapi.cloud/messages/text", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${whapiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to: toJid,
        body: message
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error(`Whapi error sending to ${toJid}:`, errText);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Failed to dispatch Whapi message to ${toJid}:`, err);
    return false;
  }
}

serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
      }
    });
  }

  try {
    // 1. Environment & Config
    const whapiApiKey = Deno.env.get('WHAPI_API_KEY') || '';
    const adminPhone = Deno.env.get('ADMIN_PHONE') || '2348106939820';
    const portalBaseUrl = (Deno.env.get('NCF_PORTAL_URL') || 'https://reports.ncfunn.site').replace(/\/+$/, '');
    
    // Parse Trigger Parameters (Query Params or JSON Body)
    const url = new URL(req.url);
    let bodyParams: Record<string, any> = {};
    if (req.method === 'POST') {
      try {
        bodyParams = await req.json();
      } catch (_) {
        bodyParams = {};
      }
    }

    const makeWebhookUrl = bodyParams.makeWebhookUrl || url.searchParams.get('makeWebhookUrl') || Deno.env.get('MAKE_WEBHOOK_URL') || 'https://hook.eu1.make.com/ivxypx8qbm9udwb1f7kqq84rptyc7wfx';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://cjbedftdexzcsydwayig.supabase.co';
    const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmVkZnRkZXh6Y3N5ZHdheWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTUwMjgsImV4cCI6MjA5MzYzMTAyOH0.xsvtG5NmI_9TDZQ5-MhcjtX4UIIAiH2kyOlpIPDkCdg';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || defaultAnonKey;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const action = (bodyParams.action || url.searchParams.get('action') || 'reminders').toLowerCase();
    const force = bodyParams.force === true || url.searchParams.get('force') === 'true';
    const dryRun = bodyParams.dryRun === true || url.searchParams.get('dryRun') === 'true';

    // Current Time in West Africa Time (WAT: UTC+1)
    const nowUtc = new Date();
    const nowWat = new Date(nowUtc.getTime() + 1 * 60 * 60 * 1000);
    const dayOfWeek = nowWat.getUTCDay(); // 0 = Sunday, 3 = Wednesday
    const hourWat = nowWat.getUTCHours();
    const currentWatDateStr = nowWat.toISOString().split('T')[0];

    // =========================================================================
    // ACTION 1: DAILY BIRTHDAY ALERTS
    // =========================================================================
    if (action === 'birthdays') {
      const currentMonth = nowWat.getUTCMonth() + 1;
      const currentDay = nowWat.getUTCDate();

      // Fetch all members with birthdays and assigned G12 leaders
      const { data: members, error: mErr } = await supabase
        .from('members')
        .select('id, member_name, member_phone, birthday, g12_leader, g12_phone');

      if (mErr) {
        throw new Error("Members query error: " + mErr.message);
      }

      // Build leader phone directory for quick lookup
      const leaderPhoneMap = new Map<string, string>();
      members?.forEach(m => {
        if (m.member_name) {
          const canonical = normalizeLeaderName(m.member_name).toLowerCase();
          const phone = m.member_phone || m.phone || m.g12_phone;
          if (phone) leaderPhoneMap.set(canonical, phone);
        }
      });

      const celebrants: Array<{
        name: string;
        phone: string;
        g12Leader: string;
        g12LeaderPhone: string;
      }> = [];

      members?.forEach(m => {
        const rawBday = m.birthday || m.dob || m.date_of_birth;
        const parsed = parseMemberBirthday(rawBday);
        if (parsed && parsed.month === currentMonth && parsed.day === currentDay) {
          const celebrantPhone = m.member_phone || m.phone || '';
          const leaderName = m.g12_leader ? normalizeLeaderName(m.g12_leader) : '';
          const leaderPhone = m.g12_phone || leaderPhoneMap.get(leaderName.toLowerCase()) || '';

          celebrants.push({
            name: m.member_name || 'Member',
            phone: celebrantPhone,
            g12Leader: leaderName,
            g12LeaderPhone: leaderPhone
          });
        }
      });

      if (celebrants.length === 0) {
        return new Response(JSON.stringify({
          success: true,
          message: `No birthdays found for today (${currentMonth}/${currentDay}).`,
          celebrantsCount: 0
        }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      let alertsSent = 0;
      const adminJid = formatWhatsAppPhone(adminPhone);

      for (const c of celebrants) {
        // Message 1: Alert to Admin (08106939820)
        const adminMsg = `🎂 *Today's Birthday Alert!*\n\nToday is *${c.name}*'s birthday! 🎉\n📞 *Phone:* ${c.phone || 'N/A'}\n👥 *G12 Leader:* ${c.g12Leader || 'Unassigned'}\n\nReach out and celebrate them today! ✨`;

        if (!dryRun && adminJid) {
          const sent = await sendWhapiMessage(adminJid, adminMsg, whapiApiKey);
          if (sent) alertsSent++;
        }

        // Message 2: Alert to Celebrant's G12 Leader
        if (c.g12Leader && c.g12LeaderPhone) {
          const leaderJid = formatWhatsAppPhone(c.g12LeaderPhone);
          const leaderMsg = `🎂 *Birthday Alert in Your G12 Cell!*\n\nHi *${c.g12Leader}*, your member *${c.name}* is celebrating their birthday today! 🎉\n📞 *Phone:* ${c.phone || 'N/A'}\n\nKindly reach out to pray with and celebrate them today! 🙏✨`;

          if (!dryRun && leaderJid) {
            const sent = await sendWhapiMessage(leaderJid, leaderMsg, whapiApiKey);
            if (sent) alertsSent++;
          }
        }
      }

      return new Response(JSON.stringify({
        success: true,
        action: 'birthdays',
        date: `${currentMonth}/${currentDay}`,
        celebrantsCount: celebrants.length,
        celebrants,
        alertsDispatched: alertsSent,
        dryRun
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // =========================================================================
    // ACTION 2: SERVICE DAY REMINDERS (WEDNESDAYS & SUNDAYS)
    // =========================================================================
    // Check if today is a service day (Wednesday = 3, Sunday = 0)
    const isServiceDay = dayOfWeek === 0 || dayOfWeek === 3;
    if (!isServiceDay && !force) {
      return new Response(JSON.stringify({
        success: false,
        message: `Today is not a service day (Wednesdays & Sundays only). Current WAT Day: ${dayOfWeek}. Use ?force=true to override for testing.`
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Determine Run Mode: '7pm' (first call) or '11pm' (final urgent call)
    let mode = (bodyParams.mode || url.searchParams.get('mode') || '').toLowerCase();
    if (!mode) {
      // Auto-detect based on current WAT hour: if 21:00 or later -> 11pm final call
      mode = hourWat >= 21 ? '11pm' : '7pm';
    }

    const targetServiceDate = currentWatDateStr;

    // 1. Fetch submitted G12 Reports for today
    const { data: g12Submissions, error: g12Err } = await supabase
      .from('g12_reports')
      .select('leader_name, report_date');
    if (g12Err) {
      console.warn("Notice querying g12_reports:", g12Err.message);
    }

    const g12SubmittedSet = new Set<string>();
    g12Submissions?.forEach(r => {
      const d = (r.report_date || '').split('T')[0];
      if (d === targetServiceDate && r.leader_name) {
        g12SubmittedSet.add(normalizeLeaderName(r.leader_name).toLowerCase());
      }
    });

    // 2. Fetch submitted Departmental Reports for today
    const { data: deptSubmissions, error: deptErr } = await supabase
      .from('dept_reports')
      .select('dept_name, report_date');
    if (deptErr) {
      console.warn("Could not query dept_reports:", deptErr.message);
    }

    const deptSubmittedSet = new Set<string>();
    deptSubmissions?.forEach(r => {
      const d = (r.report_date || '').split('T')[0];
      if (d === targetServiceDate && r.dept_name) {
        deptSubmittedSet.add(r.dept_name.trim().toLowerCase());
      }
    });

    // 3. Fetch Expected G12 Leaders from members table
    const { data: membersData, error: membersError } = await supabase
      .from('members')
      .select('member_name, g12_leader, leader_type, g12_phone, member_phone, department');
    if (membersError) {
      throw new Error("Members query error: " + membersError.message);
    }

    const g12LeadersMap = new Map<string, string>(); // canonicalName -> phone
    const deptLeadersList: Array<{ name: string; dept: string; phone: string }> = [];

    membersData?.forEach(m => {
      if (m.g12_leader) {
        const canonical = normalizeLeaderName(m.g12_leader);
        if (canonical && canonical.toLowerCase() !== 'unassigned') {
          const phone = m.g12_phone || m.member_phone || '';
          if (phone && !g12LeadersMap.has(canonical)) {
            g12LeadersMap.set(canonical, phone);
          }
        }
      }
    });

    // Fetch Departmental Leaders from dedicated department_leaders table
    const { data: dbDeptLeaders, error: deptTableErr } = await supabase
      .from('department_leaders')
      .select('department_name, leader_name, phone');

    if (dbDeptLeaders && dbDeptLeaders.length > 0) {
      dbDeptLeaders.forEach(dl => {
        if (dl.department_name && dl.phone) {
          deptLeadersList.push({
            name: dl.leader_name || 'Department Leader',
            dept: dl.department_name,
            phone: dl.phone
          });
        }
      });
    } else {
      // Graceful fallback if table is newly created
      const fallbackDepts = [
        { name: "Emmanuella Okonkwo", dept: "Administration", phone: "07019319034" },
        { name: "Kosisochukwu Mbamalu", dept: "Ushering", phone: "08119513436" },
        { name: "Janefrancis Igwilo", dept: "MVP", phone: "07046716901" },
        { name: "Kosisochukwu Onyibor", dept: "NCF Angels", phone: "07072136541" },
        { name: "Ifeyinwa Umeadi", dept: "Temple tenders", phone: "09130530238" },
        { name: "Udochukwu Aneke", dept: "Technical Unit", phone: "08104697634" },
        { name: "Faithfulness Onu", dept: "Finances", phone: "08140286257" },
        { name: "Nelson Okeke", dept: "Media Unit", phone: "08124498675" },
        { name: "Godreigns Anyachebelu", dept: "Intercessory", phone: "09161975291" }
      ];
      fallbackDepts.forEach(fd => deptLeadersList.push(fd));
    }

    // 4. Identify Missing G12 Leaders
    const missingG12Leaders: Array<{ name: string; phone: string }> = [];
    for (const [leaderName, phone] of g12LeadersMap.entries()) {
      if (!g12SubmittedSet.has(leaderName.toLowerCase())) {
        missingG12Leaders.push({ name: leaderName, phone });
      }
    }

    // 5. Identify Missing Departmental Leaders
    const missingDeptLeaders: Array<{ name: string; dept: string; phone: string }> = [];
    deptLeadersList.forEach(dl => {
      if (!deptSubmittedSet.has(dl.dept.toLowerCase())) {
        missingDeptLeaders.push(dl);
      }
    });

    const g12PortalUrl = `${portalBaseUrl}/G12report.html`;
    const deptPortalUrl = `${portalBaseUrl}/Department.html`;

    let totalDispatched = 0;
    const dispatchedLogs: Array<{ recipient: string; phone: string; type: string }> = [];

    // Dispatch G12 Reminders
    for (const leader of missingG12Leaders) {
      if (!leader.phone) continue;
      const jid = formatWhatsAppPhone(leader.phone);

      const msg = mode === '11pm'
        ? `⚠️ *Urgent: NCF G12 Report Pending*\n\nHi *${leader.name}*,\n\nYour G12 report for today's service (${targetServiceDate}) has not been received yet. The reporting portal closes by midnight ⏰.\n\nPlease submit it now:\n👉 ${g12PortalUrl}\n\nThank you!`
        : `👋 Good evening, *${leader.name}*!\n\nFriendly reminder to submit your *NCF G12 Report* for today's service (${targetServiceDate}) 📝.\n\n🔗 *Report Portal:* ${g12PortalUrl}\n⏰ *Target:* Before 11:00 PM tonight\n\nThank you for your faithful leadership! 🙏`;

      if (!dryRun && jid) {
        const sent = await sendWhapiMessage(jid, msg, whapiApiKey);
        if (sent) totalDispatched++;
      }
      dispatchedLogs.push({ recipient: leader.name, phone: leader.phone, type: 'G12' });
    }

    // Dispatch Departmental Reminders
    for (const dLeader of missingDeptLeaders) {
      if (!dLeader.phone) continue;
      const jid = formatWhatsAppPhone(dLeader.phone);

      const msg = mode === '11pm'
        ? `⚠️ *Urgent: Departmental Report Pending*\n\nHi *${dLeader.name}*,\n\nThe *${dLeader.dept}* report for today's service (${targetServiceDate}) is still pending before midnight ⏰.\n\nPlease take a moment to submit it now:\n👉 ${deptPortalUrl}\n\nThank you!`
        : `👋 Good evening, *${dLeader.name}*!\n\nFriendly reminder to submit your *NCF Departmental Report* (${dLeader.dept}) for today's service (${targetServiceDate}) 📋.\n\n🔗 *Report Portal:* ${deptPortalUrl}\n⏰ *Target:* Before 11:00 PM tonight\n\nThank you for your diligent service! 🙏`;

      if (!dryRun && jid) {
        const sent = await sendWhapiMessage(jid, msg, whapiApiKey);
        if (sent) totalDispatched++;
      }
      dispatchedLogs.push({ recipient: `${dLeader.name} (${dLeader.dept})`, phone: dLeader.phone, type: 'Departmental' });
    }

    // Optional: Forward summary to Make.com Webhook if configured
    if (makeWebhookUrl && !dryRun) {
      try {
        await fetch(makeWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceDate: targetServiceDate,
            mode,
            missingG12Count: missingG12Leaders.length,
            missingDeptCount: missingDeptLeaders.length,
            missingG12Leaders,
            missingDeptLeaders
          })
        });
      } catch (makeErr) {
        console.warn("Make.com forward notice:", makeErr);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      action: 'reminders',
      mode,
      serviceDate: targetServiceDate,
      missingG12Count: missingG12Leaders.length,
      missingDeptCount: missingDeptLeaders.length,
      totalDispatched,
      dispatchedLogs,
      dryRun
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err: unknown) {
    const errorMsg = err instanceof Error 
      ? err.message 
      : (typeof err === 'object' && err !== null && 'message' in err)
        ? (err as any).message
        : JSON.stringify(err);
    console.error("send-reminders execution failed:", errorMsg);
    return new Response(JSON.stringify({ success: false, error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
});