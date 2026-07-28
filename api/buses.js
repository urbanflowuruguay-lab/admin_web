// api/buses.js — Vercel Serverless Function
// Proxy a la API de buses de Montevideo

const https = require('https');

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

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const lines = req.query.lines || '';

    try {
        const token = await fetchBusToken();
        const data = await new Promise((resolve, reject) => {
            const r = https.request({
                hostname: 'api.montevideo.gub.uy',
                path: `/api/transportepublico/buses?lines=${lines}`,
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'UrbanFlow/1.0' }
            }, res => {
                let d = '';
                res.on('data', c => d += c);
                res.on('end', () => {
                    try {
                        const arr = JSON.parse(d);
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
            r.on('error', reject);
            r.end();
        });

        res.status(200).json({ success: true, data: data, count: data.length });
    } catch(e) {
        res.status(200).json({ success: false, error: e.message, data: [] });
    }
};
