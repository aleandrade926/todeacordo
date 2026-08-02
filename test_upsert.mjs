import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpsert() {
  const testId = "test_" + Date.now();
  console.log("Testing upsert with anon key...");
  
  const { data, error } = await supabase
    .from('consensus')
    .upsert({
      id: testId,
      meeting_id: testId,
      data: { test: true },
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error("UPSERT ERROR:", error);
  } else {
    console.log("UPSERT SUCCESS:", data);
  }
}

testUpsert();
