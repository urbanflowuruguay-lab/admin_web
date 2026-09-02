ALTER TABLE pirana_licenses ADD COLUMN IF NOT EXISTS paused BOOLEAN DEFAULT false;

-- Pausar todos los que no tienen teléfono
UPDATE pirana_licenses SET paused = true WHERE phone IS NULL OR phone = '';
