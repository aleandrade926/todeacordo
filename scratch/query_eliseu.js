import { createClient } from "@supabase/supabase-js";

// Vercel production Supabase values or whatever is in .env. Let's see if there are other env files.
const SUPABASE_URL = "https://mqncmwtgpoflbbscrelp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbmNtd3RncG9mbGJic2NyZWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2Mjk3ODUsImV4cCI6MjA5MDIwNTc4NX0.veEeqzcSk2FTx8sYI1i9MKRbuzXhpfgk9XG-zJzXA7g";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  const { data: sessionData, error: sessionErr } = await supabase.auth.signInWithPassword({
    email: "alexandre.florio@hotmail.com",
    password: "Password123!" // Let's try signing in with a standard password or checking if we can query as authenticated
  });

  if (sessionErr) {
    console.error("Auth signin failed:", sessionErr);
  } else {
    console.log("Logged In as Florio! Session User:", sessionData?.user?.id);
    const { data: leads, error: leadsErr } = await supabase
      .from("taxmanagers_leads")
      .select("id, nome, empresa, parceiro_id");
    console.log("Leads list (auth):", { leads, leadsErr });
  }
}

test();
