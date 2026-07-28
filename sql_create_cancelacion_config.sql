CREATE TABLE IF NOT EXISTS cancelacion_config (
    id INT PRIMARY KEY DEFAULT 1,
    free_time_sec INT NOT NULL DEFAULT 120,
    free_text TEXT NOT NULL DEFAULT 'CANCELACIÓN GRATUITA',
    free_color TEXT NOT NULL DEFAULT '#FF0000',
    free_bg TEXT NOT NULL DEFAULT '#1A0000',
    free_show_time TEXT NOT NULL DEFAULT 'yes',
    paid_time_sec INT NOT NULL DEFAULT 300,
    paid_text TEXT NOT NULL DEFAULT 'CANCELACIÓN CON COSTO',
    paid_color TEXT NOT NULL DEFAULT '#42A5F5',
    paid_bg TEXT NOT NULL DEFAULT '#0D2A55',
    paid_show_time TEXT NOT NULL DEFAULT 'no',
    action_free TEXT NOT NULL DEFAULT 'cancel',
    action_paid TEXT NOT NULL DEFAULT 'confirm',
    action_expired TEXT NOT NULL DEFAULT 'nothing',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Only one row allowed
INSERT INTO cancelacion_config (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE cancelacion_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read (anon key)
CREATE POLICY "Allow read" ON cancelacion_config FOR SELECT USING (true);

-- Only service role can write
CREATE POLICY "Allow write" ON cancelacion_config FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
