-- Agregar columnas faltantes a config_paises (tabla ya existe)

ALTER TABLE config_paises 
ADD COLUMN IF NOT EXISTS nombre_pais TEXT;

ALTER TABLE config_paises 
ADD COLUMN IF NOT EXISTS habilitado BOOLEAN DEFAULT true;

-- Actualizar nombres de países
UPDATE config_paises 
SET nombre_pais = CASE 
    WHEN pais_code = 'UY' THEN 'Uruguay'
    WHEN pais_code = 'AR' THEN 'Argentina'
    WHEN pais_code = 'CL' THEN 'Chile'
    WHEN pais_code = 'BR' THEN 'Brasil'
    WHEN pais_code = 'PY' THEN 'Paraguay'
END
WHERE nombre_pais IS NULL;

-- Actualizar habilitado a true para todos los registros existentes
UPDATE config_paises 
SET habilitado = true 
WHERE habilitado IS NULL;

-- Actualizar departamentos de Uruguay si ya existe
UPDATE config_paises 
SET departamentos_habilitados = ARRAY['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S']
WHERE pais_code = 'UY' AND departamentos_habilitados IS NULL;
