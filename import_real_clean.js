const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'https://eyfgkopaamnkprzpwocz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5Zmdrb3BhYW1ua3ByenB3b2N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxOTQ4MywiZXhwIjoyMDk0MTk1NDgzfQ.GIEEonN5-YGK1hBLloSun9WX-almQfnQW-0LdGOHmCk';

// These are the REAL Nominatim results with correct names and polygons
const barrios = [
  // Canelones
  { name: "Solymar", dept: "Canelones", search: "Solymar, Canelones, Uruguay" },
  { name: "Lagomar", dept: "Canelones", search: "Lagomar, Canelones, Uruguay" },
  { name: "El Pinar", dept: "Canelones", search: "El Pinar, Canelones, Uruguay" },
  { name: "Barra de Carrasco", dept: "Canelones", search: "Barra de Carrasco, Canelones, Uruguay" },
  { name: "Ciudad de la Costa", dept: "Canelones", search: "Ciudad de la Costa, Canelones, Uruguay" },
  // Maldonado
  { name: "Punta del Este", dept: "Maldonado", search: "Punta del Este, Maldonado, Uruguay" },
  { name: "Maldonado", dept: "Maldonado", search: "Maldonado, Maldonado, Uruguay" },
  { name: "Piriápolis", dept: "Maldonado", search: "Piriápolis, Maldonado, Uruguay" },
  { name: "San Carlos", dept: "Maldonado", search: "San Carlos, Maldonado, Uruguay" },
  { name: "Aiguá", dept: "Maldonado", search: "Aiguá, Maldonado, Uruguay" },
  { name: "José Ignacio", dept: "Maldonado", search: "José Ignacio, Maldonado, Uruguay" },
  { name: "La Barra", dept: "Maldonado", search: "La Barra, Maldonado, Uruguay" },
  { name: "Manantiales", dept: "Maldonado", search: "Manantiales, Maldonado, Uruguay" }
];

function searchNominatim(query) {
  return new Promise((resolve) => {
    const q = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&polygon_geojson=1&limit=1`;
    https.get(url, { headers: { 'User-Agent': 'UrbanFlowApp/1.0' } }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const arr = JSON.parse(d);
          if (arr.length > 0 && arr[0].geojson) {
            resolve(arr[0].geojson);
          } else { resolve(null); }
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

function supabaseDelete(dept) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/neighborhoods?department=eq.${dept}&country=eq.UY`);
    const req = https.request({
      method: 'DELETE', hostname: url.hostname, path: url.pathname,
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    }, (res) => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve()); });
    req.on('error', reject); req.end();
  });
}

function supabaseInsert(rows) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(rows);
    const url = new URL(`${SUPABASE_URL}/rest/v1/neighborhoods`);
    const req = https.request({
      method: 'POST', hostname: url.hostname, path: url.pathname,
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'return=representation' }
    }, (res) => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
      if(res.statusCode<300) resolve(JSON.parse(d));
      else { console.error(res.statusCode, d); reject(new Error(d)); }
    }); });
    req.on('error', reject); req.write(body); req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  // Step 1: Delete ALL Canelones and Maldonado
  console.log('Cleaning old data...');
  await supabaseDelete('Canelones');
  await supabaseDelete('Maldonado');
  console.log('Done.\n');

  // Step 2: Fetch real polygons from Nominatim
  const rows = [];
  for (const b of barrios) {
    console.log(`Fetching: ${b.name}...`);
    const geo = await searchNominatim(b.search);
    if (geo) {
      const coords = geo.type === 'Polygon' ? geo.coordinates[0] : geo.coordinates[0][0];
      const lat = coords.reduce((s,c) => s + c[1], 0) / coords.length;
      const lng = coords.reduce((s,c) => s + c[0], 0) / coords.length;
      rows.push({
        name: b.name, department: b.dept, country: 'UY',
        geometry: geo, center_lat: lat, center_lng: lng
      });
      console.log(`  ✅ ${b.name}: ${geo.type} (${coords.length} pts)`);
    } else {
      console.log(`  ❌ ${b.name}: not found`);
    }
    await sleep(1200);
  }

  // Step 3: Insert
  console.log(`\nInserting ${rows.length} barrios...`);
  const inserted = await supabaseInsert(rows);
  inserted.forEach(r => console.log(`  ✅ ${r.name} (${r.department})`));
  console.log(`\nDone! ${inserted.length} barrios with real polygons.`);
}

main().catch(e => console.error('Error:', e.message));
