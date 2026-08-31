export interface Appointment {
  doctorId: number;
  practiceId?: number;
  date: string;
  time: string;
  reason?: string;
  couponCode?: string | null;
  paymentMode?: 'online' | 'offline';
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
  bookingNumber?: string | null;
  paymentMode?: 'online' | 'offline';
  paymentStatus?: 'paid' | 'pending' | 'failed' | 'refunded';
  paidAt?: string | null;
  paymentTransactionId?: string | null;
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
  hospital?: string | null;
  originalPrice?: number | null;
  finalPrice?: number | null;
  doctorPayoutAmount?: number;
  bookingNumber?: string | null;
  paymentMode?: 'online' | 'offline';
  paymentStatus?: 'paid' | 'pending' | 'failed' | 'refunded';
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
  paymentStatus?: 'paid' | 'pending' | 'failed' | 'refunded';
  cancelledBy?: 'patient' | 'doctor' | 'admin' | null;
  cancelledAt?: string | null;
}

export interface AppointmentReceipt {
  bookingNumber: string;
  paymentMode: 'online' | 'offline';
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  paidAt: string | null;
  paymentTransactionId: string | null;
  appointmentDate: string;
  appointmentTime: string | null;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorName: string | null;
  specialization: string | null;
  hospitalName: string | null;
  hospitalCity: string | null;
  originalPrice: number | null;
  discountAmount: number;
  finalPrice: number | null;
  couponCode: string | null;
  platformCommission: number;
  doctorPayout: number;
}