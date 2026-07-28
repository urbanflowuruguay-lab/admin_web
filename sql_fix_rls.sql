-- Desactivar RLS en todas las tablas del admin
ALTER TABLE config_tarifas DISABLE ROW LEVEL SECURITY;
ALTER TABLE config_registro_dinamico DISABLE ROW LEVEL SECURITY;
ALTER TABLE config_paises DISABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE empresas DISABLE ROW LEVEL SECURITY;
ALTER TABLE viajes DISABLE ROW LEVEL SECURITY;
ALTER TABLE reglas_chofer DISABLE ROW LEVEL SECURITY;
ALTER TABLE map_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE cancelacion_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE department_boundaries DISABLE ROW LEVEL SECURITY;

-- Verificar
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN (
  'config_tarifas','config_registro_dinamico','config_paises','perfiles','empresas',
  'viajes','reglas_chofer','map_events','cancelacion_config','department_boundaries'
);
