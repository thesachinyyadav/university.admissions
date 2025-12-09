-- ------------------------------------------------------------
-- Teachers quick import helper
-- ------------------------------------------------------------
-- Run everything in one shot with:
--   psql "<connection string>" -v csv_path="D:/path/to/teachers.csv" \
--     -f scripts/import_teachers_quick.sql
-- If you do not pass csv_path, the default below will be used.
-- ------------------------------------------------------------

\if :{?csv_path}
\else
\set csv_path 'D:/BCA/christuniversitygated/v4admissionsocio/universitygatedv3-main/teachers.csv'
\endif

\echo 'Loading teachers from:' :'csv_path'

BEGIN;

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
    ALTER COLUMN panel TYPE INTEGER
    USING NULLIF(regexp_replace(panel::TEXT, '\\D', '', 'g'), '')::INTEGER;

ALTER TABLE teachers
    ADD COLUMN IF NOT EXISTS panel_session_token TEXT;

ALTER TABLE teachers
    ADD COLUMN IF NOT EXISTS panel_device_id TEXT;

ALTER TABLE teachers
    ADD COLUMN IF NOT EXISTS panel_last_confirmed_at TIMESTAMP WITH TIME ZONE;

DROP TABLE IF EXISTS tmp_teachers;
CREATE TEMP TABLE tmp_teachers (
    name TEXT,
    email TEXT,
    panel_label TEXT
);

COMMIT;

\copy tmp_teachers (name, email, panel_label)
  FROM :'csv_path'
  WITH (FORMAT csv, HEADER true);

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

\echo 'Teachers import complete.'
