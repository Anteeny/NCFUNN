import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Handle CORS preflight request
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
    // 1. Get environment variables
    const metaToken = Deno.env.get('META_ACCESS_TOKEN');
    const phoneNumberId = Deno.env.get('META_PHONE_NUMBER_ID');
    const templateName = Deno.env.get('META_TEMPLATE_NAME') ?? 'ncf_report_reminder';
    const portalUrl = Deno.env.get('NCF_PORTAL_URL') ?? 'http://localhost:8000';

    // Supabase variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // 2. Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Fetch G12 reports
    const { data: g12Reports, error: g12Error } = await supabase
      .from('g12_reports')
      .select('*');
    if (g12Error) throw g12Error;
    const reports = g12Reports || [];

    // Helper functions
    const getServiceDate = (dateStr: string) => {
      if (!dateStr) return 'Unknown Date';
      let y: number | undefined, m: number | undefined, d: number | undefined;
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) {
        y = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10) - 1;
        d = parseInt(parts[2], 10);
      }
      let dt: Date;
      if (y !== undefined && !isNaN(y)) {
        dt = new Date(y, m!, d!);
      } else {
        dt = new Date(dateStr);
      }
      if (isNaN(dt.getTime())) return 'Unknown Date';
      const dayOfWeek = dt.getDay();
      const target = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
      if (dayOfWeek === 0 || dayOfWeek === 1 || dayOfWeek === 2) {
        target.setDate(target.getDate() - dayOfWeek);
      } else {
        target.setDate(target.getDate() - (dayOfWeek - 3));
      }
      const yr = target.getFullYear();
      const mo = String(target.getMonth() + 1).padStart(2, '0');
      const da = String(target.getDate()).padStart(2, '0');
      return `${yr}-${mo}-${da}`;
    };

    const normalizeLeaderName = (name: string) => {
      if (!name) return '';
      const clean = name.replace(/^(Pastor|Bro|Sis|Deacon|Minister|Pst|Brother|Sister)\.?\s+/i, '');
      return clean.replace(/\s+/g, ' ').trim();
    };

    // Find the latest service date window
    const allServiceDates = reports
      .map(r => getServiceDate(r.report_date || r.meeting_date))
      .filter(d => d !== 'Unknown Date');

    if (allServiceDates.length === 0) {
      return new Response(
        JSON.stringify({ message: "No services logged yet. No reminders sent." }),
        { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    allServiceDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const targetServiceDate = allServiceDates[0];

    // Collect the unique leader folder names submitted on this date
    const foldersSubmittedSet = new Set<string>();
    reports.forEach(r => {
      const sDate = getServiceDate(r.report_date || r.meeting_date);
      if (sDate === targetServiceDate && r.leader_name) {
        foldersSubmittedSet.add(normalizeLeaderName(r.leader_name).toLowerCase().trim());
      }
    });

    // 4. Fetch all expected leaders from members table including email and phone
    const { data: membersData, error: membersError } = await supabase
      .from('members')
      .select('g12_leader, leader_type, g12_phone, email, member_name');
    if (membersError) throw membersError;
    const members = membersData || [];

    const expectedG12 = new Set<string>();
    const expectedDH = new Set<string>();
    const leaderPhones: Record<string, string> = {};
    const leaderEmails: Record<string, string> = {};

    members.forEach(m => {
      if (m.g12_leader) {
        const canonical = normalizeLeaderName(m.g12_leader);
        if (canonical && canonical.toLowerCase() !== 'unassigned') {
          const type = m.leader_type || 'G12';
          if (type === 'G12') expectedG12.add(canonical);
          else if (type === 'DH') expectedDH.add(canonical);

          if (m.g12_phone && m.g12_phone.trim() !== '') {
            leaderPhones[canonical.toLowerCase().trim()] = m.g12_phone.trim();
          }
          if (m.email && m.email.trim() !== '') {
            leaderEmails[canonical.toLowerCase().trim()] = m.email.trim();
          }
        }
      }
    });

    // Compute missing leaders with their email and phone numbers
    const missingLeaders: Array<{ name: string; type: string; phone: string; email: string }> = [];

    expectedG12.forEach(name => {
      if (!foldersSubmittedSet.has(name.toLowerCase().trim())) {
        missingLeaders.push({
          name,
          type: 'G12',
          phone: leaderPhones[name.toLowerCase().trim()] || "",
          email: leaderEmails[name.toLowerCase().trim()] || ""
        });
      }
    });

    expectedDH.forEach(name => {
      if (!foldersSubmittedSet.has(name.toLowerCase().trim())) {
        missingLeaders.push({
          name,
          type: 'DH',
          phone: leaderPhones[name.toLowerCase().trim()] || "",
          email: leaderEmails[name.toLowerCase().trim()] || ""
        });
      }
    });

    // If no one is missing, stop silently!
    if (missingLeaders.length === 0) {
      return new Response(
        JSON.stringify({ message: "All expected reports submitted! No reminders sent." }),
        { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const senderEmail = Deno.env.get('SENDER_EMAIL') || 'onboarding@resend.dev';
    let emailsSentCount = 0;

    // Send targeted email notifications to each missing leader's email address
    if (resendApiKey) {
      for (const leader of missingLeaders) {
        if (leader.email) {
          try {
            const resendResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: `NCF Attendance <${senderEmail}>`,
                to: [leader.email],
                subject: `⚠️ Reminder: NCF ${leader.type} Report Pending (${targetServiceDate})`,
                html: `
                  <div style="font-family: Arial, sans-serif; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 12px;">
                    <h2 style="color: #f59e0b; margin-top: 0;">Hi ${leader.name},</h2>
                    <p style="font-size: 15px; line-height: 1.6;">This is an automated reminder that your <strong>NCF ${leader.type} Folder Report</strong> for today's service (<strong>${targetServiceDate}</strong>) has not been submitted yet.</p>
                    <p style="font-size: 14px; color: #94a3b8;">Please click below to access the portal and complete your report submission.</p>
                    <div style="margin: 24px 0;">
                      <a href="${portalUrl}" style="background: #f59e0b; color: #0f172a; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Fill Out Report Now →</a>
                    </div>
                    <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 30px;">
                    <p style="font-size: 11px; color: #64748b;">NCF UNN Discipleship & Attendance Tracker</p>
                  </div>
                `
              })
            });
            if (resendResponse.ok) emailsSentCount++;
          } catch (e) {
            console.error(`Failed to send email to ${leader.email}:`, e);
          }
        }
      }
    }

    // Helper: E.164 International Phone Normalizer
    const formatWhatsAppPhone = (phone: string): string => {
      if (!phone) return '';
      let clean = phone.replace(/[^0-9]/g, '');
      if (clean.startsWith('0') && clean.length === 11) {
        clean = '234' + clean.slice(1);
      } else if (clean.length === 10 && !clean.startsWith('234')) {
        clean = '234' + clean;
      }
      return clean;
    };

    let whatsappSentCount = 0;
    if (metaToken && phoneNumberId) {
      const sendPromises = missingLeaders
        .map(leader => ({ ...leader, formattedPhone: formatWhatsAppPhone(leader.phone) }))
        .filter(leader => leader.formattedPhone && leader.formattedPhone.length >= 10)
        .map(async (leader) => {
          const cleanPhone = leader.formattedPhone;

          let messagePayload: any = {
            messaging_product: "whatsapp",
            to: cleanPhone
          };

          if (templateName === 'text' || templateName === 'direct') {
            messagePayload.type = "text";
            messagePayload.text = {
              body: `Hi ${leader.name}, this is a friendly reminder to please submit your NCF ${leader.type} folder report for today's service. Thank you!`
            };
          } else {
            messagePayload.type = "template";
            messagePayload.template = {
              name: templateName,
              language: { code: "en" }
            };
            if (templateName !== 'hello_world') {
              messagePayload.template.components = [
                {
                  type: "body",
                  parameters: [
                    { type: "text", text: leader.name },
                    { type: "text", text: leader.type }
                  ]
                }
              ];
            }
          }

          const metaResponse = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${metaToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(messagePayload)
          });

          return metaResponse.ok;
        });

      const results = await Promise.all(sendPromises);
      whatsappSentCount = results.filter(Boolean).length;
    }

    // --- OneSignal Push Notifications ---
    let pushSentCount = 0;
    const onesignalApiKey = Deno.env.get("ONESIGNAL_API_KEY") || "";
    const onesignalAppId = Deno.env.get("ONESIGNAL_APP_ID") || "031e7145-9dec-47e3-9020-9ccd9658bdaa";

    if (missingLeaders.length > 0) {
      // Target leaders by their canonical name (External ID)
      const externalIds = missingLeaders.map(l => l.name.toLowerCase().trim());
      externalIds.push("tubagu6@gmail.com"); // TEST EMAIL target

      try {
        const osResponse = await fetch("https://onesignal.com/api/v1/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${onesignalApiKey}`
          },
          body: JSON.stringify({
            app_id: onesignalAppId,
            include_external_user_ids: externalIds,
            headings: { "en": "⚠️ NCF Report Reminder" },
            contents: { "en": `hi, click now to fill your report 📝. forms close by midnight ⏰` },
            url: portalUrl
          })
        });
        if (osResponse.ok) {
          pushSentCount = externalIds.length;
        } else {
          console.error("OneSignal push error:", await osResponse.text());
        }
      } catch (e) {
        console.error("Failed to send OneSignal push:", e);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Calculated missing reports for ${missingLeaders.length} leader(s).`,
        missingLeaders,
        emailsSent: emailsSentCount,
        whatsappSent: whatsappSentCount,
        pushSent: pushSentCount
      }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, status: 500 }
    );
  }
})