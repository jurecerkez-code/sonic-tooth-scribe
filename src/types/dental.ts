export type ToothCondition = 
  | "healthy" 
  | "removed" 
  | "cavity" 
  | "crown" 
  | "root-canal" 
  | "cracked" 
  | "filling";

export interface ToothStatus {
  toothNumber: number;
  condition: ToothCondition;
  notes?: string;
  timestamp: string;
}

export interface PatientInfo {
  name: string;
  sessionId: string;
  date: string;
}

export interface Finding {
  id: string;
  toothNumber: number;
  condition: ToothCondition;
  timestamp: string;
  notes?: string;
}
