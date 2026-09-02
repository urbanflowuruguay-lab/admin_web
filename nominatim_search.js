const https = require('https');

const places = [
  "Solymar, Canelones, Uruguay",
  "Lagomar, Canelones, Uruguay",
  "El Pinar, Canelones, Uruguay",
  "Barra de Carrasco, Canelones, Uruguay",
  "Ciudad de la Costa, Canelones, Uruguay",
  "Punta del Este, Maldonado, Uruguay",
  "Maldonado, Maldonado, Uruguay",
  "Piriápolis, Maldonado, Uruguay",
  "San Carlos, Maldonado, Uruguay",
  "Aiguá, Maldonado, Uruguay",
  "José Ignacio, Maldonado, Uruguay",
  "La Barra, Maldonado, Uruguay",
  "Manantiales, Maldonado, Uruguay"
];

function searchPlace(query) {
  return new Promise((resolve) => {
    const q = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&polygon_geojson=1&limit=1`;
    https.get(url, { headers: { 'User-Agent': 'UrbanFlowApp/1.0' } }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const arr = JSON.parse(d);
          if (arr.length > 0 && arr[0].geojson) {
            resolve({ name: arr[0].display_name.split(',')[0], geojson: arr[0].geojson, lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) });
          } else {
            resolve(null);
          }
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function main() {
  const results = [];
  for (const p of places) {
    console.log(`Searching: ${p}...`);
    const r = await searchPlace(p);
    if (r) {
      const type = r.geojson.type;
      const size = type === 'Polygon' ? r.geojson.coordinates[0].length : 
                   type === 'MultiPolygon' ? r.geojson.coordinates[0][0].length : '?';
      console.log(`  ✅ ${r.name}: ${type} (${size} points)`);
      results.push(r);
    } else {
      console.log(`  ❌ Not found`);
    }
    await new Promise(r => setTimeout(r, 1200)); // Rate limit
  }
  
  require('fs').writeFileSync('D:\\UF2026\\admin_web\\nominatim_results.json', JSON.stringify(results, null, 2));
  console.log(`\nSaved ${results.length} results`);
}

main();
