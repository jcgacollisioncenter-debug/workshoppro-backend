import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not fully configured. Database operations may fail.');
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('Using Service Role Key (RLS Bypass enabled)');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
