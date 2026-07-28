-- Agregar columnas de auto-habilitación a config_paises

ALTER TABLE config_paises 
ADD COLUMN IF NOT EXISTS auto_habilitacion_autos BOOLEAN DEFAULT false;

ALTER TABLE config_paises 
ADD COLUMN IF NOT EXISTS auto_habilitacion_taxis BOOLEAN DEFAULT false;

-- Valores por defecto para países existentes
UPDATE config_paises 
SET auto_habilitacion_autos = false, auto_habilitacion_taxis = false 
WHERE auto_habilitacion_autos IS NULL OR auto_habilitacion_taxis IS NULL;
