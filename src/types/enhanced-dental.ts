export interface Patient {
  id: string;
  name: string;
  dateOfBirth?: string;
  contact?: string;
  insurance?: string;
}

export interface Dentist {
  id: string;
  name: string;
  licenseNumber?: string;
}

export interface Clinic {
  id: string;
  name: string;
  address?: string;
}

export interface Session {
  id: string;
  patientId: string;
  patientName: string;
  dentistId: string;
  dentistName: string;
  clinicId: string;
  clinicName: string;
  sessionType: string;
  date: string;
  findings: EnhancedFinding[];
  voiceRecordings?: VoiceRecording[];
}

export interface EnhancedFinding {
  id: string;
  toothNumber: number;
  condition: string;
  confidence: number; // 0-100
  verified: boolean;
  flagged: boolean;
  transcript?: string;
  notes?: string;
  timestamp: string;
}

export interface VoiceRecording {
  id: string;
  timestamp: string;
  duration: number;
  transcriptStatus: 'pending' | 'completed' | 'failed';
  transcript?: string;
}
