import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Inserting test consensus...');
  const { data, error } = await supabase
    .from('consensus')
    .upsert({
      id: 'test-id-123',
      meeting_id: 'test-meeting-123',
      data: { id: 'test-id-123', meeting_id: 'test-meeting-123', content: 'hello world' },
      updated_at: new Date().toISOString()
    });
  
  if (error) {
    console.error('Insert Error:', error);
  } else {
    console.log('Insert Success:', data);
    
    console.log('Fetching test consensus...');
    const { data: fetch, error: fetchError } = await supabase
      .from('consensus')
      .select('*')
      .eq('id', 'test-id-123')
      .single();
    if (fetchError) {
      console.error('Fetch Error:', fetchError);
    } else {
      console.log('Fetch Success:', fetch);
    }
  }
}

run();
