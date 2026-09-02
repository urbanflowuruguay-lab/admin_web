const https = require('https');

const SUPABASE_URL = 'https://eyfgkopaamnkprzpwocz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5Zmdrb3BhYW1ua3ByenB3b2N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxOTQ4MywiZXhwIjoyMDk0MTk1NDgzfQ.GIEEonN5-YGK1hBLloSun9WX-almQfnQW-0LdGOHmCk';

const features = [
  {
    barrio: "Península", ciudad: "Punta del Este", dept: "Maldonado",
    geo: { type: "Polygon", coordinates: [[[-54.951,-34.962],[-54.954,-34.966],[-54.945,-34.970],[-54.939,-34.965],[-54.943,-34.956],[-54.951,-34.962]]] }
  },
  {
    barrio: "San Rafael", ciudad: "Punta del Este", dept: "Maldonado",
    geo: { type: "Polygon", coordinates: [[[-54.919,-34.928],[-54.925,-34.935],[-54.910,-34.940],[-54.903,-34.932],[-54.919,-34.928]]] }
  },
  {
    barrio: "Cantegril", ciudad: "Punta del Este", dept: "Maldonado",
    geo: { type: "Polygon", coordinates: [[[-54.946,-34.918],[-54.948,-34.926],[-54.931,-34.930],[-54.928,-34.922],[-54.946,-34.918]]] }
  }
];

async function insert() {
  const rows = features.map(f => {
    // Calculate center
    const coords = f.geo.coordinates[0];
    const lat = coords.reduce((s,c) => s + c[1], 0) / coords.length;
    const lng = coords.reduce((s,c) => s + c[0], 0) / coords.length;
    return {
      name: f.barrio,
      department: f.dept,
      country: "UY",
      geometry: f.geo,
      center_lat: lat,
      center_lng: lng
    };
  });

  const body = JSON.stringify(rows);
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/neighborhoods`);
    const req = https.request({
      method: 'POST', hostname: url.hostname, path: url.pathname,
      headers: {
        'Content-Type': 'application/json', 'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'return=representation'
      }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode < 300) {
          console.log('Inserted:', JSON.parse(d).length, 'barrios');
          resolve(JSON.parse(d));
        } else {
          console.error('Error:', res.statusCode, d);
          reject(new Error(d));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

insert().then(r => {
  r.forEach(b => console.log(`  - ${b.name} (${b.department}): center [${b.center_lat}, ${b.center_lng}]`));
}).catch(e => console.error('Failed:', e.message));
