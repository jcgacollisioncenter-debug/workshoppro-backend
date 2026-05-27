import { Request, Response } from 'express';
import { searchParts } from '../services/partsService';
import { findSuppliersNearby } from '../services/supplierService';
import { recordEstimateFeedback } from '../services/estimateLearningService';
import crypto from 'crypto';
import { supabase } from '../utils/supabase'; // Note: Re-creating this utility in next step

export const getParts = async (req: Request, res: Response) => {
  const { year, make, model, query } = req.query;
  const parts = await searchParts({ year, make, model }, query as string);
  res.json(parts);
};

export const getSuppliers = async (req: Request, res: Response) => {
  const { location, radius } = req.query;
  const suppliers = await findSuppliersNearby(location as string, Number(radius));
  res.json(suppliers);
};

// API Key Management for External Integrations
export const generateAPIKey = async (req: Request, res: Response) => {
  try {
    const { name, owner_id } = req.body;
    if (!name) return res.status(400).json({ error: 'Key name is required' });

    // Generate a secure prefixed key
    const key = `wp_${crypto.randomBytes(24).toString('hex')}`;
    
    const { data, error } = await (supabase as any)
      .from('api_keys')
      .insert({
        key_name: name,
        api_key: key,
        owner_id: owner_id || null
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, apiKey: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate API key' });
  }
};

export const listAPIKeys = async (req: Request, res: Response) => {
  try {
    const { data, error } = await (supabase as any)
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list API keys' });
  }
};

export const revokeAPIKey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await (supabase as any)
      .from('api_keys')
      .update({ status: 'revoked' })
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
};

export const submitEstimateFeedback = (req: Request, res: Response) => {
  try {
    const { zones, aiEstimate, finalEstimate } = req.body;

    if (!Array.isArray(zones) || !aiEstimate || !finalEstimate) {
      return res.status(400).json({ error: 'zones, aiEstimate, and finalEstimate are required' });
    }

    const calibration = recordEstimateFeedback({ zones, aiEstimate, finalEstimate });
    res.json({ success: true, calibration });
  } catch (error) {
    console.error('Estimate feedback error:', error);
    res.status(500).json({ error: 'Could not record estimate feedback' });
  }
};

// Workshop Store: Accessory Management
export const getAccessories = async (req: Request, res: Response) => {
  try {
    const { data, error } = await (supabase as any)
      .from('workshop_accessories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch accessories' });
  }
};

export const getCompatibleAccessories = async (req: Request, res: Response) => {
  try {
    const { make, model } = req.query;
    if (!make) return res.status(400).json({ error: 'Make is required' });

    const { data, error } = await (supabase as any)
      .from('workshop_accessories')
      .select('*')
      .contains('compatible_makes', [make])
      .eq('is_active', true)
      .gt('stock_quantity', 0);

    if (error) throw error;

    // Further filter by model or 'Universal' (simulated with empty models or specific match)
    const filtered = data.filter((acc: any) => 
      !acc.compatible_models || 
      acc.compatible_models.length === 0 || 
      acc.compatible_models.includes(model)
    );

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch compatible accessories' });
  }
};

export const addAccessory = async (req: Request, res: Response) => {
  try {
    const accessory = req.body;
    const { data, error } = await (supabase as any)
      .from('workshop_accessories')
      .insert(accessory)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, accessory: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add accessory' });
  }
};

export const updateAccessory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const { data, error } = await (supabase as any)
      .from('workshop_accessories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, accessory: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update accessory' });
  }
};

export const deleteAccessory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await (supabase as any)
      .from('workshop_accessories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete accessory' });
  }
};

export const linkAccessoryToQuote = async (req: Request, res: Response) => {
  try {
    const { quote_id, accessory_id } = req.body;
    const { error } = await (supabase as any)
      .from('quote_accessories')
      .insert({ quote_id, accessory_id });

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to link accessory' });
  }
};

// Workshop Settings (Geolocation & General Config)
export const getWorkshopSettings = async (req: Request, res: Response) => {
  try {
    const { data, error } = await (supabase as any)
      .from('workshop_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workshop settings' });
  }
};

export const updateWorkshopSettings = async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const { data: existing } = await (supabase as any)
      .from('workshop_settings')
      .select('id')
      .limit(1)
      .single();

    const { data, error } = await (supabase as any)
      .from('workshop_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, settings: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update workshop settings' });
  }
};
