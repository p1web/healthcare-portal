-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL CHECK (role IN ('patient', 'doctor', 'hospital', 'admin')),
    verified BOOLEAN DEFAULT FALSE,
    avatar VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    rating DECIMAL(2,1) DEFAULT 0.0,
    specialties TEXT[],
    discount VARCHAR(10),
    description TEXT,
    facilities TEXT[],
    beds INTEGER,
    established INTEGER,
    accreditations TEXT[],
    operating_hours VARCHAR(100),
    emergency_available BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    hospital_id INTEGER REFERENCES hospitals(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    hospital VARCHAR(255),
    experience VARCHAR(50),
    rating DECIMAL(2,1) DEFAULT 0.0,
    fee VARCHAR(50),
    available VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    about TEXT,
    education TEXT[],
    languages TEXT[],
    awards TEXT[],
    consultation_types TEXT[],
    next_available DATE,
    total_patients INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    patient_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    coupon_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discount VARCHAR(20),
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2),
    min_amount DECIMAL(10,2),
    max_discount DECIMAL(10,2),
    valid_from DATE,
    valid_until DATE,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    applicable_for VARCHAR(50),
    hospitals TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    terms TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_doctors_specialization ON doctors(specialization);
CREATE INDEX idx_doctors_hospital ON doctors(hospital);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_coupons_code ON coupons(code);

-- Insert sample data
INSERT INTO users (email, password, name, phone, role, verified) VALUES
('admin@healthcare.com', '$2a$10$XQZ9Z9Z9Z9Z9Z9Z9Z9Z9Z.', 'Admin User', '+91 98765 43210', 'admin', TRUE),
('patient@test.com', '$2a$10$XQZ9Z9Z9Z9Z9Z9Z9Z9Z9Z.', 'Test Patient', '+91 98765 43211', 'patient', TRUE);

COMMENT ON TABLE users IS 'Stores all user accounts';
COMMENT ON TABLE hospitals IS 'Stores hospital information';
COMMENT ON TABLE doctors IS 'Stores doctor profiles';
COMMENT ON TABLE appointments IS 'Stores appointment bookings';
COMMENT ON TABLE coupons IS 'Stores discount coupons';