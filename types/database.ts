export type UserRole = 'master_admin' | 'volunteer' | 'verification_staff' | 'panel';
export type ApplicantStatus = 'REGISTERED' | 'ARRIVED' | 'DOCUMENT_VERIFIED' | 'INTERVIEW_IN_PROGRESS' | 'INTERVIEW_COMPLETED';
export type CheckpointType = 'ARRIVAL' | 'DOCUMENT_VERIFICATION' | 'INTERVIEW_STARTED' | 'INTERVIEW_COMPLETED';

export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  full_name?: string;
  email?: string;
  phone?: string;
  assigned_floor_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Applicant {
  application_number: string;
  name: string;
  phone: string;
  program: string;
  campus?: string;
  date: string;
  time: string;
  location?: string;
  instructions?: string;
  status: ApplicantStatus;
  arrived_at?: string;
  document_verified_at?: string;
  interviewed_at?: string;
  interviewed_by_emails?: string | null;
  assigned_panel_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Floor {
  floor_id: string;
  floor_name: string;
  floor_number: number;
  assigned_programs: string[];
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  teacher_id: string;
  name: string;
  email?: string;
  department?: string;
  specialization?: string;
  panel?: number | null;
  panel_session_token?: string | null;
  panel_device_id?: string | null;
  panel_last_confirmed_at?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Panel {
  panel_id: string;
  panel_login: string;
  panel_password_hash: string;
  assigned_floor_id?: string;
  teacher_name_1?: string;
  teacher_name_2?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Checkpoint {
  checkpoint_id: string;
  application_number: string;
  checkpoint_type: CheckpointType;
   panel_number?: number | null;
  user_id?: string;
  metadata?: any;
  created_at: string;
}

export interface SmsLog {
  log_id: string;
  application_number: string;
  phone: string;
  message: string;
  status: string;
  created_at: string;
}
