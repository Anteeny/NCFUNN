/**
 * Shared Supabase Client for NCF Report Portal
 * Single source of truth for database connectivity across all tabs.
 */
const SUPABASE_URL = "https://cjbedftdexzcsydwayig.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmVkZnRkZXh6Y3N5ZHdheWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTUwMjgsImV4cCI6MjA5MzYzMTAyOH0.xsvtG5NmI_9TDZQ5-MhcjtX4UIIAiH2kyOlpIPDkCdg";

// Initialize client if supabase-js library is loaded
if (typeof supabase !== 'undefined') {
  window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn("Supabase library not loaded yet. Will initialize when ready.");
}

function getSupabaseClient() {
  if (!window.supabaseClient && typeof supabase !== 'undefined') {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return window.supabaseClient;
}

window.getSupabaseClient = getSupabaseClient;
