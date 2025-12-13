
-- ============================================
-- NORMALIZED HOSPITAL DATABASE SCHEMA
-- ============================================

-- Drop existing tables if needed (in correct order due to foreign keys)
DROP TABLE IF EXISTS hospital_images CASCADE;
DROP TABLE IF EXISTS hospital_facilities CASCADE;
DROP TABLE IF EXISTS hospital_specialties CASCADE;
DROP TABLE IF EXISTS hospital_accreditations CASCADE;
DROP TABLE IF EXISTS facilities CASCADE;
DROP TABLE IF EXISTS specialties CASCADE;
DROP TABLE IF EXISTS accreditations CASCADE;
DROP TABLE IF EXISTS hospitals CASCADE;

-- ============================================
-- 1. HOSPITALS TABLE (Main Table)
-- ============================================
CREATE TABLE hospitals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    rating DECIMAL(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    discount VARCHAR(10),
    description TEXT,
    beds INTEGER,
    established INTEGER,
    operating_hours VARCHAR(100),
    emergency_available BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. SPECIALTIES TABLE (Lookup Table)
-- ============================================
CREATE TABLE specialties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. FACILITIES TABLE (Lookup Table)
-- ============================================
CREATE TABLE facilities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. ACCREDITATIONS TABLE (Lookup Table)
-- ============================================
CREATE TABLE accreditations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. HOSPITAL_SPECIALTIES (Many-to-Many)
-- ============================================
CREATE TABLE hospital_specialties (
    id SERIAL PRIMARY KEY,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    specialty_id INTEGER NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hospital_id, specialty_id)
);

-- ============================================
-- 6. HOSPITAL_FACILITIES (Many-to-Many)
-- ============================================
CREATE TABLE hospital_facilities (
    id SERIAL PRIMARY KEY,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    facility_id INTEGER NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    available_24x7 BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hospital_id, facility_id)
);

-- ============================================
-- 7. HOSPITAL_ACCREDITATIONS (Many-to-Many)
-- ============================================
CREATE TABLE hospital_accreditations (
    id SERIAL PRIMARY KEY,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    accreditation_id INTEGER NOT NULL REFERENCES accreditations(id) ON DELETE CASCADE,
    certified_date DATE,
    expiry_date DATE,
    certificate_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hospital_id, accreditation_id)
);

