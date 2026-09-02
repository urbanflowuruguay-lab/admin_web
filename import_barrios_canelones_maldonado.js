const https = require('https');

const SUPABASE_URL = 'https://eyfgkopaamnkprzpwocz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5Zmdrb3BhYW1ua3ByenB3b2N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MTk0ODMsImV4cCI6MjA5NDE5NTQ4M30.bXkq4Ks3p2yb2SQH76__8jXhmM5Thi2izIL5UPkKa0I';

// Overpass API results (from previous query)
const canelones = [
  { name: "El Pinar", lat: -34.7969, lng: -55.9077, type: "suburb" },
  { name: "Barrio Jardín", lat: -34.7698, lng: -55.7656, type: "neighbourhood" },
  { name: "Barrio Citrama", lat: -34.7078, lng: -55.9448, type: "neighbourhood" },
  { name: "Barrio Español", lat: -34.7548, lng: -55.7655, type: "neighbourhood" },
  { name: "Pinares Norte", lat: -34.7642, lng: -55.7566, type: "neighbourhood" },
  { name: "Pinares", lat: -34.7697, lng: -55.7518, type: "neighbourhood" },
  { name: "Atlántida Serena", lat: -34.7710, lng: -55.7691, type: "neighbourhood" },
  { name: "La Lata", lat: -34.7723, lng: -55.7644, type: "neighbourhood" },
  { name: "Edén Rock", lat: -34.7752, lng: -55.7498, type: "neighbourhood" },
  { name: "El Progreso", lat: -34.7784, lng: -55.7597, type: "neighbourhood" },
  { name: "Viviendas COVIPAN", lat: -34.7246, lng: -55.9508, type: "neighbourhood" }
];

const maldonado = [
  { name: "La Aguada", lat: -34.6409, lng: -54.1578, type: "neighbourhood" },
  { name: "Costa Azul", lat: -34.6334, lng: -54.1553, type: "neighbourhood" },
  { name: "Barrio Parque de La Paloma", lat: -34.6409, lng: -54.1679, type: "neighbourhood" },
  { name: "Barrio El Plata", lat: -34.4717, lng: -54.3122, type: "neighbourhood" },
  { name: "El Triángulo", lat: -34.5362, lng: -54.0679, type: "neighbourhood" },
  { name: "Antonípolis", lat: -34.6253, lng: -54.1522, type: "neighbourhood" },
  { name: "Altos de Costa Azul", lat: -34.6296, lng: -54.1615, type: "neighbourhood" },
  { name: "Estanislao Barrios", lat: -34.4933, lng: -54.3532, type: "neighbourhood" },
  { name: "Hipódromo", lat: -34.4841, lng: -54.3519, type: "neighbourhood" },
  { name: "La Estiba", lat: -34.4820, lng: -54.3404, type: "neighbourhood" },
  { name: "Centro", lat: -34.4808, lng: -54.3338, type: "neighbourhood" },
  { name: "Jose Machado", lat: -34.4881, lng: -54.3372, type: "neighbourhood" },
  { name: "Adolfo Viera", lat: -34.4904, lng: -54.3334, type: "neighbourhood" },
  { name: "Juan Antonio Lavalleja", lat: -34.4925, lng: -54.3377, type: "neighbourhood" },
  { name: "INVE", lat: -34.4867, lng: -54.3275, type: "neighbourhood" },
  { name: "Alejandro", lat: -34.4938, lng: -54.3164, type: "neighbourhood" },
  { name: "Union", lat: -34.4953, lng: -54.3242, type: "neighbourhood" },
  { name: "Treinta y Tres", lat: -34.4982, lng: -54.3247, type: "neighbourhood" },
  { name: "La Alegria", lat: -34.4956, lng: -54.3302, type: "neighbourhood" },
  { name: "Jardines de Rocha", lat: -34.4890, lng: -54.3232, type: "neighbourhood" }
];

// Simple point geometry for now (Supabase geometry is JSONB)
function createPointGeometry(lat, lng) {
  return { type: "Point", coordinates: [lng, lat] };
}

async function insertBarrios(barrios, department) {
  const rows = barrios.map(b => ({
    name: b.name,
    department: department,
    country: "UY",
    center_lat: b.lat,
    center_lng: b.lng,
    geometry: createPointGeometry(b.lat, b.lng)
  }));

  const body = JSON.stringify(rows);

  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/neighborhoods`);
    const options = {
      method: 'POST',
      hostname: url.hostname,
      path: url.pathname,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ ${department}: Inserted ${barrios.length} barrios`);
          resolve(JSON.parse(data));
        } else {
          console.error(`❌ ${department} error (${res.statusCode}):`, data);
          reject(new Error(data));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Importing barrios to Supabase...\n');

  try {
    await insertBarrios(canelones, 'Canelones');
    await insertBarrios(maldonado, 'Maldonado');
    console.log('\nDone!');
  } catch (err) {
    console.error('Import failed:', err.message);
  }
}

main();
