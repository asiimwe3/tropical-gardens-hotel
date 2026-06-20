// supabase-config.js
// Public (anon) Supabase keys are safe to expose in frontend code but NEVER commit service role or secret keys.
// If you want to override these at deploy time, set window.TGH_SUPABASE_URL and window.TGH_SUPABASE_ANON_KEY before this script runs.

window.TGH_SUPABASE_URL = window.TGH_SUPABASE_URL || "https://eiyexnuhqdscomilwpqg.supabase.co";
window.TGH_SUPABASE_ANON_KEY = window.TGH_SUPABASE_ANON_KEY || "sb_publishable_S1u_aPqq2USyJcKpeisOlQ_TMzbHxtX";

/*
  Security note:
  - The ANON key above is a publishable key used only for client-side reads/writes according to Row Level Security (RLS).
  - DO NOT place Supabase service-role keys or any secret (PESAPAL keys, DB passwords, JWT secrets) in frontend files.
  - Rotate keys immediately if you accidentally commit service-role or secret keys.
*/
