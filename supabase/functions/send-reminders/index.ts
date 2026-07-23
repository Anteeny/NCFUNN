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
      return dateStr.split('T')[0];
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

    // 4. Fetch all expected leaders from members table
    const { data: membersData, error: membersError } = await supabase
      .from('members')
      .select('g12_leader, leader_type, g12_phone');
    if (membersError) throw membersError;
    const members = membersData || [];

    const expectedG12 = new Set<string>();
    const expectedDH = new Set<string>();
    const leaderPhones: Record<string, string> = {};

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
        }
      }
    });

    // Compute missing leaders
    const missingG12 = [...expectedG12]
      .filter(l => !foldersSubmittedSet.has(l.toLowerCase().trim()))
      .map(name => ({ name, type: 'G12', phone: leaderPhones[name.toLowerCase().trim()] || "" }));

    const missingDH = [...expectedDH]
      .filter(l => !foldersSubmittedSet.has(l.toLowerCase().trim()))
      .map(name => ({ name, type: 'DH', phone: leaderPhones[name.toLowerCase().trim()] || "" }));

    const missingLeaders = [...missingG12, ...missingDH];

    // If no one is missing, stop!
    if (missingLeaders.length === 0) {
      return new Response(
        JSON.stringify({ message: "All expected reports submitted! No reminders sent." }),
        { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // 5. Send WhatsApp messages to each missing leader if credentials are set
    if (!metaToken || !phoneNumberId) {
      return new Response(
        JSON.stringify({
          message: `Calculated missing reports for ${missingLeaders.length} leaders. To send DMs, please configure META_ACCESS_TOKEN and META_PHONE_NUMBER_ID in Supabase.`,
          missingLeaders
        }),
        { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    const sendPromises = missingLeaders
      .filter(leader => leader.phone && leader.phone.trim() !== '')
      .map(async (leader) => {
        const cleanPhone = leader.phone.replace(/[^0-9]/g, '');
        // Meta WhatsApp API Payload
        const messagePayload = {
          messaging_product: "whatsapp",
          to: cleanPhone,
          type: "template",
          template: {
            name: templateName,
            language: { code: "en" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: leader.name },      // {{1}} Leader name
                  { type: "text", text: leader.type }       // {{2}} G12 / DH
                ]
              }
            ]
          }
        };

        const metaResponse = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${metaToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(messagePayload)
        });

        return { leader: leader.name, response: await metaResponse.json() };
      });

    const results = await Promise.all(sendPromises);

    return new Response(
      JSON.stringify({
        message: `Reminders sent to ${results.length} leaders.`,
        details: results
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