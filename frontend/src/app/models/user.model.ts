import { PatientAllergy, PatientMedicalCondition } from './patient-medical-record.model';

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
  profileImage?: string | null;
  isActive?: boolean;
  isBlocked?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
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
  allergies?: PatientAllergy[];
  medicalConditions?: PatientMedicalCondition[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
}

export interface VerificationDocument {
  name: string;
  url: string;
  uploadedAt: string;
}

export interface DoctorAvailability {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export type ProfileReviewStatus = 'draft' | 'submitted' | 'under_review' | 'changes_requested' | 'approved' | 'rejected' | 'suspended';

export interface ProfileReviewer {
  id: number;
  name: string;
  email: string;
}

export interface DoctorProfile {
  id?: number;
  hospitalId?: number;
  registrationNumber?: string;
  qualification?: string;
  specializationId?: number;
  yearsOfExperience?: number;
  consultationFee?: number;
  isVerified?: boolean;
  verificationStatus?: ProfileReviewStatus;
  verificationDocuments?: VerificationDocument[];
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedByUserId?: number | null;
  reviewedBy?: ProfileReviewer | null;
  reviewNotes?: string | null;
  rejectionReason?: string | null;
  lastVerifiedAt?: string | null;
  availability?: DoctorAvailability[];
  availabilities?: Array<{
    id?: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
  }>;
}

export interface HospitalProfile {
  id?: number;
  userId?: number;
  hospitalId?: number;
  hospitalName?: string;
  hospitalEmail?: string;
  hospitalPhone?: string;
  emergencyContactNumber?: string;
  hospitalAddress?: string;
  hospitalCity?: string;
  hospitalState?: string;
  hospitalPincode?: string;
  website?: string;
  registrationNumber?: string;
  bio?: string;
  specialtyIds?: number[];
  establishedYear?: number;
  totalBeds?: number;
  hospitalType?: 'private' | 'government' | 'charity' | 'clinic';
  operatingHours?: string;
  emergencyServices?: boolean;
  ambulanceServices?: boolean;
  defaultConsultationFee?: number;
  isVerified?: boolean;
  verificationStatus?: ProfileReviewStatus;
  verificationDocuments?: VerificationDocument[];
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedByUserId?: number | null;
  reviewedBy?: ProfileReviewer | null;
  reviewNotes?: string | null;
  rejectionReason?: string | null;
  lastVerifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  profileImageUrl?: string | null;
  profileImagePublished?: boolean;
  profileImageUploadedAt?: string | null;
  bannerImageUrl?: string | null;
  bannerImagePublished?: boolean;
  bannerImageUploadedAt?: string | null;
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
