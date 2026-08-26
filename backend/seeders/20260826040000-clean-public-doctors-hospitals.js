'use strict';
const bcrypt = require('bcrypt');

// Wipes existing test doctors/hospitals and inserts a clean set of 5 doctors + 5 hospitals
// (verificationStatus=approved, users active) so the public portal shows exactly 5 of each.

const HOSPITAL_USERS = [
  {
    name: 'Apollo Bay Hospital Admin',
    email: 'admin@apollobay.example',
    phone: '02241001001',
    address: '10 Marine Drive',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400020'
  },
  {
    name: 'Fortis Green Valley Admin',
    email: 'admin@fortisgv.example',
    phone: '08041002002',
    address: '221 MG Road',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001'
  },
  {
    name: 'Sunrise Children\'s Hospital Admin',
    email: 'admin@sunrisechild.example',
    phone: '02041003003',
    address: '8 Kalyani Nagar',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411006'
  },
  {
    name: 'HeartCare Cardiac Institute Admin',
    email: 'admin@heartcare.example',
    phone: '01141004004',
    address: '77 Connaught Place',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001'
  },
  {
    name: 'Wellness Multispeciality Clinic Admin',
    email: 'admin@wellnessmulti.example',
    phone: '04041005005',
    address: '55 Banjara Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500034'
  }
];

const HOSPITAL_PROFILES = [
  {
    hospital_name: 'Apollo Bay Hospital',
    hospital_email: 'care@apollobay.example',
    hospital_phone: '02241001100',
    emergency_contact_number: '02241001911',
    hospital_address: '10 Marine Drive, Nariman Point',
    hospital_city: 'Mumbai',
    hospital_state: 'Maharashtra',
    hospital_pincode: '400020',
    website: 'https://www.apollobay.example',
    registration_number: 'HOSP-MH-101',
    specialty_ids: JSON.stringify([1, 3, 5, 8]),
    established_year: 1988,
    total_beds: 350,
    hospital_type: 'private',
    operating_hours: '24/7',
    emergency_services: true,
    ambulance_services: true,
    rating: 4.7,
    bio: 'Apollo Bay Hospital is a leading multispeciality tertiary care hospital in Mumbai offering advanced cardiac, orthopedic and critical care services with 24x7 emergency and ambulance support.'
  },
  {
    hospital_name: 'Fortis Green Valley',
    hospital_email: 'contact@fortisgv.example',
    hospital_phone: '08041002200',
    emergency_contact_number: '08041002911',
    hospital_address: '221 MG Road, Ashok Nagar',
    hospital_city: 'Bangalore',
    hospital_state: 'Karnataka',
    hospital_pincode: '560001',
    website: 'https://www.fortisgreenvalley.example',
    registration_number: 'HOSP-KA-102',
    specialty_ids: JSON.stringify([1, 2, 5, 7]),
    established_year: 1995,
    total_beds: 280,
    hospital_type: 'private',
    operating_hours: '24/7',
    emergency_services: true,
    ambulance_services: true,
    rating: 4.6,
    bio: 'Fortis Green Valley delivers world-class neurology, cardiology and internal medicine care in the heart of Bangalore with dedicated ICU and stroke units.'
  },
  {
    hospital_name: 'Sunrise Children\'s Hospital',
    hospital_email: 'info@sunrisechild.example',
    hospital_phone: '02041003300',
    emergency_contact_number: '02041003911',
    hospital_address: '8 Kalyani Nagar, Near North Main Road',
    hospital_city: 'Pune',
    hospital_state: 'Maharashtra',
    hospital_pincode: '411006',
    website: 'https://www.sunrisechild.example',
    registration_number: 'HOSP-MH-103',
    specialty_ids: JSON.stringify([4, 14]),
    established_year: 2001,
    total_beds: 120,
    hospital_type: 'private',
    operating_hours: '24/7',
    emergency_services: true,
    ambulance_services: true,
    rating: 4.8,
    bio: 'Sunrise Children\'s Hospital specialises in paediatric and neonatal care, offering NICU, PICU and paediatric surgery under one roof.'
  },
  {
    hospital_name: 'HeartCare Cardiac Institute',
    hospital_email: 'care@heartcare.example',
    hospital_phone: '01141004400',
    emergency_contact_number: '01141004911',
    hospital_address: '77 Connaught Place, Central Delhi',
    hospital_city: 'New Delhi',
    hospital_state: 'Delhi',
    hospital_pincode: '110001',
    website: 'https://www.heartcare.example',
    registration_number: 'HOSP-DL-104',
    specialty_ids: JSON.stringify([1, 8, 9]),
    established_year: 2005,
    total_beds: 90,
    hospital_type: 'private',
    operating_hours: '24/7',
    emergency_services: true,
    ambulance_services: true,
    rating: 4.9,
    bio: 'HeartCare Cardiac Institute is a super-speciality cardiac hospital offering interventional cardiology, cardiac surgery and 24x7 cath-lab services.'
  },
  {
    hospital_name: 'Wellness Multispeciality Clinic',
    hospital_email: 'hello@wellnessmulti.example',
    hospital_phone: '04041005500',
    emergency_contact_number: '04041005911',
    hospital_address: '55 Banjara Hills, Road No. 3',
    hospital_city: 'Hyderabad',
    hospital_state: 'Telangana',
    hospital_pincode: '500034',
    website: 'https://www.wellnessmulti.example',
    registration_number: 'HOSP-TG-105',
    specialty_ids: JSON.stringify([5, 6, 7, 12]),
    established_year: 2010,
    total_beds: 160,
    hospital_type: 'private',
    operating_hours: '08:00 - 22:00',
    emergency_services: true,
    ambulance_services: false,
    rating: 4.5,
    bio: 'Wellness Multispeciality Clinic offers dermatology, ENT, gynaecology and general medicine day-care services with a modern out-patient experience.'
  }
];

