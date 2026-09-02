const https = require('https');

const query = '[out:json][timeout:30];(way["place"~"suburb|neighbourhood"](-34.89,-56.05,-34.78,-55.88););out geom;';
const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);

https.get(url, {timeout: 45000}, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    try {
      const j = JSON.parse(d);
      const ways = j.elements.filter(e => e.tags && e.tags.name && e.geometry);
      console.log(`Found ${ways.length} ways with polygons:\n`);
      ways.forEach(e => {
        const pts = e.geometry.map(g => `[${g.lon},${g.lat}]`);
        console.log(`- ${e.tags.name}: ${pts.length} points`);
      });
      // Save full data
      require('fs').writeFileSync('D:\\UF2026\\admin_web\\osm_canelones.json', JSON.stringify(j, null, 2));
      console.log('\nSaved to osm_canelones.json');
    } catch(e) {
      console.log('Error:', e.message);
      console.log('Response:', d.substring(0, 500));
    }
  });
}).on('error', e => console.log('Error:', e.message));
