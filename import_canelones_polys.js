const https = require('https');
const SUPABASE_URL = 'https://eyfgkopaamnkprzpwocz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5Zmdrb3BhYW1ua3ByenB3b2N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxOTQ4MywiZXhwIjoyMDk0MTk1NDgzfQ.GIEEonN5-YGK1hBLloSun9WX-almQfnQW-0LdGOHmCk';

const features = [
  { name: "Barra de Carrasco", dept: "Canelones", geo: { type:"Polygon", coordinates:[[[-56.031,-34.871],[-56.0335,-34.887],[-56.019,-34.882],[-56.015,-34.869],[-56.031,-34.871]]] } },
  { name: "Lagomar", dept: "Canelones", geo: { type:"Polygon", coordinates:[[[-55.996,-34.858],[-55.9985,-34.876],[-55.979,-34.873],[-55.975,-34.855],[-55.996,-34.858]]] } },
  { name: "Solymar", dept: "Canelones", geo: { type:"Polygon", coordinates:[[[-55.965,-34.851],[-55.969,-34.871],[-55.942,-34.868],[-55.938,-34.848],[-55.965,-34.851]]] } },
  { name: "El Pinar", dept: "Canelones", geo: { type:"Polygon", coordinates:[[[-55.912,-34.799],[-55.918,-34.84],[-55.892,-34.831],[-55.885,-34.795],[-55.912,-34.799]]] } }
];

async function insert() {
  const rows = features.map(f => {
    const coords = f.geo.coordinates[0];
    const lat = coords.reduce((s,c) => s + c[1], 0) / coords.length;
    const lng = coords.reduce((s,c) => s + c[0], 0) / coords.length;
    return { name: f.name, department: f.dept, country: "UY", geometry: f.geo, center_lat: lat, center_lng: lng };
  });
  const body = JSON.stringify(rows);
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/neighborhoods`);
    const req = https.request({
      method: 'POST', hostname: url.hostname, path: url.pathname,
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'return=representation' }
    }, (res) => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ if(res.statusCode<300) resolve(JSON.parse(d)); else { console.error(res.statusCode,d); reject(); } }); });
    req.on('error', reject); req.write(body); req.end();
  });
}

insert().then(r => {
  r.forEach(b => console.log(`✅ ${b.name} (${b.department}): [${b.center_lat.toFixed(4)}, ${b.center_lng.toFixed(4)}]`));
}).catch(() => console.error('Error'));