const DOCTOR_USERS = [
  {
    name: 'Dr. Priya Menon',
    email: 'priya.menon@heartcare.example',
    phone: '9812345601',
    gender: 'female',
    date_of_birth: new Date('1978-03-14'),
    address: 'Doctors Enclave, Connaught Place',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001'
  },
  {
    name: 'Dr. Rohan Kapoor',
    email: 'rohan.kapoor@wellnessmulti.example',
    phone: '9812345602',
    gender: 'male',
    date_of_birth: new Date('1984-07-22'),
    address: 'Banjara Hills, Road No. 5',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500034'
  },
  {
    name: 'Dr. Anjali Rao',
    email: 'anjali.rao@sunrisechild.example',
    phone: '9812345603',
    gender: 'female',
    date_of_birth: new Date('1982-11-05'),
    address: 'Kalyani Nagar',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411006'
  },
  {
    name: 'Dr. Vikram Singh',
    email: 'vikram.singh@apollobay.example',
    phone: '9812345604',
    gender: 'male',
    date_of_birth: new Date('1975-01-30'),
    address: 'Marine Drive Residency',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400020'
  },
  {
    name: 'Dr. Sneha Reddy',
    email: '  ',
    phone: '9812345605',
    gender: 'female',
    date_of_birth: new Date('1980-09-18'),
    address: 'MG Road, Ashok Nagar',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001'
  }
];

