export interface Appointment {
  doctorId: number;
  date: string;
  time: string;
  reason?: string;
}

export interface AppointmentHistory extends Appointment {
  id: number;
  doctorName: string;
  specialization?: string | null;
  hospital?: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
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
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

export interface AdminAppointment extends DoctorAppointment {
  doctorId: number;
  doctorName: string;
  specialization?: string | null;
  hospital?: string | null;
}