const https = require('https');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
    if (!MP_ACCESS_TOKEN) {
        return res.status(500).json({ error: 'MP_ACCESS_TOKEN not configured' });
    }

    const { titulo, precio, cantidad, producto_id, comprador_id, vendedor_id, fotos } = req.body;

    if (!titulo || !precio) {
        return res.status(400).json({ error: 'titulo and precio are required' });
    }

    const preference = {
        items: [{
            id: String(producto_id || '0'),
            title: titulo,
            quantity: Number(cantidad) || 1,
            unit_price: Number(precio),
            currency_id: 'UYU'
        }],
        external_reference: String(producto_id || ''),
        metadata: {
            producto_id: String(producto_id || ''),
            comprador_id: comprador_id || '',
            vendedor_id: vendedor_id || ''
        },
        back_urls: {
            success: 'https://urbanflow-admin.vercel.app/mp-success.html',
            failure: 'https://urbanflow-admin.vercel.app/mp-failure.html',
            pending: 'https://urbanflow-admin.vercel.app/mp-success.html'
        },
        auto_return: 'approved',
        notification_url: 'https://urbanflow-admin.vercel.app/api/mp-webhook'
    };

    if (fotos && fotos.length > 0) {
        preference.items[0].picture_url = fotos[0];
    }

    const body = JSON.stringify(preference);

    return new Promise((resolve) => {
        const options = {
            hostname: 'api.mercadopago.com',
            path: '/checkout/preferences',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const mpReq = https.request(options, (mpRes) => {
            let data = '';
            mpRes.on('data', (chunk) => data += chunk);
            mpRes.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.id) {
                        res.status(200).json({
                            id: parsed.id,
                            init_point: parsed.init_point,
                            sandbox_init_point: parsed.sandbox_init_point
                        });
                    } else {
                        res.status(400).json({ error: 'Failed to create preference', details: parsed });
                    }
                } catch (e) {
                    res.status(500).json({ error: 'Invalid response from MP' });
                }
                resolve();
            });
        });

        mpReq.on('error', (e) => {
            res.status(500).json({ error: 'Network error: ' + e.message });
            resolve();
        });

        mpReq.write(body);
        mpReq.end();
    });
};
