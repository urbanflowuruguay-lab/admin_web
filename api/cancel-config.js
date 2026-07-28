// api/cancel-config.js — Vercel Serverless Function
// Proxy para cancelacion_config

const https = require('https');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eyfgkopaamnkprzpwocz.supabase.co';
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

    if (!SUPABASE_KEY) {
        return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not configured' });
    }

    if (req.method === 'GET') {
        // Read config
        return new Promise((resolve) => {
            https.get({
                hostname: SUPABASE_URL.replace('https://', ''),
                path: '/rest/v1/cancelacion_config?id=eq.1&select=*',
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

    if (req.method === 'POST' || req.method === 'PATCH') {
        // Update config
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            const postData = body;
            const r = https.request({
                hostname: SUPABASE_URL.replace('https://', ''),
                path: '/rest/v1/cancelacion_config?id=eq.1',
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Length': Buffer.byteLength(postData)
                }
            }, proxyRes => {
                let data = '';
                proxyRes.on('data', c => data += c);
                proxyRes.on('end', () => {
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).send(data);
                });
            });
            r.on('error', e => {
                res.status(500).json({ error: e.message });
            });
            r.write(postData);
            r.end();
        });
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
};
