const https = require('https');

const query = '[out:json][timeout:30];(way["place"~"suburb|neighbourhood"](-34.89,-56.05,-34.78,-55.88););out geom;';
const postData = 'data=' + encodeURIComponent(query);

// Try multiple Overpass endpoints
const endpoints = [
  { hostname: 'lz4.overpass-api.de', path: '/api/interpreter' },
  { hostname: 'overpass.kumi.systems', path: '/api/interpreter' },
  { hostname: 'maps.mail.ru', path: '/osm/tools/overpass/api/interpreter' }
];

async function tryEndpoint(ep) {
  return new Promise((resolve) => {
    const options = {
      hostname: ep.hostname, path: ep.path, method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) },
      timeout: 45000
    };
    const req = https.request(options, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          if (j.elements) { resolve(j); } else { resolve(null); }
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.write(postData);
    req.end();
  });
}

async function main() {
  for (const ep of endpoints) {
    console.log(`Trying ${ep.hostname}...`);
    const result = await tryEndpoint(ep);
    if (result) {
      const ways = result.elements.filter(e => e.tags && e.tags.name && e.geometry);
      console.log(`Found ${ways.length} ways with polygons:\n`);
      ways.forEach(e => console.log(`- ${e.tags.name}: ${e.geometry.length} points`));
      require('fs').writeFileSync('D:\\UF2026\\admin_web\\osm_canelones.json', JSON.stringify(result, null, 2));
      console.log('\nSaved!');
      return;
    }
  }
  console.log('All endpoints failed');
}

main();
