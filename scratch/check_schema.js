const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Since it's in a Vite/Next project, env vars might be in .env or .env.local
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("No env vars found directly.");
  // Let's read .env files
  const fs = require('fs');
  const envFiles = ['.env', '.env.local', '.env.development'];
  let found = false;
  for (const file of envFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8');
      console.log(`Found file ${file}:`);
      console.log(content.substring(0, 300));
    }
  }
}
