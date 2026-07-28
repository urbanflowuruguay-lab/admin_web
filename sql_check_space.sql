-- Ver tamaño de cada tabla
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS total_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC;

-- Ver archivos por bucket de storage
SELECT 
    bucket_id,
    COUNT(*) as archivos
FROM storage.objects
GROUP BY bucket_id
ORDER BY archivos DESC;
