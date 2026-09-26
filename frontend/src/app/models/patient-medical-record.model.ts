export type AllergySeverity = 'mild' | 'moderate' | 'severe';
export type AllergyStatus = 'active' | 'resolved';
export type ConditionStatus = 'active' | 'resolved' | 'chronic';

export interface PatientAllergy {
  id: number;
  patientProfileId?: number;
  name: string;
  severity?: AllergySeverity | null;
  reaction?: string | null;
  status: AllergyStatus;
  diagnosedDate?: string | null;
  resolvedDate?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientMedicalCondition {
  id: number;
  patientProfileId?: number;
  name: string;
  status: ConditionStatus;
  diagnosedDate?: string | null;
  resolvedDate?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
