const https = require('https');

const SUPABASE_URL = 'https://eyfgkopaamnkprzpwocz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

function supabaseUpdate(table, data, match) {
    return new Promise((resolve, reject) => {
        const path = `/rest/v1/${table}`;
        const body = JSON.stringify(data);
        const matchParts = Object.entries(match).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
        const url = `${SUPABASE_URL}${path}?${matchParts}`;

        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'return=minimal',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

function supabaseInsert(table, data) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data);
        const options = {
            hostname: 'eyfgkopaamnkprzpwocz.supabase.co',
            path: `/rest/v1/${table}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'return=minimal',
                'Content-Length': Buffer.byteLength(body)
            }
        };
        const req = https.request(options, (res) => {
            let d = '';
            res.on('data', (chunk) => d += chunk);
            res.on('end', () => resolve({ status: res.statusCode }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method === 'GET') {
        return res.status(200).json({ status: 'ok', message: 'Webhook active' });
    }

    try {
        const body = req.body;
        const type = body.type;
        const dataId = body.data?.id;

        if (!dataId) {
            return res.status(200).json({ status: 'ignored', reason: 'no data id' });
        }

        const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
        if (!MP_ACCESS_TOKEN) {
            return res.status(500).json({ error: 'MP_ACCESS_TOKEN not configured' });
        }

        const paymentData = await new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.mercadopago.com',
                path: `/v1/payments/${dataId}`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
                }
            };
            const mpReq = https.request(options, (mpRes) => {
                let data = '';
                mpRes.on('data', (chunk) => data += chunk);
                mpRes.on('end', () => {
                    try { resolve(JSON.parse(data)); }
                    catch (e) { reject(e); }
                });
            });
            mpReq.on('error', reject);
            mpReq.end();
        });

        const productoId = paymentData.external_reference;
        const mpStatus = paymentData.status;
        const mpPaymentId = String(paymentData.id);

        if (productoId) {
            await supabaseUpdate('ecommerce_usados', {
                mp_status: mpStatus,
                mp_payment_id: mpPaymentId,
                vendido: mpStatus === 'approved',
                activo: mpStatus !== 'approved'
            }, { id: productoId });

            await supabaseInsert('ecommerce_usados_pagos', {
                producto_id: parseInt(productoId),
                vendedor_id: paymentData.metadata?.vendedor_id || '',
                comprador_id: paymentData.metadata?.comprador_id || '',
                mp_preference_id: '',
                mp_payment_id: mpPaymentId,
                monto: paymentData.transaction_amount,
                estado: mpStatus
            });
        }

        return res.status(200).json({ status: 'processed' });
    } catch (e) {
        return res.status(200).json({ status: 'error', message: e.message });
    }
};
