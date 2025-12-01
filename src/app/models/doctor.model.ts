export interface Doctor {
  id: number;
  name: string;
  specialization: string;
  hospital: string;
  experience: string;
  rating: number;
  fee: string;
  available: string;
  email?: string;
  phone?: string;
  about?: string;
  education?: string[];
  languages?: string[];
  awards?: string[];
  consultationTypes?: string[];
  nextAvailable?: Date;
  totalPatients?: number;
  verified?: boolean;
}