// api/scrape-proxy.js — Vercel Serverless Function
// Proxy CORS para scraping de páginas web externas
// Reemplaza api.allorigins.win que falla desde urbanflow.website

const https = require('https');
const http = require('http');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const url = req.query.url;
    if (!url) {
        return res.status(400).json({ error: 'Missing url parameter' });
    }

    try {
        new URL(url);
    } catch {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;

    return new Promise((resolve) => {
        const proxyReq = client.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'es-UY,es;q=0.9,en;q=0.8'
            },
            timeout: 15000
        }, (proxyRes) => {
            if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
                res.setHeader('Content-Type', 'text/plain');
                res.status(302).send(`Redirect to: ${proxyRes.headers.location}`);
                resolve();
                return;
            }

            let data = '';
            proxyRes.on('data', (chunk) => data += chunk);
            proxyRes.on('end', () => {
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.status(proxyRes.statusCode).send(data);
                resolve();
            });
        });

        proxyReq.on('error', (e) => {
            res.status(502).json({ error: e.message });
            resolve();
        });

        proxyReq.on('timeout', () => {
            proxyReq.destroy();
            res.status(504).json({ error: 'Timeout' });
            resolve();
        });
    });
};
