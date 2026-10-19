import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cjbedftdexzcsydwayig.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmVkZnRkZXh6Y3N5ZHdheWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTUwMjgsImV4cCI6MjA5MzYzMTAyOH0.xsvtG5NmI_9TDZQ5-MhcjtX4UIIAiH2kyOlpIPDkCdg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const payload = {
    member_id: "286",
    member_name: "Meniru Chioma",
    service_date: "2026-10-18",
    service_type: "Sunday Service",
    zone: "Hilltop",
    department: "Administration",
    checked_in_at: new Date().toISOString(),
    marked_by: "Gate Usher",
    notes: null,
  };

  console.log("Testing supabase.from('service_attendance').upsert...");
  const { data, error } = await supabase
    .from('service_attendance')
    .upsert(payload, { onConflict: 'member_id,service_date,service_type' })
    .select()
    .single();

  if (error) {
    console.error("UPSERT ERROR:", error);
  } else {
    console.log("UPSERT SUCCESS:", data);
  }
}

test();
