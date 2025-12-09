-- =====================================================
-- AUTH - ADMISSIONS INTERVIEW MANAGEMENT SYSTEM
-- Christ University Office of Admissions
-- Database Schema for Supabase PostgreSQL
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM (
    'master_admin',
    'verification_staff',
    'volunteer',
    'panel'
);

CREATE TYPE applicant_status AS ENUM (
    'REGISTERED',
    'ARRIVED',
    'DOCUMENT_VERIFIED',
    'INTERVIEW_IN_PROGRESS',
    'INTERVIEW_COMPLETED'
);

CREATE TYPE checkpoint_type AS ENUM (
    'ARRIVAL',
    'DOCUMENT_VERIFICATION',
    'INTERVIEW_STARTED',
    'INTERVIEW_COMPLETED'
);

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table for authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    assigned_floor_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Floors management
CREATE TABLE floors (
    floor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    floor_name VARCHAR(100) NOT NULL,
    floor_number INTEGER NOT NULL,
    assigned_programs TEXT[],
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Teachers (for panel assignment)
CREATE TABLE teachers (
    teacher_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    department VARCHAR(255),
    specialization VARCHAR(255),
    panel INTEGER,
    panel_session_token TEXT,
    panel_device_id TEXT,
    panel_last_confirmed_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Interview panels
CREATE TABLE panels (
    panel_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    panel_login VARCHAR(50) UNIQUE NOT NULL,
    panel_password_hash VARCHAR(255) NOT NULL,
    assigned_floor_id UUID REFERENCES floors(floor_id),
    teacher_name_1 VARCHAR(255),
    teacher_name_2 VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Applicants (main data table)
CREATE TABLE applicants (
    application_number TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone TEXT NOT NULL,
    program VARCHAR(255) NOT NULL,
    campus VARCHAR(255),
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(255),
    instructions TEXT,
    status applicant_status DEFAULT 'REGISTERED',
    arrived_at TIMESTAMP WITH TIME ZONE,
    document_verified_at TIMESTAMP WITH TIME ZONE,
    interviewed_at TIMESTAMP WITH TIME ZONE,
    interviewed_by_emails TEXT,
    assigned_panel_id UUID REFERENCES panels(panel_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Checkpoints tracking (audit log)
CREATE TABLE checkpoints (
    checkpoint_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_number TEXT NOT NULL REFERENCES applicants(application_number),
    checkpoint_type checkpoint_type NOT NULL,
    panel_id UUID REFERENCES panels(panel_id),
    panel_number INTEGER,
    user_id UUID REFERENCES users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SMS logs (for tracking sent messages)
CREATE TABLE sms_logs (
    sms_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_number TEXT NOT NULL REFERENCES applicants(application_number),
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'sent',
    twilio_sid TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System audit logs
CREATE TABLE system_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_applicants_status ON applicants(status);
CREATE INDEX idx_applicants_date ON applicants(date);
CREATE INDEX idx_applicants_program ON applicants(program);
CREATE INDEX idx_applicants_phone ON applicants(phone);
CREATE INDEX idx_checkpoints_app_number ON checkpoints(application_number);
CREATE INDEX idx_checkpoints_type ON checkpoints(checkpoint_type);
CREATE INDEX idx_checkpoints_timestamp ON checkpoints(timestamp);
CREATE INDEX idx_checkpoints_panel_number ON checkpoints(panel_number);
CREATE INDEX idx_panels_floor ON panels(assigned_floor_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_teachers_panel ON teachers(panel);
CREATE UNIQUE INDEX idx_teachers_panel_session_token ON teachers(panel_session_token) WHERE panel_session_token IS NOT NULL;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
    total_registered BIGINT,
    total_arrived BIGINT,
    total_verified BIGINT,
    total_interviewed BIGINT,
    pending_arrival BIGINT,
    pending_verification BIGINT,
    pending_interview BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) FILTER (WHERE status = 'REGISTERED') as total_registered,
        COUNT(*) FILTER (WHERE status IN ('ARRIVED', 'DOCUMENT_VERIFIED', 'INTERVIEW_IN_PROGRESS', 'INTERVIEW_COMPLETED')) as total_arrived,
        COUNT(*) FILTER (WHERE status IN ('DOCUMENT_VERIFIED', 'INTERVIEW_IN_PROGRESS', 'INTERVIEW_COMPLETED')) as total_verified,
        COUNT(*) FILTER (WHERE status = 'INTERVIEW_COMPLETED') as total_interviewed,
        COUNT(*) FILTER (WHERE status = 'REGISTERED') as pending_arrival,
        COUNT(*) FILTER (WHERE status = 'ARRIVED') as pending_verification,
        COUNT(*) FILTER (WHERE status = 'DOCUMENT_VERIFIED') as pending_interview
    FROM applicants
    WHERE date = p_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get floor-wise statistics
CREATE OR REPLACE FUNCTION get_floor_stats(p_floor_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
    floor_name VARCHAR,
    total_applicants BIGINT,
    arrived BIGINT,
    verified BIGINT,
    interviewed BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.floor_name,
        COUNT(a.application_number) as total_applicants,
        COUNT(a.application_number) FILTER (WHERE a.status IN ('ARRIVED', 'DOCUMENT_VERIFIED', 'INTERVIEW_IN_PROGRESS', 'INTERVIEW_COMPLETED')) as arrived,
        COUNT(a.application_number) FILTER (WHERE a.status IN ('DOCUMENT_VERIFIED', 'INTERVIEW_IN_PROGRESS', 'INTERVIEW_COMPLETED')) as verified,
        COUNT(a.application_number) FILTER (WHERE a.status = 'INTERVIEW_COMPLETED') as interviewed
    FROM floors f
    LEFT JOIN applicants a ON a.program = ANY(f.assigned_programs) AND a.date = p_date
    WHERE f.floor_id = p_floor_id
    GROUP BY f.floor_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_floors_updated_at BEFORE UPDATE ON floors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_panels_updated_at BEFORE UPDATE ON panels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applicants_updated_at BEFORE UPDATE ON applicants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS
-- =====================================================

-- View for today's applicants summary
CREATE VIEW todays_applicants AS
SELECT
    a.application_number,
    a.name,
    a.phone,
    a.program,
    a.campus,
    a.time,
    a.location,
    a.status,
    a.arrived_at,
    a.document_verified_at,
    a.interviewed_at,
    f.floor_name,
    p.teacher_name_1,
    p.teacher_name_2
FROM applicants a
LEFT JOIN floors f ON a.program = ANY(f.assigned_programs)
LEFT JOIN panels p ON a.assigned_panel_id = p.panel_id
WHERE a.date = CURRENT_DATE
ORDER BY a.time;

-- View for panel performance
CREATE VIEW panel_performance AS
SELECT
    p.panel_id,
    p.panel_login,
    p.teacher_name_1,
    p.teacher_name_2,
    f.floor_name,
    COUNT(a.application_number) FILTER (WHERE a.status = 'INTERVIEW_COMPLETED' AND DATE(a.interviewed_at) = CURRENT_DATE) as interviews_completed_today,
    AVG(EXTRACT(EPOCH FROM (a.interviewed_at - a.document_verified_at))/60) FILTER (WHERE a.status = 'INTERVIEW_COMPLETED' AND DATE(a.interviewed_at) = CURRENT_DATE) as avg_interview_duration_minutes
FROM panels p
LEFT JOIN floors f ON p.assigned_floor_id = f.floor_id
LEFT JOIN applicants a ON a.assigned_panel_id = p.panel_id
WHERE p.is_active = true
GROUP BY p.panel_id, p.panel_login, p.teacher_name_1, p.teacher_name_2, f.floor_name;

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert Master Admin (password: AUTH@2025)
-- Password hash generated with bcrypt rounds=10
INSERT INTO users (username, password_hash, role, full_name, email, is_active)
VALUES (
    'admin',
    '$2a$10$X5YvYkHq8YQ3F2nY6gvE8.EqZx4fKZYQ3H6QzH5YQ3F2nY6gvE8.E',
    'master_admin',
    'Master Administrator',
    'admin@christuniversity.in',
    true
);

-- Insert sample floor
INSERT INTO floors (floor_name, floor_number, assigned_programs, description)
VALUES 
    ('Ground Floor - Commerce & Management', 0, ARRAY['Bachelor of Commerce', 'Bachelor of Business Administration'], 'Commerce and Business programs'),
    ('First Floor - Computer Science', 1, ARRAY['Bachelor of Computer Applications', 'BSc Computer Science'], 'Computer Science programs'),
    ('Second Floor - Arts & Sciences', 2, ARRAY['Bachelor of Arts', 'Bachelor of Science'], 'Arts and Science programs');

-- Insert sample volunteer
INSERT INTO users (username, password_hash, role, full_name, is_active)
VALUES (
    'volunteer1',
    '$2a$10$X5YvYkHq8YQ3F2nY6gvE8.EqZx4fKZYQ3H6QzH5YQ3F2nY6gvE8.E',
    'volunteer',
    'Volunteer User',
    true
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Master admin can manage all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'master_admin'
        )
    );

-- Policies for applicants (most permissive for now - refine based on needs)
CREATE POLICY "Allow all operations on applicants for authenticated users" ON applicants
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all operations on floors for authenticated users" ON floors
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all operations on panels for authenticated users" ON panels
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all operations on checkpoints for authenticated users" ON checkpoints
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all operations on sms_logs for authenticated users" ON sms_logs
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all operations on system_logs for authenticated users" ON system_logs
    FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE applicants IS 'Main table storing applicant information and status tracking';
COMMENT ON TABLE panels IS 'Interview panels with teacher pairs and floor assignments';
COMMENT ON TABLE floors IS 'Floor configuration with program assignments';
COMMENT ON TABLE checkpoints IS 'Audit trail for all checkpoints (arrival, verification, interview)';
COMMENT ON TABLE sms_logs IS 'Log of all SMS messages sent to applicants';
COMMENT ON COLUMN applicants.status IS 'Current status: REGISTERED -> ARRIVED -> DOCUMENT_VERIFIED -> INTERVIEW_IN_PROGRESS -> INTERVIEW_COMPLETED';
COMMENT ON COLUMN applicants.phone IS 'Phone number as stored in Excel (may have prefix/formatting - sanitize to last 10 digits for SMS)';

-- =====================================================
-- END OF SCHEMA
-- =====================================================
