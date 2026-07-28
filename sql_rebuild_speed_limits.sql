DROP TABLE IF EXISTS speed_limits_new;

CREATE TABLE speed_limits_new AS 
SELECT DISTINCT ON (way_id) * FROM speed_limits ORDER BY way_id, id;

DROP TABLE speed_limits;

ALTER TABLE speed_limits_new RENAME TO speed_limits;

SELECT pg_size_pretty(pg_total_relation_size('public.speed_limits')) AS tamanho;
