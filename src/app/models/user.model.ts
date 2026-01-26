export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'patient' | 'doctor' | 'hospital' | 'admin';
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  isActive?: boolean;
  isBlocked?: boolean;
  createdAt?: string;
  updatedAt?: string;
  patientProfile?: PatientProfile | null;
  doctorProfile?: DoctorProfile | null;
  hospitalProfile?: HospitalProfile | null;
}

export interface PatientProfile {
  bloodGroup?: string;
  height?: string;
  weight?: string;
  allergies?: string[];
  medicalConditions?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
}

export interface DoctorProfile {
  registrationNumber?: string;
  qualification?: string;
  specializationId?: number;
  yearsOfExperience?: number;
  consultationFee?: number;
  isVerified?: boolean;
  verificationDocuments?: string[];
}

export interface HospitalProfile {
  id?: number;
  userId?: number;
  hospitalId?: number;
  registrationNumber?: string;
  establishedYear?: number;
  totalBeds?: number;
  hospitalType?: 'private' | 'government' | 'charity' | 'clinic';
  operatingHours?: string;
  emergencyServices?: boolean;
  ambulanceServices?: boolean;
  isVerified?: boolean;
  verificationDocuments?: string[];
  createdAt?: string;
  updatedAt?: string;
}


export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}
