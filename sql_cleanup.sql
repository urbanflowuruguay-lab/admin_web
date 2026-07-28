-- Borrar lo que no se necesita de eventos
DELETE FROM eventos WHERE type IN ('cruce_tren', 'pare', 'ceda');

-- Borrar eventos inactivos viejos (más de 30 días)
DELETE FROM eventos WHERE status = 'inactive' AND created_at < NOW() - INTERVAL '30 days';

-- Borrar tablas que no se necesitan
DROP TABLE IF EXISTS crash_logs;
DROP TABLE IF EXISTS osm_alerts;

-- Ver qué queda
SELECT type, status, COUNT(*) as total FROM eventos GROUP BY type, status ORDER BY type;
