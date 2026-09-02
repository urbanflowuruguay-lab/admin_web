const https = require('https');

// Try POST method with body
const query = '[out:json][timeout:30];(way["place"~"suburb|neighbourhood"](-34.89,-56.05,-34.78,-55.88););out geom;';

const postData = 'data=' + encodeURIComponent(query);

const options = {
  hostname: 'overpass-api.de',
  path: '/api/interpreter',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  },
  timeout: 45000
};

const req = https.request(options, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const j = JSON.parse(d);
      const ways = j.elements.filter(e => e.tags && e.tags.name && e.geometry);
      console.log(`Found ${ways.length} ways with polygons:\n`);
      ways.forEach(e => {
        console.log(`- ${e.tags.name}: ${e.geometry.length} points`);
      });
      require('fs').writeFileSync('D:\\UF2026\\admin_web\\osm_canelones.json', JSON.stringify(j, null, 2));
      console.log('\nSaved to osm_canelones.json');
    } catch(e) {
      console.log('Parse error:', d.substring(0, 300));
    }
  });
});

req.on('error', e => console.log('Error:', e.message));
req.write(postData);
req.end();
