const https = require('https');

const SUPABASE_URL = 'https://eyfgkopaamnkprzpwocz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5Zmdrb3BhYW1ua3ByenB3b2N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxOTQ4MywiZXhwIjoyMDk0MTk1NDgzfQ.GIEEonN5-YGK1hBLloSun9WX-almQfnQW-0LdGOHmCk';

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

function supabasePatch(uiValue, country) {
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

async function main() {
    console.log(`[${new Date().toISOString()}] Actualizando UI de Uruguay...`);
    try {
        const uiValue = await fetchUIFromBCU();
        console.log(`UI obtenida del BCU: $${uiValue}`);
        await supabasePatch(uiValue, 'UY');
        console.log(`UI actualizada en Supabase para UY: $${uiValue}`);
    } catch (e) {
        console.error(`Error: ${e.message}`);
        process.exit(1);
    }
}

main();
