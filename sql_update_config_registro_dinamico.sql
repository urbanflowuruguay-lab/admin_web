-- Agregar columnas faltantes a config_registro_dinamico

-- Columnas que ya deberían existir (verificar):
-- pais_code, step_nro, step_title, field_id, label, subtitulo, relleno, type, visible

-- Agregar columnas nuevas:
ALTER TABLE config_registro_dinamico 
ADD COLUMN IF NOT EXISTS mostrar_label BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_subtitulo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS options TEXT,
ADD COLUMN IF NOT EXISTS show_if TEXT,
ADD COLUMN IF NOT EXISTS max_length INTEGER,
ADD COLUMN IF NOT EXISTS required BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS default_value TEXT;

-- Crear primary key compuesta si no existe
-- Nota: Esto puede requerir eliminar primary key existente primero
-- ALTER TABLE config_registro_dinamico DROP CONSTRAINT IF EXISTS config_registro_dinamico_pkey;
-- ALTER TABLE config_registro_dinamico ADD PRIMARY KEY (pais_code, step_nro, field_id);
