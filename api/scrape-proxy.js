// api/scrape-proxy.js — Vercel Serverless Function
// Proxy CORS para scraping de páginas web Y APIs externas (sigue redirects)

const https = require('https');
const http = require('http');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'es-UY,es;q=0.9,en;q=0.8'
};

function fetchUrl(url, maxRedirects = 5) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https');
        const client = isHttps ? https : http;
        const req = client.get(url, { headers: HEADERS, timeout: 15000 }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && maxRedirects > 0) {
                let redirectUrl = res.headers.location;
                if (!redirectUrl.startsWith('http')) {
                    const base = new URL(url);
                    redirectUrl = base.origin + redirectUrl;
                }
                res.resume();
                resolve(fetchUrl(redirectUrl, maxRedirects - 1));
                return;
            }
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, data }));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'Missing url parameter' });
    try { new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL' }); }

    try {
        const result = await fetchUrl(url);
        const ct = result.headers['content-type'] || '';
        if (ct.includes('application/json')) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
        } else {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        }
        res.status(result.statusCode).send(result.data);
    } catch (e) {
        res.status(502).json({ error: e.message });
    }
};
