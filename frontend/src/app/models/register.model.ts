export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: 'patient' | 'doctor' | 'hospital';
  termsAccepted: boolean;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  userId?: number;
}