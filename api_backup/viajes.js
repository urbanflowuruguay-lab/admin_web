// api/viajes.js — Vercel Serverless Function
// Proxy para consulta y eliminación de viajes

const https = require('https');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eyfgkopaamnkprzpwocz.supabase.co';
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

    if (!SUPABASE_KEY) {
        return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not configured' });
    }

    // GET /api/viajes?driver_id=X&date_from=Y&date_to=Z
    if (req.method === 'GET') {
        const { driver_id, date_from, date_to, status } = req.query;
        let filters = ['status=eq.completado'];
        if (status) filters = [`status=eq.${status}`];
        if (driver_id) filters.push(`driver_id=eq.${driver_id}`);
        if (date_from) filters.push(`created_at=gte.${date_from}T00:00:00`);
        if (date_to) filters.push(`created_at=lte.${date_to}T23:59:59`);

        const path = `/rest/v1/viajes?${filters.join('&')}&select=*&order=created_at.desc`;

        return new Promise((resolve) => {
            https.get({
                hostname: SUPABASE_URL.replace('https://', ''),
                path: path,
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
            }, proxyRes => {
                let data = '';
                proxyRes.on('data', c => data += c);
                proxyRes.on('end', () => {
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).send(data);
                    resolve();
                });
            }).on('error', e => {
                res.status(500).json({ error: e.message });
                resolve();
            });
        });
    }

    // POST /api/viajes — body: { ids: [...] }
    if (req.method === 'POST' || req.method === 'DELETE') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const { ids } = JSON.parse(body);
                if (!ids || !ids.length) {
                    res.status(400).json({ error: 'No IDs provided' });
                    return;
                }
                const filter = ids.map(id => `id.eq.${id}`).join(',');
                const r = https.request({
                    hostname: SUPABASE_URL.replace('https://', ''),
                    path: `/rest/v1/viajes?or=(${filter})`,
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                }, proxyRes => {
                    let data = '';
                    proxyRes.on('data', c => data += c);
                    proxyRes.on('end', () => {
                        res.setHeader('Content-Type', 'application/json');
                        res.status(200).json({ success: true, deleted: ids.length });
                    });
                });
                r.on('error', e => {
                    res.status(500).json({ error: e.message });
                });
                r.end();
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
        });
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
};
