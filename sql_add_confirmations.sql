-- Agregar columna de confirmaciones para el sistema de verificación comunitaria
-- Solo los eventos con category='fijo' se vuelven permanentes tras 3 confirmaciones

ALTER TABLE eventos ADD COLUMN IF NOT EXISTS confirmations INT DEFAULT 0;

-- Confirmar que eventos fijos cargados desde OSM tengan confirmations alto para que sean permanentes de entrada
UPDATE eventos SET confirmations = 5 WHERE category = 'fijo';
