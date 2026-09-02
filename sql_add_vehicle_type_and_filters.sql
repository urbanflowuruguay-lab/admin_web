-- Agregar campos para filtros de tipo de vehiculo y categorias especiales
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT 'auto';
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS is_geoferta BOOLEAN DEFAULT FALSE;
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS complemento_de UUID REFERENCES viajes(id);

-- Indices para filtros rapidos
CREATE INDEX IF NOT EXISTS idx_viajes_vehicle_type ON viajes(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_viajes_is_geoferta ON viajes(is_geoferta);
CREATE INDEX IF NOT EXISTS idx_viajes_complemento_de ON viajes(complemento_de);
