const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'https://eyfgkopaamnkprzpwocz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5Zmdrb3BhYW1ua3ByenB3b2N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxOTQ4MywiZXhwIjoyMDk0MTk1NDgzfQ.GIEEonN5-YGK1hBLloSun9WX-almQfnQW-0LdGOHmCk';

const results = JSON.parse(fs.readFileSync('D:\\UF2026\\admin_web\\nominatim_results.json', 'utf8'));

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

async function main() {
  // Delete old placeholder polygons for these barrios
  const names = results.map(r => r.name);
  console.log(`Deleting old entries...`);
  await supabaseDelete('Canelones');
  await supabaseDelete('Maldonado');
  
  // Insert new real polygons
  const rows = results.map(r => {
    const coords = r.geojson.type === 'Polygon' ? r.geojson.coordinates[0] : r.geojson.coordinates[0][0];
    const lat = coords.reduce((s,c) => s + c[1], 0) / coords.length;
    const lng = coords.reduce((s,c) => s + c[0], 0) / coords.length;
    
    // Convert [lng,lat] to GeoJSON
    let geometry;
    if (r.geojson.type === 'Polygon') {
      geometry = r.geojson; // Already in correct format
    } else if (r.geojson.type === 'MultiPolygon') {
      geometry = r.geojson;
    } else {
      geometry = { type: 'Point', coordinates: [r.lng, r.lat] };
    }
    
    const dept = results.indexOf(r) < 5 ? 'Canelones' : 'Maldonado';
    
    return {
      name: r.name,
      department: dept,
      country: 'UY',
      geometry: geometry,
      center_lat: lat,
      center_lng: lng
    };
  });
  
  const inserted = await supabaseInsert(rows);
  inserted.forEach(r => console.log(`✅ ${r.name} (${r.department})`));
  console.log(`\nDone! ${inserted.length} barrios imported with real polygons.`);
}

main().catch(e => console.error('Error:', e.message));
