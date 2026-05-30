export interface Profile {
  id: string;
  full_name: string;
  address?: string;
  phone?: string;
  email?: string;
  role: 'admin' | 'customer';
  created_at: Date;
  updated_at: Date;
}

export interface Vehicle {
  id: string;
  owner_id: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  license_plate?: string;
  created_at: Date;
}

export interface Appointment {
  id: string;
  vehicle_id: string;
  service_type: string;
  scheduled_at: Date;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  client_name?: string;
  client_phone?: string;
  client_notes?: string;
  notes?: string;
  created_at: Date;
}

export interface WorkshopSettings {
  id: string;
  workshop_name: string;
  bay_capacity: number;
  latitude: number;
  longitude: number;
  address?: string;
  phone_number?: string;
  website_url?: string;
  autopilot_enabled: boolean;
  autopilot_trust_limit: number;
  payments_enabled: boolean;
  payment_provider: 'stripe' | 'paypal' | 'square' | 'none';
  updated_at: Date;
}

export interface RepairPlan {
  id: string;
  appointment_id: string;
  quote_id?: string;
  vehicle_id: string;
  
  step_inspection: number;
  step_inspection_started_at?: Date;
  step_inspection_completed_at?: Date;

  step_disassembly: number;
  step_disassembly_started_at?: Date;
  step_disassembly_completed_at?: Date;

  step_bodywork: number;
  step_bodywork_started_at?: Date;
  step_bodywork_completed_at?: Date;

  step_prep: number;
  step_prep_started_at?: Date;
  step_prep_completed_at?: Date;

  step_paint: number;
  step_paint_started_at?: Date;
  step_paint_completed_at?: Date;

  step_reassembly: number;
  step_reassembly_started_at?: Date;
  step_reassembly_completed_at?: Date;

  step_detailing: number;
  step_detailing_started_at?: Date;
  step_detailing_completed_at?: Date;

  step_ready: number;
  step_ready_started_at?: Date;
  step_ready_completed_at?: Date;

  current_step: string;
  progress_percentage: number;
  updated_at: Date;
}

export interface RepairAnalytics {
  id: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  zones_affected_count: number;
  severity_proxy: number;
  duration_inspection?: number;
  duration_disassembly?: number;
  duration_bodywork?: number;
  duration_prep?: number;
  duration_paint?: number;
  duration_reassembly?: number;
  duration_detailing?: number;
  duration_ready?: number;
  created_at: Date;
}

export interface Quote {
  id: string;
  appointment_id?: string;
  vehicle_id: string;
  total_amount: number;
  description: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  created_at: Date;
}

export interface Part {
  id: string;
  part_name: string;
  part_number?: string;
  quantity: number;
  price: number;
  supplier?: string;
  updated_at: Date;
}

export interface ServiceHistory {
  id: string;
  vehicle_id: string;
  service_date: Date;
  description: string;
  cost?: number;
  technician_name?: string;
}
