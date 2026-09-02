const https = require('https');
const fs = require('fs');

const SUPABASE_URL = "https://eyfgkopaamnkprzpwocz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5Zmdrb3BhYW1ua3ByenB3b2N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxOTQ4MywiZXhwIjoyMDk0MTk1NDgzfQ.GIEEonN5-YGK1hBLloSun9WX-almQfnQW-0LdGOHmCk";

const GEOJSON_URL = "https://raw.githubusercontent.com/vierja/geojson_montevideo/master/barrios.geojson";

function fetch(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function supabaseRequest(path, method, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, SUPABASE_URL);
        const data = body ? JSON.stringify(body) : null;
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': 'Bearer ' + SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            }
        };
        const req = https.request(options, (res) => {
            let d = '';
            res.on('data', chunk => d += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: d }));
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

function centroid(geometry) {
    if (geometry.type === 'Polygon') {
        const coords = geometry.coordinates[0];
        let sumLat = 0, sumLng = 0;
        coords.forEach(c => { sumLng += c[0]; sumLat += c[1]; });
        return { lat: sumLat / coords.length, lng: sumLng / coords.length };
    }
    return { lat: -34.9, lng: -56.2 };
}

async function main() {
    console.log('Downloading barrios GeoJSON...');
    const raw = await fetch(GEOJSON_URL);
    const geojson = JSON.parse(raw);
    console.log(`Found ${geojson.features.length} barrios`);

    // First delete all existing
    console.log('Deleting existing barrios...');
    await supabaseRequest('/rest/v1/neighborhoods?country=eq.UY', 'DELETE');

    // Insert in batches of 10
    const BATCH = 10;
    for (let i = 0; i < geojson.features.length; i += BATCH) {
        const batch = geojson.features.slice(i, i + BATCH);
        const rows = batch.map(f => {
            const ctr = centroid(f.geometry);
            const name = (f.properties.nombre || '').replace(/[^\w\sáéíóúñüÁÉÍÓÚÑÜ.,'-]/g, '').trim();
            return {
                name: name,
                department: 'Montevideo',
                country: 'UY',
                geometry: f.geometry,
                center_lat: ctr.lat,
                center_lng: ctr.lng
            };
        }).filter(r => r.name);

        if (rows.length > 0) {
            const resp = await supabaseRequest('/rest/v1/neighborhoods', 'POST', rows);
            const ok = resp.status >= 200 && resp.status < 300;
            console.log(`Batch ${Math.floor(i/BATCH)+1}: ${rows.length} barrios ${ok ? 'OK' : 'FAIL: ' + resp.body}`);
        }
    }
    console.log('Done!');
}

main().catch(console.error);