// hospitalIdx is the 0-based index into HOSPITAL_PROFILES that this doctor is linked to.
const DOCTOR_PROFILES = [
  {
    hospitalIdx: 3, // HeartCare
    specialization_id: 1, // Cardiology
    registration_number: 'DOC-DL-201',
    qualification: 'MBBS, MD (Cardiology), DM (Interventional Cardiology)',
    years_of_experience: 15,
    consultation_fee: 1500.00
  },
  {
    hospitalIdx: 4, // Wellness Multi
    specialization_id: 6, // Dermatology
    registration_number: 'DOC-TG-202',
    qualification: 'MBBS, MD (Dermatology)',
    years_of_experience: 10,
    consultation_fee: 900.00
  },
  {
    hospitalIdx: 2, // Sunrise Children's
    specialization_id: 4, // Pediatrics
    registration_number: 'DOC-MH-203',
    qualification: 'MBBS, MD (Pediatrics), Fellowship in Neonatology',
    years_of_experience: 12,
    consultation_fee: 800.00
  },
  {
    hospitalIdx: 0, // Apollo Bay
    specialization_id: 3, // Orthopedics
    registration_number: 'DOC-MH-204',
    qualification: 'MBBS, MS (Orthopedics), Fellowship in Joint Replacement',
    years_of_experience: 18,
    consultation_fee: 1300.00
  },
  {
    hospitalIdx: 1, // Fortis Green Valley
    specialization_id: 2, // Neurology
    registration_number: 'DOC-KA-205',
    qualification: 'MBBS, MD (Medicine), DM (Neurology)',
    years_of_experience: 14,
    consultation_fee: 1400.00
  }
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const uploadedAt = now.toISOString();
    const hashedPassword = await bcrypt.hash('password123', 10);
    const emails = {
      hospitals: HOSPITAL_USERS.map(u => u.email),
      doctors: DOCTOR_USERS.map(u => u.email)
    };

    // Wipe existing doctor/hospital data (FK cascades take care of profiles/availability/appointments).
    await queryInterface.sequelize.query(
      `DELETE FROM users WHERE role IN ('doctor', 'hospital');`
    );

    // Insert hospital users.
    await queryInterface.bulkInsert('users', HOSPITAL_USERS.map(u => ({
      name: u.name,
      email: u.email,
      phone: u.phone,
      password: hashedPassword,
      role: 'hospital',
      is_email_verified: true,
      is_phone_verified: true,
      address: u.address,
      city: u.city,
      state: u.state,
      pincode: u.pincode,
      is_active: true,
      terms_accepted_at: now,
      created_at: now,
      updated_at: now
    })));

    const [hospitalUserRows] = await queryInterface.sequelize.query(
      `SELECT id, email FROM users WHERE email IN (:emails);`,
      { replacements: { emails: emails.hospitals } }
    );
    const hospitalUserIdByEmail = new Map(hospitalUserRows.map(r => [r.email, r.id]));

    await queryInterface.bulkInsert('hospital_profiles', HOSPITAL_PROFILES.map((profile, idx) => ({
      user_id: hospitalUserIdByEmail.get(HOSPITAL_USERS[idx].email),
      hospital_name: profile.hospital_name,
      hospital_email: profile.hospital_email,
      hospital_phone: profile.hospital_phone,
      emergency_contact_number: profile.emergency_contact_number,
      hospital_address: profile.hospital_address,
      hospital_city: profile.hospital_city,
      hospital_state: profile.hospital_state,
      hospital_pincode: profile.hospital_pincode,
      website: profile.website,
      registration_number: profile.registration_number,
      specialty_ids: profile.specialty_ids,
      established_year: profile.established_year,
      total_beds: profile.total_beds,
      hospital_type: profile.hospital_type,
      operating_hours: profile.operating_hours,
      emergency_services: profile.emergency_services,
      ambulance_services: profile.ambulance_services,
      rating: profile.rating,
      bio: profile.bio,
      is_verified: true,
      verification_status: 'approved',
      submitted_at: now,
      reviewed_at: now,
      last_verified_at: now,
      verification_documents: JSON.stringify([
        { name: `${profile.registration_number}-license.pdf`, url: `https://example.com/docs/${profile.registration_number}-license.pdf`, uploadedAt },
        { name: `${profile.registration_number}-registration.pdf`, url: `https://example.com/docs/${profile.registration_number}-registration.pdf`, uploadedAt }
      ]),
      created_at: now,
      updated_at: now
    })));

    const [hospitalProfileRows] = await queryInterface.sequelize.query(
      `SELECT id, registration_number FROM hospital_profiles WHERE registration_number IN (:regs);`,
      { replacements: { regs: HOSPITAL_PROFILES.map(p => p.registration_number) } }
    );
    const hospitalProfileIdByReg = new Map(hospitalProfileRows.map(r => [r.registration_number, r.id]));
    const hospitalProfileIds = HOSPITAL_PROFILES.map(p => hospitalProfileIdByReg.get(p.registration_number));

    // Insert doctor users.
    await queryInterface.bulkInsert('users', DOCTOR_USERS.map(u => ({
      name: u.name,
      email: u.email,
      phone: u.phone,
      password: hashedPassword,
      role: 'doctor',
      is_email_verified: true,
      is_phone_verified: true,
      gender: u.gender,
      date_of_birth: u.date_of_birth,
      address: u.address,
      city: u.city,
      state: u.state,
      pincode: u.pincode,
      is_active: true,
      terms_accepted_at: now,
      created_at: now,
      updated_at: now
    })));

    const [doctorUserRows] = await queryInterface.sequelize.query(
      `SELECT id, email FROM users WHERE email IN (:emails);`,
      { replacements: { emails: emails.doctors } }
    );
    const doctorUserIdByEmail = new Map(doctorUserRows.map(r => [r.email, r.id]));

    await queryInterface.bulkInsert('doctor_profiles', DOCTOR_PROFILES.map((profile, idx) => ({
      user_id: doctorUserIdByEmail.get(DOCTOR_USERS[idx].email),
      hospital_id: hospitalProfileIds[profile.hospitalIdx],
      registration_number: profile.registration_number,
      qualification: profile.qualification,
      specialization_id: profile.specialization_id,
      years_of_experience: profile.years_of_experience,
      consultation_fee: profile.consultation_fee,
      is_verified: true,
      verification_status: 'approved',
      submitted_at: now,
      reviewed_at: now,
      last_verified_at: now,
      verification_documents: JSON.stringify([
        { name: `${profile.registration_number}-degree.pdf`, url: `https://example.com/docs/${profile.registration_number}-degree.pdf`, uploadedAt },
        { name: `${profile.registration_number}-registration.pdf`, url: `https://example.com/docs/${profile.registration_number}-registration.pdf`, uploadedAt }
      ]),
      created_at: now,
      updated_at: now
    })));

    const [doctorProfileRows] = await queryInterface.sequelize.query(
      `SELECT id, registration_number FROM doctor_profiles WHERE registration_number IN (:regs);`,
      { replacements: { regs: DOCTOR_PROFILES.map(p => p.registration_number) } }
    );
    const doctorProfileIdByReg = new Map(doctorProfileRows.map(r => [r.registration_number, r.id]));

    // Availability: Mon-Fri 09:00 - 17:00 for every doctor.
    const availability = [];
    for (const profile of DOCTOR_PROFILES) {
      const doctorProfileId = doctorProfileIdByReg.get(profile.registration_number);
      for (let day = 1; day <= 5; day++) {
        availability.push({
          doctor_profile_id: doctorProfileId,
          day_of_week: day,
          start_time: '09:00:00',
          end_time: '17:00:00',
          is_available: true,
          created_at: now,
          updated_at: now
        });
      }
    }
    await queryInterface.bulkInsert('doctor_availability', availability);
  },

  async down(queryInterface, Sequelize) {
    // Reversal simply removes the exact users this seeder created;
    // FK cascades will delete their profiles, availability and appointments.
    await queryInterface.sequelize.query(
      `DELETE FROM users WHERE email IN (:emails);`,
      { replacements: { emails: [...HOSPITAL_USERS.map(u => u.email), ...DOCTOR_USERS.map(u => u.email)] } }
    );
  }
};
