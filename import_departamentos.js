const https = require('https');

const SUPABASE_URL = "https://eyfgkopaamnkprzpwocz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5Zmdrb3BhYW1ua3ByenB3b2N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxOTQ4MywiZXhwIjoyMDk0MTk1NDgzfQ.GIEEonN5-YGK1hBLloSun9WX-almQfnQW-0LdGOHmCk";

const COUNTRIES = [
    { iso: 'ARG', name: 'Argentina' },
    { iso: 'BRA', name: 'Brasil' },
    { iso: 'PRY', name: 'Paraguay' },
    { iso: 'CHL', name: 'Chile' }
];

function httpGet(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 60000 }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return httpGet(res.headers.location).then(resolve).catch(reject);
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });
}

function supabaseRequest(method, path, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, SUPABASE_URL);
        const postData = body ? JSON.stringify(body) : null;
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        };
        if (postData) {
            options.headers['Content-Length'] = Buffer.byteLength(postData);
            options.headers['Prefer'] = 'return=minimal';
        }
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                else resolve(data ? JSON.parse(data) : null);
            });
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

function simplifyRing(ring, tol) {
    if (ring.length <= 10) return ring;
    function dp(pts, t) {
        if (pts.length <= 2) return pts;
        let max = 0, idx = 0;
        const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
        const dx = bx - ax, dy = by - ay, len = Math.sqrt(dx*dx + dy*dy);
        for (let i = 1; i < pts.length - 1; i++) {
            const [px, py] = pts[i];
            const d = len === 0 ? Math.hypot(px-ax, py-ay) : Math.abs(dy*px - dx*py + bx*ay - by*ax) / len;
            if (d > max) { max = d; idx = i; }
        }
        if (max > t) {
            const l = dp(pts.slice(0, idx+1), t);
            const r = dp(pts.slice(idx), t);
            return [...l.slice(0,-1), ...r];
        }
        return [pts[0], pts[pts.length-1]];
    }
    return dp(ring, tol);
}

function simplifyGeom(geom, tol) {
    if (geom.type === 'Polygon') {
        return { type: 'Polygon', coordinates: geom.coordinates.map(r => simplifyRing(r, tol)) };
    } else if (geom.type === 'MultiPolygon') {
        return { type: 'MultiPolygon', coordinates: geom.coordinates.map(p => p.map(r => simplifyRing(r, tol))) };
    }
    return geom;
}

async function importCountry(iso, name) {
    console.log(`\n🌍 Importando ${name} (${iso})...`);

    // Get metadata to find download URL
    const meta = await httpGet(`https://www.geoboundaries.org/api/current/gbOpen/${iso}/ADM1/`);
    const metaJson = JSON.parse(meta);
    const downloadUrl = metaJson.gjDownloadURL;
    console.log(`  📥 Descargando desde geoBoundaries...`);

    const geojsonRaw = await httpGet(downloadUrl);
    const geojson = JSON.parse(geojsonRaw);
    console.log(`  📊 ${geojson.features.length} unidades encontradas`);

    const rows = [];
    for (const f of geojson.features) {
        const deptName = f.properties.shapeName || f.properties.name || `Depto_${rows.length+1}`;
        const geom = simplifyGeom(f.geometry, 0.001);
        rows.push({ country: iso, department: deptName, geometry: geom });
    }

    // Delete existing for this country
    console.log(`  🗑️  Eliminando ${iso} anterior...`);
    await supabaseRequest('DELETE', `/rest/v1/department_boundaries?country=eq.${iso}`);

    // Insert in batches of 5
    const batchSize = 5;
    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        console.log(`  📦 Insertando ${i + 1}-${Math.min(i + batchSize, rows.length)}...`);
        const result = await supabaseRequest('POST', '/rest/v1/department_boundaries', batch);
        if (result && result.error) console.error(`  ❌ Error:`, result.error.message);
    }

    console.log(`  ✅ ${name}: ${rows.length} departamentos importados`);
    return rows.length;
}

async function main() {
    let total = 0;
    for (const c of COUNTRIES) {
        try {
            total += await importCountry(c.iso, c.name);
        } catch (e) {
            console.error(`❌ Error importando ${c.name}: ${e.message}`);
        }
    }
    console.log(`\n🎉 ¡Listo! ${total} departamentos importados en total.`);
}

main().catch(console.error);
