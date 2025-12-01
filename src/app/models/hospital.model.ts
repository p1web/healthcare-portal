export interface Hospital {
  id: number;
  name: string;
  location: string;
  rating: number;
  specialties: string[];
  discount: string;
  address?: string;
  phone?: string;
  email?: string;
  image?: string;
  description?: string;
  facilities?: string[];
  beds?: number;
  established?: number;
  accreditations?: string[];
  operatingHours?: string;
  emergencyAvailable?: boolean;
}
