const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://eyfgkopaamnkprzpwocz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5Zmdrb3BhYW1ua3ByenB3b2N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxOTQ4MywiZXhwIjoyMDk0MTk1NDgzfQ.GIEEonN5-YGK1hBLloSun9WX-almQfnQW-0LdGOHmCk";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const { data, error } = await sb.from('osm_alerts').select('type').eq('country', 'UY');
  if (error) console.error(error);
  else {
    const counts = {};
    for (let row of data) {
      counts[row.type] = (counts[row.type] || 0) + 1;
    }
    console.log(counts);
  }
}
main();
