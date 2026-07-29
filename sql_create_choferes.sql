CREATE TABLE IF NOT EXISTS choferes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    nombre TEXT,
    telefono TEXT,
    tipo_vehiculo TEXT DEFAULT 'auto',
    patente TEXT,
    status TEXT DEFAULT 'pendiente',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE choferes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "choferes_select_own" ON choferes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "choferes_insert_own" ON choferes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "choferes_update_own" ON choferes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "choferes_admin_all" ON choferes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND role = 'admin')
    );
