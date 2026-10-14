export type UrgencyLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type EmergencyServiceType = 'Ambulance' | 'Fire' | 'Police' | 'Social Support';

export interface EmergencyAnalysis {
  emergency_type: string;
  urgency: UrgencyLevel;
  location: string;
  people_involved: string;
  services_to_alert: EmergencyServiceType[];
  summary: string;
  suggested_questions: string[];
}

export interface ServiceDispatchState {
  service: EmergencyServiceType;
  required: boolean;
  notified: boolean;
  timestamp?: string;
}

export interface CaseLogEntry {
  id: string;
  callNumber: string;
  timestamp: string;
  transcript: string;
  language: string;
  analysis: EmergencyAnalysis;
  dispatchedAt?: string;
  servicesDispatched: EmergencyServiceType[];
  status: 'DISPATCHED' | 'TRIAGED' | 'IN_PROGRESS';
}

export interface LanguageOption {
  code: string;
  label: string;
  nativeName: string;
  recognitionCode: string;
}
