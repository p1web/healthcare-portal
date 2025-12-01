export interface Appointment {
  doctorId: number;
  patientName: string;
  email: string;
  phone: string;
  date: string;
  reason?: string;
  couponCode?: string;
}