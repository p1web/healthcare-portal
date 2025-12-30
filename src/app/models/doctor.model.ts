export interface Doctor {
  id: number;

  //  IDs (used for filtering)
  specialization_id: number | null;
  hospital_id: number | null;

  // Display fields
  name: string;
  specialization: string; // specialization name (for UI & search)
  hospital: string;       // hospital name (for UI & search)

  experience: string;
  rating: number;
  fee: string;
  available: string;

  email?: string;
  phone?: string;
  qualification?: string;
  bio?: string;
  image?: string;
  consultationDuration?: number;
}
