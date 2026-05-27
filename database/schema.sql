-- =========================================================
-- FINAL SCHEMA FOR WORKSHOP MANAGEMENT SYSTEM (WorkshopPro)
-- Targets: PostgreSQL / Supabase
-- Version: 1.0 (Audit-Ready for Deployment)
-- =========================================================

-- 0. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Admins and Customers)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT UNIQUE,
    role TEXT CHECK (role IN ('admin', 'customer')) DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. VEHICLES
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    vin TEXT UNIQUE,
    license_plate TEXT,
    engine_displacement TEXT,
    fuel_type TEXT,
    plant_country TEXT,
    body_class TEXT,
    drive_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. APPOINTMENTS (Booking Calendar)
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. QUOTES (The AI-Admin Hybrid Quote Engine)
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES vehicles(id),
    
    -- Request Data
    affected_zones TEXT[], 
    user_description TEXT,
    ai_description TEXT,
    image_urls TEXT[], 
    
    -- AI Estimated Ranges (Initial Prediction)
    est_labour_min DECIMAL(10, 2),
    est_labour_max DECIMAL(10, 2),
    est_parts_min DECIMAL(10, 2),
    est_parts_max DECIMAL(10, 2),
    est_paint_min DECIMAL(10, 2),
    est_paint_max DECIMAL(10, 2),
    est_total_max DECIMAL(10, 2),
    
    -- Final Binding Price (Moderated by Admin)
    final_labour DECIMAL(10, 2),
    final_parts DECIMAL(10, 2),
    final_paint DECIMAL(10, 2),
    total_amount DECIMAL(10, 2), 
    duration_hours DECIMAL(10, 2),
    
    -- Autopilot & YieldMax Data
    priority_score DECIMAL(5, 4) DEFAULT 0.0000, -- 0.0 to 1.0
    status TEXT CHECK (status IN ('pending_review', 'estimated', 'sent', 'accepted', 'rejected')) DEFAULT 'pending_review',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. WORKSHOP ACCESSORIES (The Store)
CREATE TABLE workshop_accessories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    compatible_makes TEXT[], 
    compatible_models TEXT[], 
    price DECIMAL(10, 2) NOT NULL,
    install_price DECIMAL(10, 2) DEFAULT 0.00,
    stock_quantity INTEGER DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. QUOTE ACCESSORIES (Upsell Linkage)
CREATE TABLE quote_accessories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
    accessory_id UUID REFERENCES workshop_accessories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. API KEYS (External Integrations)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    key_name TEXT NOT NULL,
    api_key TEXT UNIQUE NOT NULL, -- Format: wp_live_...
    status TEXT CHECK (status IN ('active', 'revoked')) DEFAULT 'active',
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. WORKSHOP SETTINGS (Admin Calibration Hub)
CREATE TABLE workshop_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workshop_name TEXT NOT NULL DEFAULT 'WorkshopPro Toronto',
    
    -- Capacity Calibration
    bay_capacity INTEGER DEFAULT 12,
    
    -- Geolocation (For Google Maps Integration)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    
    -- AI Autopilot Progress Configuration
    autopilot_enabled BOOLEAN DEFAULT false,
    autopilot_trust_limit DECIMAL(10, 2) DEFAULT 2500.00,
    
    -- Payment Gateway Integration
    payments_enabled BOOLEAN DEFAULT false,
    payments_visible_to_users BOOLEAN DEFAULT false,
    payment_provider TEXT CHECK (payment_provider IN ('stripe', 'paypal', 'square', 'none')) DEFAULT 'none',
    api_key_public TEXT,
    api_key_secret TEXT,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. AI CALIBRATION FACTORS (The Machine Learning Memory)
CREATE TABLE estimate_calibration_factors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repair_zone TEXT UNIQUE NOT NULL,
    labour_factor DECIMAL(5, 3) DEFAULT 1.000,
    parts_factor DECIMAL(5, 3) DEFAULT 1.000,
    paint_factor DECIMAL(5, 3) DEFAULT 1.000,
    sample_size INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- INITIAL SEED DATA
-- =========================================================

INSERT INTO workshop_settings (workshop_name, bay_capacity, latitude, longitude)
VALUES ('WorkshopPro Toronto HQ', 12, 43.6532, -79.3832);

-- Pre-populate some accessories
INSERT INTO workshop_accessories (name, description, compatible_makes, price, install_price, stock_quantity)
VALUES 
('Premium All-Weather Mats', 'Complete floor protection', '{Ford, Tesla, Audi, BMW}', 120.00, 0.00, 20),
('LED Headlight Pro Upgrade', 'Ultra-bright visibility', '{Ford, Toyota}', 280.00, 80.00, 5);

-- =========================================================
-- SECURITY POLICIES (Row Level Security)
-- =========================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_accessories ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: Users can see only their profile. Admins can see all.
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 2. Quotes: Users can view own. Admins can view all and update.
CREATE POLICY "Users can view own quotes" ON quotes FOR SELECT USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = quotes.vehicle_id AND vehicles.owner_id = auth.uid()));
CREATE POLICY "Admins can manage all quotes" ON quotes FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 3. Settings: Public can read (for map/payments). Only Admin can update.
CREATE POLICY "Anyone can read workshop settings" ON workshop_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update workshop settings" ON workshop_settings FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. Store: Public can view active stock. Only admin manages.
CREATE POLICY "Public can view accessories" ON workshop_accessories FOR SELECT USING (is_active = true AND stock_quantity > 0);
CREATE POLICY "Admins manage accessories" ON workshop_accessories FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
