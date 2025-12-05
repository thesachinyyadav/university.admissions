-- ------------------------------------------------------------
-- Teachers import helper
-- ------------------------------------------------------------
-- Execute this script inside psql (or Supabase SQL editor) to
-- create the required table structure and prepare for CSV import.
--
-- Usage with psql:
--   \i scripts/import_teachers.sql
--   \copy tmp_teachers (name, email, panel_label)
--     FROM 'd:/BCA/christuniversitygated/v4admissionsocio/universitygatedv3-main/teachers.csv'
--     WITH (FORMAT csv, HEADER true);
--   \i scripts/import_teachers.sql -- run the insert section again (optional)
-- ------------------------------------------------------------

BEGIN;

-- 1. Ensure the teachers table exists
CREATE TABLE IF NOT EXISTS teachers (
    teacher_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    department VARCHAR(255),
    specialization VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE teachers
    ADD COLUMN IF NOT EXISTS panel INTEGER;

ALTER TABLE teachers
    ALTER COLUMN panel TYPE INTEGER USING NULLIF(regexp_replace(panel::TEXT, '\\D', '', 'g'), '')::INTEGER;

ALTER TABLE teachers
    ADD COLUMN IF NOT EXISTS panel_session_token TEXT;

ALTER TABLE teachers
    ADD COLUMN IF NOT EXISTS panel_device_id TEXT;

ALTER TABLE teachers
    ADD COLUMN IF NOT EXISTS panel_last_confirmed_at TIMESTAMP WITH TIME ZONE;

-- 2. Staging table for CSV rows (drop and recreate to keep things clean)
DROP TABLE IF EXISTS tmp_teachers;
CREATE TEMP TABLE tmp_teachers (
    name TEXT,
    email TEXT,
    panel_label TEXT
);

COMMIT;

-- ------------------------------------------------------------
-- After running the COPY command (see usage note above), execute
-- the following block to upsert the staged rows into teachers.
-- ------------------------------------------------------------

BEGIN;

INSERT INTO teachers (name, email, panel, is_active)
SELECT
    TRIM(name) AS name,
    LOWER(TRIM(email)) AS email,
    NULLIF(regexp_replace(panel_label, '\\D', '', 'g'), '')::INTEGER AS panel,
    true AS is_active
FROM tmp_teachers
WHERE email IS NOT NULL AND TRIM(email) <> ''
ON CONFLICT (email) DO UPDATE
SET
    name = EXCLUDED.name,
    panel = EXCLUDED.panel,
    is_active = true,
    updated_at = CURRENT_TIMESTAMP;

COMMIT;

-- Optional: preview panel numbers parsed from "Panel 12" style labels
-- SELECT
--   name,
--   email,
--   NULLIF(regexp_replace(panel_label, '\\D', '', 'g'), '')::INT AS panel_number
-- FROM tmp_teachers;
