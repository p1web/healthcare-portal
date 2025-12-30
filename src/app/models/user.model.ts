export interface User {
  id: number;
  email: string;
  name: string;
  role: 'patient' | 'doctor' | 'hospital' | 'admin';
  phone?: string;
  avatar?: string;
  token?: string;
}



export interface LoginRequest {
  email: string;
  password: string;
}

// export interface LoginResponse {
//   success: boolean;
//   message: string;
//   user?: User;
//   token?: string;
// }

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}
