// api/supabase-proxy.js — Vercel Serverless Function
// Proxy a Supabase con service_role key (nunca expuesta al cliente)
// Soporta GET, POST, PATCH, DELETE

const https = require('https');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Table, X-Method, X-Filters, X-Select, X-Order, X-Limit, X-Offset');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eyfgkopaamnkprzpwocz.supabase.co';
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

    if (!SUPABASE_KEY) {
        return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not configured' });
    }

    // The client sends metadata in headers or query params
    const table = req.query.table || req.headers['x-table'];
    const method = (req.query.method || req.headers['x-method'] || req.method).toUpperCase();
    const filters = req.query.filters || req.headers['x-filters'] || '';
    const select = req.query.select || req.headers['x-select'] || '*';
    const order = req.query.order || req.headers['x-order'] || '';
    const limit = req.query.limit || req.headers['x-limit'] || '';
    const offset = req.query.offset || req.headers['x-offset'] || '';

    if (!table) {
        return res.status(400).json({ error: 'Missing table parameter' });
    }

    // Build Supabase REST path
    let path = `/rest/v1/${table}`;

    const queryParams = [];
    if (select && select !== '*') queryParams.push(`select=${encodeURIComponent(select)}`);
    if (filters) {
        const filterList = filters.split('||');
        filterList.forEach(f => {
            if (f.trim()) queryParams.push(encodeURIComponent(f.trim()));
        });
    }
    if (order) queryParams.push(`order=${encodeURIComponent(order)}`);
    if (limit) queryParams.push(`limit=${limit}`);
    if (offset) queryParams.push(`offset=${offset}`);

    if (queryParams.length > 0) {
        path += '?' + queryParams.join('&');
    }

    const options = {
        hostname: SUPABASE_URL.replace('https://', ''),
        path: path,
        method: method,
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': method === 'POST' ? 'return=representation' : (method === 'DELETE' ? 'return=representation' : 'return=minimal')
        }
    };

    return new Promise((resolve) => {
        const proxyReq = https.request(options, (proxyRes) => {
            let data = '';
            proxyRes.on('data', (chunk) => data += chunk);
            proxyRes.on('end', () => {
                res.setHeader('Content-Type', 'application/json');
                res.status(proxyRes.statusCode).send(data);
                resolve();
            });
        });

        proxyReq.on('error', (e) => {
            res.status(500).json({ error: e.message });
            resolve();
        });

        // Forward body for POST/PATCH/PUT
        if (['POST', 'PATCH', 'PUT'].includes(method)) {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                proxyReq.write(body);
                proxyReq.end();
            });
        } else {
            proxyReq.end();
        }
    });
};
