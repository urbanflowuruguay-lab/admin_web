-- ========================================
-- Migración config_tarifas — fórmula de precios 2026
-- Ejecutar en Supabase SQL Editor
-- ========================================

-- La empresa cobra 5.5 UI fijas (reemplaza el antiguo canon 0.45 UI/km + 3.50 UI)
-- Las columnas base_fare, price_per_min, price_per_wait_min se conservan para
-- compatibilidad pero YA NO se usan en el cálculo de precio.

-- 1. Agregar columna company_fee_ui si falta
ALTER TABLE config_tarifas
    ADD COLUMN IF NOT EXISTS company_fee_ui NUMERIC(6,2) DEFAULT 5.5;

-- 2. Agregar columnas de recargos si faltan
ALTER TABLE config_tarifas
    ADD COLUMN IF NOT EXISTS night_surcharge_active BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS night_surcharge_pct NUMERIC(5,2) DEFAULT 20.0,
    ADD COLUMN IF NOT EXISTS night_start_hour INTEGER DEFAULT 22,
    ADD COLUMN IF NOT EXISTS night_end_hour INTEGER DEFAULT 6,
    ADD COLUMN IF NOT EXISTS sunday_surcharge_active BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS holiday_surcharge_active BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS feriados JSONB DEFAULT '[]'::jsonb;

-- 2. Asegurar columnas legacy (ya no se usan en cálculo, solo compatibilidad)
ALTER TABLE config_tarifas
    ADD COLUMN IF NOT EXISTS base_fare NUMERIC(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS price_per_min NUMERIC(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS price_per_wait_min NUMERIC(10,2) DEFAULT 0;

-- 3. Agregar columnas de cancelación
ALTER TABLE config_tarifas
    ADD COLUMN IF NOT EXISTS cancel_free_time_sec INTEGER DEFAULT 120,
    ADD COLUMN IF NOT EXISTS cancel_free_show_time BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS cancel_paid_time_sec INTEGER DEFAULT 300,
    ADD COLUMN IF NOT EXISTS cancel_apply_fare_formula BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS cancel_base_fee NUMERIC(10,2) DEFAULT 50.0,
    ADD COLUMN IF NOT EXISTS cancel_per_min NUMERIC(10,2) DEFAULT 3.0,
    ADD COLUMN IF NOT EXISTS cancel_per_km NUMERIC(10,2) DEFAULT 15.0;

-- 4. Actualizar registros existentes con valores por defecto
UPDATE config_tarifas SET
    night_surcharge_active = true,
    night_surcharge_pct = 20.0,
    night_start_hour = 22,
    night_end_hour = 6,
    sunday_surcharge_active = true,
    holiday_surcharge_active = true,
    feriados = '[
        {"fecha":"2026-01-01","nombre":"Año Nuevo"},
        {"fecha":"2026-01-06","nombre":"Día de Reyes"},
        {"fecha":"2026-02-16","nombre":"Carnaval"},
        {"fecha":"2026-02-17","nombre":"Carnaval"},
        {"fecha":"2026-03-30","nombre":"Semana de Turismo"},
        {"fecha":"2026-04-03","nombre":"Viernes Santo"},
        {"fecha":"2026-04-19","nombre":"Desembarco 33 Orientales"},
        {"fecha":"2026-05-01","nombre":"Día de los Trabajadores"},
        {"fecha":"2026-05-18","nombre":"Batalla de las Piedras"},
        {"fecha":"2026-06-19","nombre":"Natalicio de Artigas"},
        {"fecha":"2026-07-18","nombre":"Jura de la Constitución"},
        {"fecha":"2026-08-25","nombre":"Declaratoria de la Independencia"},
        {"fecha":"2026-10-12","nombre":"Día de la Raza"},
        {"fecha":"2026-11-02","nombre":"Día de los Difuntos"},
        {"fecha":"2026-12-25","nombre":"Navidad"}
    ]'::jsonb
WHERE feriados IS NULL OR feriados = '[]'::jsonb;


-- ========================================
-- CREATE TABLE actualizado (para instalación limpia)
-- ========================================

-- CREATE TABLE IF NOT EXISTS config_tarifas (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     pais_code TEXT NOT NULL DEFAULT 'UY',
--
--     -- Unidad indexada
--     ui_value NUMERIC(10,2) DEFAULT 0,
--     ui_last_updated DATE,
--
--     -- Precios del chofer (defaults)
--     price_per_km NUMERIC(10,2) DEFAULT 40.0,
--     min_fare NUMERIC(10,2) DEFAULT 100.0,
--
--     -- Precios fijos de empresa
--     per_second_cost NUMERIC(10,4) DEFAULT 0.28,
--     stop_price NUMERIC(10,2) DEFAULT 30.0,
--     package_price NUMERIC(10,2) DEFAULT 50.0,
--     pet_price NUMERIC(10,2) DEFAULT 30.0,
--     out_of_zone_index NUMERIC(5,2) DEFAULT 1.5,
--     dynamic_multiplier NUMERIC(5,2) DEFAULT 1.0,
--     company_fee_ui NUMERIC(6,2) DEFAULT 5.5,
--
--     -- Recargos por horario y días
--     night_surcharge_active BOOLEAN DEFAULT true,
--     night_surcharge_pct NUMERIC(5,2) DEFAULT 20.0,
--     night_start_hour INTEGER DEFAULT 22,
--     night_end_hour INTEGER DEFAULT 6,
--     sunday_surcharge_active BOOLEAN DEFAULT true,
--     holiday_surcharge_active BOOLEAN DEFAULT true,
--     feriados JSONB DEFAULT '[]'::jsonb,
--
--     -- Preferencias
--     accepts_packages BOOLEAN DEFAULT true,
--     accepts_pets BOOLEAN DEFAULT true,
--
--     -- Columnas legacy (ya no se usan en cálculo)
--     base_fare NUMERIC(10,2) DEFAULT 0,
--     price_per_min NUMERIC(10,2) DEFAULT 0,
--     price_per_wait_min NUMERIC(10,2) DEFAULT 0,
--
--     -- Cancelaciones
--     cancel_free_time_sec INTEGER DEFAULT 120,
--     cancel_free_show_time BOOLEAN DEFAULT true,
--     cancel_paid_time_sec INTEGER DEFAULT 300,
--     cancel_apply_fare_formula BOOLEAN DEFAULT true,
--     cancel_base_fee NUMERIC(10,2) DEFAULT 50.0,
--     cancel_per_min NUMERIC(10,2) DEFAULT 3.0,
--     cancel_per_km NUMERIC(10,2) DEFAULT 15.0,
--
--     created_at TIMESTAMPTZ DEFAULT NOW(),
--     updated_at TIMESTAMPTZ DEFAULT NOW()
-- );
