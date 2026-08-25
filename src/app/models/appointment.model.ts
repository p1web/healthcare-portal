export interface Appointment {
  doctorId: number;
  date: string;
  time: string;
  reason?: string;
  couponCode?: string | null;
}

export interface AppointmentHistory extends Appointment {
  id: number;
  doctorName: string;
  specialization?: string | null;
  hospital?: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected';
  createdAt: string;
  rejectionReason?: string | null;
  couponCode?: string | null;
  couponId?: number | null;
  originalPrice?: number | null;
  discountAmount?: number;
  finalPrice?: number | null;
}

export interface DoctorAppointment {
  id: number;
  patientId: number;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  date: string;
  time: string;
  reason?: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected';
  rejectionReason?: string | null;
  createdAt: string;
}

export interface AdminAppointment extends DoctorAppointment {
  doctorId: number;
  doctorName: string;
  doctorEmail?: string | null;
  doctorPhone?: string | null;
  specialization?: string | null;
  hospital?: string | null;
  hospitalAddress?: string | null;
  couponCode?: string | null;
  couponId?: number | null;
  couponTitle?: string | null;
  originalPrice?: number | null;
  discountAmount?: number | null;
  finalPrice?: number | null;
  paymentStatus?: 'paid' | 'pending' | 'refunded' | null;
  cancelledBy?: 'patient' | 'doctor' | 'admin' | null;
  cancelledAt?: string | null;
}