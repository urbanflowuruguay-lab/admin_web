const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const MIME = { 
    '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', 
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon'
};

const SUPABASE_URL = 'https://eyfgkopaamnkprzpwocz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5Zmdrb3BhYW1ua3ByenB3b2N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxOTQ4MywiZXhwIjoyMDk0MTk1NDgzfQ.GIEEonN5-YGK1hBLloSun9WX-almQfnQW-0LdGOHmCk';

// Montevideo Bus API cache
let busToken = null;
let busTokenExpiry = 0;

function fetchBusToken() {
    return new Promise((resolve, reject) => {
        const now = Date.now();
        if (busToken && now < busTokenExpiry) { resolve(busToken); return; }
        
        const postData = 'grant_type=client_credentials&client_id=a336f6a3&client_secret=407c0f83a616e0559b4df08c03c68d0a';
        const req = https.request({
            hostname: 'mvdapi-auth.montevideo.gub.uy',
            path: '/auth/realms/pci/protocol/openid-connect/token',
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) }
        }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const j = JSON.parse(data);
                    busToken = j.access_token;
                    busTokenExpiry = now + (j.expires_in || 300) * 1000 - 30000;
                    resolve(busToken);
                } catch(e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

function fetchBusesFromApi(lines) {
    return new Promise(async (resolve, reject) => {
        try {
            const token = await fetchBusToken();
            const req = https.request({
                hostname: 'api.montevideo.gub.uy',
                path: `/api/transportepublico/buses?lines=${lines}`,
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'UrbanFlow/1.0' }
            }, res => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                    try {
                        const arr = JSON.parse(data);
                        const buses = arr.map(b => ({
                            busId: String(b.busId || ''),
                            line: b.line || '',
                            company: b.company || '',
                            lat: b.location?.coordinates?.[1] || 0,
                            lng: b.location?.coordinates?.[0] || 0,
                            speed: b.speed || 0,
                            origin: b.origin || '',
                            destination: b.destination || ''
                        }));
                        resolve(buses);
                    } catch(e) { reject(e); }
                });
            });
            req.on('error', reject);
            req.end();
        } catch(e) { reject(e); }
    });
}

const server = http.createServer((req, res) => {
    // IMPORTANTE: Manejo de la API para guardar
    if (req.method === 'POST' && req.url === '/save-data') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                const safeCat = payload.category.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const fileName = `data_${safeCat}_${Date.now()}.json`;
                const dir = path.join(__dirname, 'descargas');
                
                if (!fs.existsSync(dir)) fs.mkdirSync(dir);
                
                fs.writeFileSync(path.join(dir, fileName), JSON.stringify(payload.data, null, 2));
                console.log(`[EXITO] Archivo guardado: ${fileName}`);
                
                res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify({ message: 'Guardado con éxito', fileName }));
            } catch (e) {
                console.error(`[ERROR] No se pudo guardar: ${e.message}`);
                res.writeHead(500);
                res.end('Error interno al guardar');
            }
        });
        return;
    }

    if (req.method === 'GET' && req.url === '/list-downloads') {
        const dir = path.join(__dirname, 'descargas');
        const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.json')) : [];
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(files));
        return;
    }

    // Montevideo Bus API proxy
    if (req.method === 'GET' && req.url.startsWith('/api/buses')) {
        const parsed = url.parse(req.url, true);
        const lines = parsed.query.lines || '';
        fetchBusesFromApi(lines).then(buses => {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ success: true, data: buses, count: buses.length }));
        }).catch(err => {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ success: false, error: err.message, data: [] }));
        });
        return;
    }

    // UI Update endpoint
    if (req.method === 'GET' && req.url === '/api/update-ui') {
        updateUIAutomatico().then(result => {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify(result));
        });
        return;
    }

    // Cancelacion config endpoints
    if (req.method === 'GET' && req.url === '/api/cancel-config') {
        const options = {
            hostname: 'eyfgkopaamnkprzpwocz.supabase.co',
            path: '/rest/v1/cancelacion_config?id=eq.1&select=*',
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        };
        https.get(options, proxyRes => {
            let data = '';
            proxyRes.on('data', c => data += c);
            proxyRes.on('end', () => {
                res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(data);
            });
        }).on('error', e => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        });
        return;
    }

    if (req.method === 'POST' && req.url === '/api/cancel-config') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const postData = body;
            const options = {
                hostname: 'eyfgkopaamnkprzpwocz.supabase.co',
                path: '/rest/v1/cancelacion_config?id=eq.1',
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Length': Buffer.byteLength(postData)
                }
            };
            const proxyReq = https.request(options, proxyRes => {
                let data = '';
                proxyRes.on('data', c => data += c);
                proxyRes.on('end', () => {
                    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                    res.end(data);
                });
            });
            proxyReq.on('error', e => {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            });
            proxyReq.write(postData);
            proxyReq.end();
        });
        return;
    }

    // === PDF / Ruta endpoint ===
    // GET /api/viajes-ruta?driver_id=XXX&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
    if (req.method === 'GET' && req.url.startsWith('/api/viajes-ruta')) {
        const parsed = url.parse(req.url, true);
        const driverId = parsed.query.driver_id || '';
        const dateFrom = parsed.query.date_from || '';
        const dateTo = parsed.query.date_to || '';
        let filters = ['status=eq.completado'];
        if (driverId) filters.push(`driver_id=eq.${driverId}`);
        if (dateFrom) filters.push(`created_at=gte.${dateFrom}T00:00:00`);
        if (dateTo) filters.push(`created_at=lte.${dateTo}T23:59:59`);
        const reqPath = `/rest/v1/viajes?${filters.join('&')}&select=*&order=created_at.desc`;
        const options = {
            hostname: 'eyfgkopaamnkprzpwocz.supabase.co',
            path: reqPath,
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        };
        https.get(options, proxyRes => {
            let data = '';
            proxyRes.on('data', c => data += c);
            proxyRes.on('end', () => {
                res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(data);
            });
        }).on('error', e => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        });
        return;
    }

    // Delete viajes endpoint
    if (req.method === 'POST' && req.url === '/api/viajes-delete') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const { ids } = JSON.parse(body);
                if (!ids || !ids.length) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'No IDs provided' }));
                    return;
                }
                const filter = ids.map(id => `id.eq.${id}`).join(',');
                const postData = '';
                const options = {
                    hostname: 'eyfgkopaamnkprzpwocz.supabase.co',
                    path: `/rest/v1/viajes?or=(${filter})`,
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                };
                const proxyReq = https.request(options, proxyRes => {
                    let data = '';
                    proxyRes.on('data', c => data += c);
                    proxyRes.on('end', () => {
                        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                        res.end(JSON.stringify({ success: true, deleted: ids.length }));
                    });
                });
                proxyReq.on('error', e => {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                });
                proxyReq.write(postData);
                proxyReq.end();
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // Servir archivos estáticos
    let urlPath = req.url === '/' ? '/index.html' : req.url;
    let filePath = path.join(__dirname, urlPath);
    
    // Permitir acceso a la carpeta de descargas
    if (urlPath.startsWith('/descargas/')) {
        filePath = path.join(__dirname, urlPath);
    }

    fs.readFile(filePath, (err, data) => {
        if (err) { 
            res.writeHead(404); 
            res.end('No encontrado: ' + req.url); 
            return; 
        }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'text/plain' });
        res.end(data);
    });
});