-- ============================================
-- 8. HOSPITAL_IMAGES (One-to-Many)
-- ============================================
CREATE TABLE hospital_images (
    id SERIAL PRIMARY KEY,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type VARCHAR(50) DEFAULT 'general' CHECK (image_type IN ('main', 'gallery', 'facility', 'exterior', 'interior')),
    title VARCHAR(255),
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_hospitals_name ON hospitals(name);
CREATE INDEX idx_hospitals_location ON hospitals(location);
CREATE INDEX idx_hospitals_rating ON hospitals(rating);
CREATE INDEX idx_hospitals_emergency ON hospitals(emergency_available);

CREATE INDEX idx_hospital_specialties_hospital ON hospital_specialties(hospital_id);
CREATE INDEX idx_hospital_specialties_specialty ON hospital_specialties(specialty_id);

CREATE INDEX idx_hospital_facilities_hospital ON hospital_facilities(hospital_id);
CREATE INDEX idx_hospital_facilities_facility ON hospital_facilities(facility_id);

CREATE INDEX idx_hospital_accreditations_hospital ON hospital_accreditations(hospital_id);
CREATE INDEX idx_hospital_accreditations_accreditation ON hospital_accreditations(accreditation_id);

CREATE INDEX idx_hospital_images_hospital ON hospital_images(hospital_id);
CREATE INDEX idx_hospital_images_type ON hospital_images(image_type);
CREATE INDEX idx_hospital_images_primary ON hospital_images(is_primary);

-- ============================================
-- INSERT LOOKUP DATA
-- ============================================

-- Insert Specialties
INSERT INTO specialties (name, description) VALUES
('Cardiology', 'Heart and cardiovascular system care'),
('Neurology', 'Brain and nervous system disorders'),
('Orthopedics', 'Bone, joint, and muscle treatments'),
('Pediatrics', 'Medical care for infants, children, and adolescents'),
('General Medicine', 'General health care and primary medicine'),
('Dermatology', 'Skin, hair, and nail conditions'),
('ENT', 'Ear, nose, and throat treatments'),
('Cardiac Surgery', 'Surgical procedures on the heart'),
('Interventional Cardiology', 'Minimally invasive cardiac procedures'),
('Neurosurgery', 'Surgical treatment of brain and nervous system'),
('Psychiatry', 'Mental health and psychological disorders'),
('Gynecology', 'Women''s reproductive health'),
('Obstetrics', 'Pregnancy and childbirth care'),
('Neonatology', 'Medical care for newborn infants');

-- Insert Facilities
INSERT INTO facilities (name, description) VALUES
('24/7 Emergency', 'Round-the-clock emergency medical services'),
('ICU', 'Intensive Care Unit for critical patients'),
('Blood Bank', 'Blood storage and transfusion services'),
('Pharmacy', 'In-house medication dispensary'),
('Ambulance', 'Emergency medical transportation'),
('Diagnostic Center', 'Medical testing and diagnostic services'),
('Operation Theater', 'Surgical operation facilities'),
('X-Ray', 'Radiography imaging services'),
('Ultrasound', 'Ultrasound imaging services'),
('Pathology Lab', 'Laboratory testing services'),
('Cafeteria', 'Food and beverage services'),
('OPD', 'Outpatient Department'),
('Consultation Rooms', 'Private consultation spaces'),
('Cath Lab', 'Cardiac catheterization laboratory'),
('CCU', 'Coronary Care Unit'),
('Cardiac Rehabilitation', 'Heart disease recovery programs'),
('MRI', 'Magnetic Resonance Imaging'),
('CT Scan', 'Computed Tomography scanning'),
('EEG Lab', 'Electroencephalography laboratory'),
('Neuro ICU', 'Neurological Intensive Care Unit'),
('NICU', 'Neonatal Intensive Care Unit'),
('Labor Room', 'Childbirth facilities'),
('Maternity Ward', 'Postnatal care ward'),
('Pediatric ICU', 'Pediatric Intensive Care Unit');

-- Insert Accreditations
INSERT INTO accreditations (name, full_name, description) VALUES
('NABH', 'National Accreditation Board for Hospitals & Healthcare Providers', 'Quality standards for hospitals in India'),
('JCI', 'Joint Commission International', 'International healthcare accreditation'),
('ISO 9001', 'ISO 9001:2015', 'International quality management standard');

-- ============================================
-- INSERT HOSPITAL DATA
-- ============================================

-- Hospital 1: City General Hospital
INSERT INTO hospitals (name, location, address, phone, email, rating, discount, description, beds, established, operating_hours, emergency_available)
VALUES (
    'City General Hospital',
    'Downtown, Mumbai',
    '123 Main Street, Downtown, Mumbai - 400001',
    '+91 98765 43210',
    'contact@citygeneral.com',
    4.5,
    '20%',
    'A leading multi-specialty hospital with state-of-the-art facilities and experienced medical professionals.',
    250,
    1985,
    '24/7',
    TRUE
);

-- Hospital 2: MediCare Plus
INSERT INTO hospitals (name, location, address, phone, email, rating, discount, description, beds, established, operating_hours, emergency_available)
VALUES (
    'MediCare Plus',
    'Andheri, Mumbai',
    '456 West Road, Andheri, Mumbai - 400053',
    '+91 98765 43211',
    'info@medicareplus.com',
    4.7,
    '30%',
    'Premier healthcare facility specializing in orthopedics and pediatric care with modern infrastructure.',
    180,
    1998,
    '24/7',
    TRUE
);

-- Hospital 3: HealthFirst Clinic
INSERT INTO hospitals (name, location, address, phone, email, rating, discount, description, beds, established, operating_hours, emergency_available)
VALUES (
    'HealthFirst Clinic',
    'Bandra, Mumbai',
    '789 Linking Road, Bandra, Mumbai - 400050',
    '+91 98765 43212',
    'support@healthfirst.com',
    4.3,
    '25%',
    'Comprehensive outpatient care center focused on preventive health and wellness programs.',
    50,
    2005,
    '8:00 AM - 10:00 PM',
    FALSE
);

-- Hospital 4: Apollo Heart Center
INSERT INTO hospitals (name, location, address, phone, email, rating, discount, description, beds, established, operating_hours, emergency_available)
VALUES (
    'Apollo Heart Center',
    'Powai, Mumbai',
    '321 Lake View, Powai, Mumbai - 400076',
    '+91 98765 43213',
    'info@apolloheart.com',
    4.9,
    '15%',
    'Specialized cardiac care center with world-class cardiologists and advanced cardiac technology.',
    120,
    2010,
    '24/7',
    TRUE
);

-- Hospital 5: Neuro Care Hospital
INSERT INTO hospitals (name, location, address, phone, email, rating, discount, description, beds, established, operating_hours, emergency_available)
VALUES (
    'Neuro Care Hospital',
    'Borivali, Mumbai',
    '654 National Park Road, Borivali, Mumbai - 400066',
    '+91 98765 43214',
    'contact@neurocare.com',
    4.6,
    '20%',
    'Leading neurological care facility with expert neurologists and advanced neuro-imaging.',
    100,
    2012,
    '24/7',
    TRUE
);

-- Hospital 6: Women & Child Hospital
INSERT INTO hospitals (name, location, address, phone, email, rating, discount, description, beds, established, operating_hours, emergency_available)
VALUES (
    'Women & Child Hospital',
    'Chembur, Mumbai',
    '987 Eastern Express Highway, Chembur, Mumbai - 400071',
    '+91 98765 43215',
    'info@womenandchild.com',
    4.4,
    '25%',
    'Dedicated to women''s health and pediatric care with compassionate and expert medical team.',
    150,
    2008,
    '24/7',
    TRUE
);

-- ============================================
-- INSERT HOSPITAL SPECIALTIES (Many-to-Many)
-- ============================================

-- City General Hospital Specialties
INSERT INTO hospital_specialties (hospital_id, specialty_id, is_primary)
SELECT 1, id, (name = 'Cardiology') FROM specialties WHERE name IN ('Cardiology', 'Neurology', 'Orthopedics');

-- MediCare Plus Specialties
INSERT INTO hospital_specialties (hospital_id, specialty_id, is_primary)
SELECT 2, id, (name = 'Orthopedics') FROM specialties WHERE name IN ('Orthopedics', 'Pediatrics', 'General Medicine');

-- HealthFirst Clinic Specialties
INSERT INTO hospital_specialties (hospital_id, specialty_id, is_primary)
SELECT 3, id, (name = 'General Medicine') FROM specialties WHERE name IN ('General Medicine', 'Dermatology', 'ENT');

-- Apollo Heart Center Specialties
INSERT INTO hospital_specialties (hospital_id, specialty_id, is_primary)
SELECT 4, id, (name = 'Cardiology') FROM specialties WHERE name IN ('Cardiology', 'Cardiac Surgery', 'Interventional Cardiology');

-- Neuro Care Hospital Specialties
INSERT INTO hospital_specialties (hospital_id, specialty_id, is_primary)
SELECT 5, id, (name = 'Neurology') FROM specialties WHERE name IN ('Neurology', 'Neurosurgery', 'Psychiatry');

-- Women & Child Hospital Specialties
INSERT INTO hospital_specialties (hospital_id, specialty_id, is_primary)
SELECT 6, id, (name = 'Gynecology') FROM specialties WHERE name IN ('Gynecology', 'Pediatrics', 'Obstetrics', 'Neonatology');

-- ============================================
-- INSERT HOSPITAL FACILITIES (Many-to-Many)
-- ============================================

-- City General Hospital Facilities
INSERT INTO hospital_facilities (hospital_id, facility_id, available_24x7)
SELECT 1, id, (name IN ('24/7 Emergency', 'ICU', 'Ambulance')) 
FROM facilities WHERE name IN ('24/7 Emergency', 'ICU', 'Blood Bank', 'Pharmacy', 'Ambulance', 'Diagnostic Center');

-- MediCare Plus Facilities
INSERT INTO hospital_facilities (hospital_id, facility_id, available_24x7)
SELECT 2, id, (name IN ('24/7 Emergency', 'Operation Theater')) 
FROM facilities WHERE name IN ('24/7 Emergency', 'Operation Theater', 'X-Ray', 'Ultrasound', 'Pathology Lab', 'Cafeteria');

-- HealthFirst Clinic Facilities
INSERT INTO hospital_facilities (hospital_id, facility_id, available_24x7)
SELECT 3, id, FALSE 
FROM facilities WHERE name IN ('OPD', 'Diagnostic Center', 'Pharmacy', 'Consultation Rooms');

-- Apollo Heart Center Facilities
INSERT INTO hospital_facilities (hospital_id, facility_id, available_24x7)
SELECT 4, id, (name IN ('24/7 Emergency', 'Cath Lab', 'ICU', 'CCU')) 
FROM facilities WHERE name IN ('24/7 Emergency', 'Cath Lab', 'ICU', 'CCU', 'Cardiac Rehabilitation');

-- Neuro Care Hospital Facilities
INSERT INTO hospital_facilities (hospital_id, facility_id, available_24x7)
SELECT 5, id, (name IN ('24/7 Emergency', 'MRI', 'CT Scan', 'Neuro ICU')) 
FROM facilities WHERE name IN ('24/7 Emergency', 'MRI', 'CT Scan', 'EEG Lab', 'Neuro ICU');

-- Women & Child Hospital Facilities
INSERT INTO hospital_facilities (hospital_id, facility_id, available_24x7)
SELECT 6, id, (name IN ('24/7 Emergency', 'NICU', 'Pediatric ICU')) 
FROM facilities WHERE name IN ('24/7 Emergency', 'NICU', 'Labor Room', 'Maternity Ward', 'Pediatric ICU');

-- ============================================
-- INSERT HOSPITAL ACCREDITATIONS (Many-to-Many)
-- ============================================

-- City General Hospital Accreditations
INSERT INTO hospital_accreditations (hospital_id, accreditation_id, certified_date)
SELECT 1, id, '2020-01-01' FROM accreditations WHERE name IN ('NABH', 'JCI', 'ISO 9001');

-- MediCare Plus Accreditations
INSERT INTO hospital_accreditations (hospital_id, accreditation_id, certified_date)
SELECT 2, id, '2019-06-01' FROM accreditations WHERE name IN ('NABH', 'ISO 9001');

-- HealthFirst Clinic Accreditations
INSERT INTO hospital_accreditations (hospital_id, accreditation_id, certified_date)
SELECT 3, id, '2018-03-01' FROM accreditations WHERE name = 'ISO 9001';

-- Apollo Heart Center Accreditations
INSERT INTO hospital_accreditations (hospital_id, accreditation_id, certified_date)
SELECT 4, id, '2021-01-01' FROM accreditations WHERE name IN ('NABH', 'JCI', 'ISO 9001');

-- Neuro Care Hospital Accreditations
INSERT INTO hospital_accreditations (hospital_id, accreditation_id, certified_date)
SELECT 5, id, '2019-09-01' FROM accreditations WHERE name IN ('NABH', 'ISO 9001');

-- Women & Child Hospital Accreditations
INSERT INTO hospital_accreditations (hospital_id, accreditation_id, certified_date)
SELECT 6, id, '2020-05-01' FROM accreditations WHERE name IN ('NABH', 'ISO 9001');

-- ============================================
-- INSERT HOSPITAL IMAGES (One-to-Many)
-- ============================================

-- City General Hospital Images
INSERT INTO hospital_images (hospital_id, image_url, image_type, is_primary, display_order)
VALUES 
(1, 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800', 'main', TRUE, 1),
(1, 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800', 'exterior', FALSE, 2),
(1, 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800', 'interior', FALSE, 3);

-- MediCare Plus Images
INSERT INTO hospital_images (hospital_id, image_url, image_type, is_primary, display_order)
VALUES 
(2, 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800', 'main', TRUE, 1),
(2, 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800', 'facility', FALSE, 2);

-- HealthFirst Clinic Images
INSERT INTO hospital_images (hospital_id, image_url, image_type, is_primary, display_order)
VALUES 
(3, 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800', 'main', TRUE, 1);

-- Apollo Heart Center Images
INSERT INTO hospital_images (hospital_id, image_url, image_type, is_primary, display_order)
VALUES 
(4, 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800', 'main', TRUE, 1),
(4, 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800', 'facility', FALSE, 2);

-- Neuro Care Hospital Images
INSERT INTO hospital_images (hospital_id, image_url, image_type, is_primary, display_order)
VALUES 
(5, 'https://images.unsplash.com/photo-1581594549595-35f6edc7b762?w=800', 'main', TRUE, 1);

-- Women & Child Hospital Images
INSERT INTO hospital_images (hospital_id, image_url, image_type, is_primary, display_order)
VALUES 
(6, 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800', 'main', TRUE, 1),
(6, 'https://images.unsplash.com/photo-1631217872994-8ecbb7a2e3a6?w=800', 'interior', FALSE, 2);

-- ============================================
-- USEFUL QUERIES TO RETRIEVE DATA
-- ============================================

-- Get hospital with all related data
COMMENT ON TABLE hospitals IS 'Query to get complete hospital data:
SELECT 
    h.*,
    array_agg(DISTINCT s.name) as specialties,
    array_agg(DISTINCT f.name) as facilities,
    array_agg(DISTINCT a.name) as accreditations,
    (SELECT image_url FROM hospital_images WHERE hospital_id = h.id AND is_primary = TRUE LIMIT 1) as primary_image
FROM hospitals h
LEFT JOIN hospital_specialties hs ON h.id = hs.hospital_id
LEFT JOIN specialties s ON hs.specialty_id = s.id
LEFT JOIN hospital_facilities hf ON h.id = hf.hospital_id
LEFT JOIN facilities f ON hf.facility_id = f.id
LEFT JOIN hospital_accreditations ha ON h.id = ha.hospital_id
LEFT JOIN accreditations a ON ha.accreditation_id = a.id
GROUP BY h.id;';

-- ============================================
-- END OF SCHEMA
-- ============================================