const https = require('https');

const SUPABASE_URL = 'https://eyfgkopaamnkprzpwocz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

function supabaseRequest(method, path, body) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'eyfgkopaamnkprzpwocz.supabase.co',
            path: `/rest/v1${path}`,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': method === 'GET' ? 'return=representation' : 'return=minimal'
            }
        };
        if (body) {
            options.headers['Content-Length'] = Buffer.byteLength(body);
        }
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { resolve(data); }
            });
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        if (req.method === 'GET') {
            const data = await supabaseRequest('GET', '/config_pagos?id=eq.1&select=*');
            const config = Array.isArray(data) ? data[0] : data;
            return res.status(200).json(config || { pagos_habilitados: false, modo_test: true });
        }

        if (req.method === 'POST') {
            const { pagos_habilitados, modo_test } = req.body;
            const update = {};
            if (pagos_habilitados !== undefined) update.pagos_habilitados = pagos_habilitados;
            if (modo_test !== undefined) update.modo_test = modo_test;
            update.updated_at = new Date().toISOString();

            const data = await supabaseRequest('PATCH', '/config_pagos?id=eq.1', JSON.stringify(update));
            return res.status(200).json({ status: 'ok', data });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
