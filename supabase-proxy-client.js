// supabase-proxy-client.js — Helper para llamadas al proxy de Supabase
// Reemplaza las llamadas directas a Supabase con service_role por llamadas al proxy

const SupabaseProxy = {
    // URL base del proxy (misma origin)
    BASE: '/api',

    // Hacer una petición al proxy
    async request(table, options = {}) {
        const {
            method = 'GET',
            select = '*',
            filters = [],
            order = '',
            limit = '',
            offset = '',
            body = null
        } = options;

        const params = new URLSearchParams();
        params.set('table', table);
        params.set('method', method);
        if (select !== '*') params.set('select', select);
        if (filters.length > 0) params.set('filters', filters.join('||'));
        if (order) params.set('order', order);
        if (limit) params.set('limit', limit);
        if (offset) params.set('offset', offset);

        const fetchOptions = {
            method: method === 'DELETE' ? 'POST' : method,
            headers: { 'Content-Type': 'application/json' }
        };

        if (body && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
            if (method === 'DELETE') {
                fetchOptions.body = JSON.stringify(body);
            } else {
                fetchOptions.body = JSON.stringify(body);
            }
        }

        const url = `${this.BASE}/supabase-proxy?${params.toString()}`;
        const res = await fetch(url, fetchOptions);
        return res.json();
    },

    // Atajos para operaciones comunes
    async select(table, options = {}) {
        return this.request(table, { method: 'GET', ...options });
    },

    async insert(table, data) {
        return this.request(table, { method: 'POST', body: data });
    },

    async update(table, data, filters = []) {
        return this.request(table, { method: 'PATCH', body: data, filters });
    },

    async delete(table, filters = []) {
        return this.request(table, { method: 'DELETE', filters });
    },

    // Query raw con SQL-like syntax via REST
    async raw(path) {
        const res = await fetch(`${this.BASE}/supabase-proxy?table=${encodeURIComponent(path)}`);
        return res.json();
    }
};
