-- Add this to your existing hospital_management database

USE hospital_management;

-- Doctors Table (normalized - references hospitals and specialties)
CREATE TABLE doctors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    specialty_id INT NOT NULL,
    hospital_id INT NOT NULL,
    experience INT NOT NULL COMMENT 'Years of experience',
    rating DECIMAL(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
    fee DECIMAL(10,2) NOT NULL COMMENT 'Consultation fee',
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    qualification VARCHAR(255) NOT NULL,
    bio TEXT,
    image VARCHAR(500),
    consultation_duration INT DEFAULT 30 COMMENT 'Duration in minutes',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
    FOREIGN KEY (specialty_id) REFERENCES specialties(id) ON DELETE RESTRICT,
    INDEX idx_name (name),
    INDEX idx_specialty (specialty_id),
    INDEX idx_hospital (hospital_id),
    INDEX idx_rating (rating)
);

-- Doctor Availability Table
CREATE TABLE doctor_availability (
    id INT PRIMARY KEY AUTO_INCREMENT,
    doctor_id INT NOT NULL,
    day_of_week TINYINT NOT NULL COMMENT '0=Sunday, 1=Monday, ..., 6=Saturday',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    UNIQUE KEY unique_doctor_day (doctor_id, day_of_week),
    INDEX idx_doctor (doctor_id),
    INDEX idx_day (day_of_week)
);

-- Insert Sample Doctors
INSERT INTO doctors (name, specialty_id, hospital_id, experience, rating, fee, email, phone, qualification, bio, image, consultation_duration) VALUES
('Dr. Rajesh Kumar', 1, 1, 15, 4.8, 1000, 'rajesh.kumar@citygeneral.com', '+91 98765 00001', 'MBBS, MD (Cardiology), DM', 'Experienced cardiologist specializing in interventional cardiology and heart disease management.', 'https://via.placeholder.com/300x300', 30),
('Dr. Priya Sharma', 4, 2, 10, 4.6, 800, 'priya.sharma@medicareplus.com', '+91 98765 00002', 'MBBS, MD (Pediatrics)', 'Dedicated pediatrician with expertise in child healthcare and vaccination.', 'https://via.placeholder.com/300x300', 20),
('Dr. Amit Patel', 3, 2, 12, 4.7, 1200, 'amit.patel@medicareplus.com', '+91 98765 00003', 'MBBS, MS (Orthopedics)', 'Specialist in joint replacement surgeries and sports medicine.', 'https://via.placeholder.com/300x300', 30),
('Dr. Sneha Desai', 6, 3, 8, 4.5, 900, 'sneha.desai@healthfirst.com', '+91 98765 00004', 'MBBS, MD (Dermatology)', 'Expert in skin treatments, cosmetic dermatology, and laser therapy.', 'https://via.placeholder.com/300x300', 25),
('Dr. Vikram Singh', 2, 5, 18, 4.9, 1500, 'vikram.singh@neurocare.com', '+91 98765 00005', 'MBBS, MD, DM (Neurology)', 'Leading neurologist specializing in stroke management and epilepsy treatment.', 'https://via.placeholder.com/300x300', 40),
('Dr. Kavita Menon', 12, 6, 14, 4.7, 1100, 'kavita.menon@womenandchild.com', '+91 98765 00006', 'MBBS, MS (Gynecology)', 'Experienced gynecologist specializing in high-risk pregnancies and laparoscopic surgeries.', 'https://via.placeholder.com/300x300', 30),
('Dr. Arjun Reddy', 8, 4, 20, 4.9, 2000, 'arjun.reddy@apolloheart.com', '+91 98765 00007', 'MBBS, MS, MCh (Cardiac Surgery)', 'Renowned cardiac surgeon with expertise in complex heart surgeries.', 'https://via.placeholder.com/300x300', 45),
('Dr. Neha Gupta', 4, 6, 9, 4.6, 850, 'neha.gupta@womenandchild.com', '+91 98765 00008', 'MBBS, MD (Pediatrics)', 'Caring pediatrician specializing in neonatal care and child nutrition.', 'https://via.placeholder.com/300x300', 20),
('Dr. Suresh Iyer', 7, 3, 11, 4.4, 750, 'suresh.iyer@healthfirst.com', '+91 98765 00009', 'MBBS, MS (ENT)', 'ENT specialist with expertise in ear surgeries and voice disorders.', 'https://via.placeholder.com/300x300', 25),
('Dr. Ananya Krishnan', 10, 5, 16, 4.8, 1400, 'ananya.krishnan@neurocare.com', '+91 98765 00010', 'MBBS, MS, MCh (Neurosurgery)', 'Expert neurosurgeon specializing in brain and spine surgeries.', 'https://via.placeholder.com/300x300', 40);

-- Insert Doctor Availability (Sample Schedule)
-- Dr. Rajesh Kumar (ID: 1) - Mon-Fri
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) VALUES
(1, 1, '09:00:00', '17:00:00'), -- Monday
(1, 2, '09:00:00', '17:00:00'), -- Tuesday
(1, 3, '09:00:00', '17:00:00'), -- Wednesday
(1, 4, '09:00:00', '17:00:00'), -- Thursday
(1, 5, '09:00:00', '17:00:00'); -- Friday

