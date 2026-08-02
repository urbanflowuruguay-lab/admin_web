CREATE OR REPLACE FUNCTION cleanup_stuck_trips()
RETURNS void AS $$
BEGIN
    UPDATE viajes 
    SET status = 'cancelado', cancel_reason = 'auto_cleanup'
    WHERE status IN ('solicitud', 'en_ruta', 'asignado') 
    AND created_at < NOW() - INTERVAL '2 hours';
END;
$$ LANGUAGE plpgsql;