// === UI (Unidad Indexada) Auto-Update ===

function fetchUIFromBCU() {
    return new Promise((resolve, reject) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

        const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
                       xmlns:Cotiza="Cotiza">
          <soap:Body>
            <Cotiza:wsbcucotizaciones.Execute>
              <Cotiza:Entrada>
                <Cotiza:Moneda><Cotiza:item>9800</Cotiza:item></Cotiza:Moneda>
                <Cotiza:FechaDesde>${fmt(yesterday)}</Cotiza:FechaDesde>
                <Cotiza:FechaHasta>${fmt(today)}</Cotiza:FechaHasta>
                <Cotiza:Grupo>2</Cotiza:Grupo>
              </Cotiza:Entrada>
            </Cotiza:wsbcucotizaciones.Execute>
          </soap:Body>
        </soap:Envelope>`;

        const req = https.request({
            hostname: 'cotizaciones.bcu.gub.uy',
            path: '/wscotizaciones/servlet/awsbcucotizaciones',
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'Cotizaaction/AWSBCUCOTIZACIONES.Execute',
                'Content-Length': Buffer.byteLength(xmlBody)
            },
            rejectUnauthorized: false
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const matches = data.match(/<TCV>([\d.,]+)<\/TCV>/g);
                if (matches && matches.length > 0) {
                    const last = matches[matches.length - 1];
                    const val = last.match(/<TCV>([\d.,]+)<\/TCV>/)[1];
                    resolve(parseFloat(val.replace(',', '.')));
                } else {
                    reject(new Error('UI not found in BCU response'));
                }
            });
        });
        req.on('error', reject);
        req.write(xmlBody);
        req.end();
    });
}

function supabaseUpdateUI(uiValue, country) {
    return new Promise((resolve, reject) => {
        const today = new Date().toISOString().split('T')[0];
        const payload = JSON.stringify({ ui_value: uiValue, ui_last_updated: today });
        const req = https.request({
            hostname: 'eyfgkopaamnkprzpwocz.supabase.co',
            path: `/rest/v1/config_tarifas?pais_code=eq.${country}`,
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Length': Buffer.byteLength(payload),
                'Prefer': 'return=minimal'
            },
            rejectUnauthorized: false
        }, (res) => {
            let data = '';
            res.on('data', (c) => data += c);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) resolve();
                else reject(new Error(`Supabase ${res.statusCode}: ${data}`));
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

async function updateUIAutomatico() {
    try {
        const uiValue = await fetchUIFromBCU();
        await supabaseUpdateUI(uiValue, 'UY');
        console.log(`[UI] Actualizada: $${uiValue} (UY)`);
        return { success: true, value: uiValue };
    } catch (e) {
        console.error(`[UI] Error: ${e.message}`);
        return { success: false, error: e.message };
    }
}

// Verificar UI al iniciar y cada hora
updateUIAutomatico();
setInterval(updateUIAutomatico, 60 * 60 * 1000);

server.listen(PORT, () => {
    console.log('================================================');
    console.log(`  SERVIDOR ACTIVO EN: http://localhost:${PORT}`);
    console.log('================================================');
    console.log(`  1. Para bajar datos: /descargar_guia.html`);
    console.log(`  2. Para ver el mapa: /ver_mapa_local.html`);
    console.log('================================================');
});
