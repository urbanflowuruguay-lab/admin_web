// api/update-ui.js — Vercel Serverless Function
// Fetches USD/UYU exchange rate from BCU and updates Supabase

const https = require('https');

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

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eyfgkopaamnkprzpwocz.supabase.co';
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

    if (!SUPABASE_KEY) {
        return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not configured' });
    }

    try {
        const uiValue = await fetchUIFromBCU();
        const today = new Date().toISOString().split('T')[0];
        const payload = JSON.stringify({ ui_value: uiValue, ui_last_updated: today });

        await new Promise((resolve, reject) => {
            const r = https.request({
                hostname: SUPABASE_URL.replace('https://', ''),
                path: `/rest/v1/config_tarifas?pais_code=eq.UY`,
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
                let d = '';
                res.on('data', (c) => d += c);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) resolve();
                    else reject(new Error(`Supabase ${res.statusCode}: ${d}`));
                });
            });
            r.on('error', reject);
            r.write(payload);
            r.end();
        });

        res.status(200).json({ success: true, value: uiValue });
    } catch(e) {
        res.status(200).json({ success: false, error: e.message });
    }
};