-- Dr. Priya Sharma (ID: 2) - Tue-Sat
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) VALUES
(2, 2, '10:00:00', '18:00:00'), -- Tuesday
(2, 3, '10:00:00', '18:00:00'), -- Wednesday
(2, 4, '10:00:00', '18:00:00'), -- Thursday
(2, 5, '10:00:00', '18:00:00'), -- Friday
(2, 6, '10:00:00', '14:00:00'); -- Saturday

-- Dr. Amit Patel (ID: 3) - Mon-Sat
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) VALUES
(3, 1, '08:00:00', '16:00:00'), -- Monday
(3, 2, '08:00:00', '16:00:00'), -- Tuesday
(3, 3, '08:00:00', '16:00:00'), -- Wednesday
(3, 4, '08:00:00', '16:00:00'), -- Thursday
(3, 5, '08:00:00', '16:00:00'), -- Friday
(3, 6, '08:00:00', '13:00:00'); -- Saturday

-- Dr. Sneha Desai (ID: 4) - Wed-Sun
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) VALUES
(4, 3, '11:00:00', '19:00:00'), -- Wednesday
(4, 4, '11:00:00', '19:00:00'), -- Thursday
(4, 5, '11:00:00', '19:00:00'), -- Friday
(4, 6, '11:00:00', '19:00:00'), -- Saturday
(4, 0, '10:00:00', '15:00:00'); -- Sunday

-- Dr. Vikram Singh (ID: 5) - Mon-Fri
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) VALUES
(5, 1, '09:00:00', '18:00:00'),
(5, 2, '09:00:00', '18:00:00'),
(5, 3, '09:00:00', '18:00:00'),
(5, 4, '09:00:00', '18:00:00'),
(5, 5, '09:00:00', '18:00:00');

-- Dr. Kavita Menon (ID: 6) - Mon-Sat
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) VALUES
(6, 1, '10:00:00', '17:00:00'),
(6, 2, '10:00:00', '17:00:00'),
(6, 3, '10:00:00', '17:00:00'),
(6, 4, '10:00:00', '17:00:00'),
(6, 5, '10:00:00', '17:00:00'),
(6, 6, '10:00:00', '14:00:00');

-- Dr. Arjun Reddy (ID: 7) - Mon-Fri
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) VALUES
(7, 1, '08:00:00', '16:00:00'),
(7, 2, '08:00:00', '16:00:00'),
(7, 3, '08:00:00', '16:00:00'),
(7, 4, '08:00:00', '16:00:00'),
(7, 5, '08:00:00', '16:00:00');

-- Dr. Neha Gupta (ID: 8) - Tue-Sat
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) VALUES
(8, 2, '09:00:00', '17:00:00'),
(8, 3, '09:00:00', '17:00:00'),
(8, 4, '09:00:00', '17:00:00'),
(8, 5, '09:00:00', '17:00:00'),
(8, 6, '09:00:00', '13:00:00');

-- Dr. Suresh Iyer (ID: 9) - Mon-Sat
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) VALUES
(9, 1, '10:00:00', '18:00:00'),
(9, 2, '10:00:00', '18:00:00'),
(9, 3, '10:00:00', '18:00:00'),
(9, 4, '10:00:00', '18:00:00'),
(9, 5, '10:00:00', '18:00:00'),
(9, 6, '10:00:00', '14:00:00');

-- Dr. Ananya Krishnan (ID: 10) - Mon-Fri
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) VALUES
(10, 1, '08:00:00', '17:00:00'),
(10, 2, '08:00:00', '17:00:00'),
(10, 3, '08:00:00', '17:00:00'),
(10, 4, '08:00:00', '17:00:00'),
(10, 5, '08:00:00', '17:00:00');

-- Create useful views for common queries

-- View: Doctors with full details
CREATE OR REPLACE VIEW vw_doctors_full AS
SELECT 
    d.id,
    d.name,
    d.experience,
    d.rating,
    d.fee,
    d.email,
    d.phone,
    d.qualification,
    d.bio,
    d.image,
    d.consultation_duration,
    s.name AS specialization,
    h.name AS hospital,
    h.location AS hospital_location,
    GROUP_CONCAT(
        DISTINCT CASE da.day_of_week
            WHEN 0 THEN 'Sun'
            WHEN 1 THEN 'Mon'
            WHEN 2 THEN 'Tue'
            WHEN 3 THEN 'Wed'
            WHEN 4 THEN 'Thu'
            WHEN 5 THEN 'Fri'
            WHEN 6 THEN 'Sat'
        END
        ORDER BY da.day_of_week
    ) AS available_days
FROM doctors d
INNER JOIN specialties s ON d.specialty_id = s.id
INNER JOIN hospitals h ON d.hospital_id = h.id
LEFT JOIN doctor_availability da ON d.doctor_id = da.doctor_id AND da.is_available = true
WHERE d.is_active = true
GROUP BY d.id, d.name, d.experience, d.rating, d.fee, d.email, d.phone, 
         d.qualification, d.bio, d.image, d.consultation_duration, 
         s.name, h.name, h.location;