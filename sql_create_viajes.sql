CREATE TABLE IF NOT EXISTS viajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Pasajero
    passenger_id TEXT,
    passenger_name TEXT DEFAULT '',
    passenger_photo TEXT DEFAULT '',

    -- Chofer
    driver_id TEXT DEFAULT '',
    driver_name TEXT DEFAULT '',
    driver_matricula TEXT DEFAULT '',

    -- Ubicaciones
    origin_lat DOUBLE PRECISION DEFAULT 0,
    origin_lng DOUBLE PRECISION DEFAULT 0,
    origin_name TEXT DEFAULT '',
    dest_lat DOUBLE PRECISION DEFAULT 0,
    dest_lng DOUBLE PRECISION DEFAULT 0,
    dest_name TEXT DEFAULT '',

    -- Ficha
    service TEXT DEFAULT 'Viajar',
    total_km DOUBLE PRECISION DEFAULT 0,
    total_min DOUBLE PRECISION DEFAULT 0,
    stops_count INT DEFAULT 0,

    -- Plata
    base_price DOUBLE PRECISION DEFAULT 0,
    adjusted_price DOUBLE PRECISION DEFAULT 0,
    final_price DOUBLE PRECISION DEFAULT 0,

    -- Estado
    status TEXT DEFAULT 'solicitud',
    cancel_reason TEXT DEFAULT '',
    cancel_phase TEXT DEFAULT '',
    cancellation_fee DOUBLE PRECISION DEFAULT 0,

    -- Tiempos
    accepted_at TIMESTAMPTZ,
    pickup_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,

    -- Distancia chofer al cancelar
    driver_distance_at_cancel DOUBLE PRECISION DEFAULT 0
);

-- Indices para filtros rapidos
CREATE INDEX IF NOT EXISTS idx_viajes_status ON viajes(status);
CREATE INDEX IF NOT EXISTS idx_viajes_created ON viajes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_viajes_passenger ON viajes(passenger_id);
CREATE INDEX IF NOT EXISTS idx_viajes_driver ON viajes(driver_id);

-- RLS
ALTER TABLE viajes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON viajes FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
