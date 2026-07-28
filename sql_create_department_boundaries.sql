-- Tabla para polígonos de fronteras de departamentos
CREATE TABLE IF NOT EXISTS department_boundaries (
    id BIGSERIAL PRIMARY KEY,
    country TEXT NOT NULL,           -- 'UY', 'AR', etc.
    department TEXT NOT NULL,        -- 'Montevideo', 'Canelones', etc.
    geometry JSONB NOT NULL,         -- GeoJSON polygon coordinates
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para buscar por país
CREATE INDEX IF NOT EXISTS idx_dept_boundaries_country ON department_boundaries(country);

-- Índice espacial (requiere extensión PostGIS)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Columna geometry espacial para consultas rápidas
ALTER TABLE department_boundaries ADD COLUMN IF NOT EXISTS geom geometry(Geometry, 4326);

-- Trigger para actualizar geom al insertar/actualizar geometry
CREATE OR REPLACE FUNCTION update_dept_geom() RETURNS trigger AS $$
BEGIN
    NEW.geom = ST_GeomFromGeoJSON(NEW.geometry::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_dept_geom ON department_boundaries;
CREATE TRIGGER trg_update_dept_geom
    BEFORE INSERT OR UPDATE ON department_boundaries
    FOR EACH ROW
    EXECUTE FUNCTION update_dept_geom();

-- RLS ( Row Level Security )
ALTER TABLE department_boundaries ENABLE ROW LEVEL SECURITY;

-- Permitir todo a service_role
CREATE POLICY "Allow all for service role" ON department_boundaries
    FOR ALL
    USING (auth.role() = 'service_role');

-- Permitir lectura a anon (para geocoding)
CREATE POLICY "Allow read for anon" ON department_boundaries
    FOR SELECT
    USING (true);
