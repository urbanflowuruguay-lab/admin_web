const SUPABASE_URL = "https://eyfgkopaamnkprzpwocz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5Zmdrb3BhYW1ua3ByenB3b2N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxOTQ4MywiZXhwIjoyMDk0MTk1NDgzfQ.GIEEonN5-YGK1hBLloSun9WX-almQfnQW-0LdGOHmCk";

async function main() {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/osm_alerts?select=type&order=created_at.desc`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const data = await resp.json();
  const counts = {};
  for (let row of data) {
    counts[row.type] = (counts[row.type] || 0) + 1;
  }
  console.log("Latest 1000 items:", counts);
}
main();
