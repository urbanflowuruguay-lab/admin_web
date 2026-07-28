-- Agregar campos de tarifa de cancelación
ALTER TABLE cancelacion_config ADD COLUMN IF NOT EXISTS cancel_base_fee DOUBLE PRECISION DEFAULT 50;
ALTER TABLE cancelacion_config ADD COLUMN IF NOT EXISTS cancel_per_min DOUBLE PRECISION DEFAULT 3;
ALTER TABLE cancelacion_config ADD COLUMN IF NOT EXISTS cancel_per_km DOUBLE PRECISION DEFAULT 15;
