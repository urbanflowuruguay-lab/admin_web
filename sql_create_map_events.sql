-- SQL actualizado para manejar horarios diferenciados
CREATE TABLE IF NOT EXISTS map_events (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    type TEXT NOT NULL, -- 'carril_bus', 'cierre_calle', 'zona_obras'
    name TEXT NOT NULL,
    
    -- Horarios Lunes a Viernes
    weekday_start TEXT DEFAULT '07:00',
    weekday_end TEXT DEFAULT '20:00',
    
    -- Horarios Sábados y Feriados
    weekend_start TEXT DEFAULT '09:00',
    weekend_end TEXT DEFAULT '14:00',
    
    affects_both_directions BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active',
    street_name TEXT,
    geometry JSONB NOT NULL
);

ALTER TABLE map_events ENABLE ROW LEVEL SECURITY;
-- (Las políticas se mantienen igual)
CREATE POLICY "Permitir lectura publica" ON map_events FOR SELECT USING (true);
CREATE POLICY "Permitir insercion publica" ON map_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualizacion publica" ON map_events FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Permitir borrado publico" ON map_events FOR DELETE USING (true);
