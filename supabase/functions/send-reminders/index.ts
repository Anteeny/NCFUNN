import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // 1. Get environment variables
    const metaToken = Deno.env.get('META_ACCESS_TOKEN')
    const phoneNumberId = Deno.env.get('META_PHONE_NUMBER_ID')
    const templateName = Deno.env.get('META_TEMPLATE_NAME') ?? 'ncf_report_reminder'
    const portalUrl = Deno.env.get('NCF_PORTAL_URL')

    // Supabase variables (automatically provided by the Edge Function environment)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    // 2. Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 3. Fetch leaders who haven't submitted their report
    // (Assuming you have a 'leaders' table with a 'has_submitted' column)
    const { data: missingLeaders, error: dbError } = await supabase
      .from('leaders')
      .select('*')
      .eq('has_submitted', false)

    if (dbError) throw dbError

    // If no one is missing, we can stop here!
    if (!missingLeaders || missingLeaders.length === 0) {
      return new Response(
        JSON.stringify({ message: "All reports submitted! No reminders sent." }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    // 4. Send WhatsApp messages to each missing leader
    const sendPromises = missingLeaders.map(async (leader) => {
      // Create the custom pre-filled link for this specific leader
      const formLink = `${portalUrl}/Ncfreport/${leader.category}report.html?leader=${encodeURIComponent(leader.name)}`

      // Meta WhatsApp API Payload
      const messagePayload = {
        messaging_product: "whatsapp",
        to: leader.phone, // Ensure your DB stores phone numbers with the country code (e.g., 234...)
        type: "template",
        template: {
          name: templateName,
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: leader.name },      // {{1}}
                { type: "text", text: leader.category },  // {{2}}
                { type: "text", text: formLink }          // {{3}}
              ]
            }
          ]
        }
      }

      // Send the request to Meta
      const metaResponse = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messagePayload)
      })

      return metaResponse.json()
    })

    // Wait for all messages to finish sending
    const results = await Promise.all(sendPromises)

    // 5. Return a success response
    return new Response(
      JSON.stringify({
        message: `Reminders sent to ${missingLeaders.length} leaders.`,
        details: results
      }),
      { headers: { "Content-Type": "application/json" } }
    )

  } catch (error) {
    // Handle any errors that occur
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    )
  }
})