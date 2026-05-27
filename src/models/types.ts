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
  notes?: string;
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
