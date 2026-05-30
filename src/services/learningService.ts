import { supabase } from '../utils/supabase';

/**
 * Records a completed stage duration into the analytics table.
 * This data is used by the IA to learn and predict future repair times.
 */
export const recordStageMetrics = async (planId: string, stage: string) => {
  try {
    // 1. Fetch the full plan and related data
    const { data: plan, error: planError } = await (supabase as any)
      .from('repair_plans')
      .select('*, vehicle:vehicles(*), quote:quotes(*)')
      .eq('id', planId)
      .single();

    if (planError || !plan) throw new Error('Could not fetch plan for analytics');

    const startedAt = plan[`step_${stage}_started_at`];
    const completedAt = plan[`step_${stage}_completed_at`];

    if (!startedAt || !completedAt) return;

    const durationSec = Math.floor((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000);

    // 2. Upsert or update the analytics record for this specific repair
    // Check if a record already exists for this appointment/plan
    const { data: existing } = await (supabase as any)
      .from('repair_analytics')
      .select('id')
      .eq('id', planId) // Use plan ID as analytics ID for 1:1 mapping
      .single();

    const metrics: any = {
        id: planId,
        vehicle_make: plan.vehicle?.make,
        vehicle_model: plan.vehicle?.model,
        vehicle_year: plan.vehicle?.year,
        zones_affected_count: plan.quote?.affected_zones?.length || 0,
        severity_proxy: plan.quote?.total_amount || 0,
        [`duration_${stage}`]: durationSec
    };

    if (existing) {
        await (supabase as any).from('repair_analytics').update(metrics).eq('id', planId);
    } else {
        await (supabase as any).from('repair_analytics').insert(metrics);
    }
    
    console.log(`[AI Learning] Recorded ${durationSec}s for ${stage} in plan ${planId}`);
  } catch (error) {
    console.error('recordStageMetrics error:', error);
  }
};

/**
 * Predicts stage durations based on historical data.
 * Filters by vehicle characteristics and damage severity.
 */
export const predictStageDurations = async (make: string, zonesCount: number) => {
  try {
    // Basic learning: average of similar repairs (same make and similar number of zones)
    const { data, error } = await (supabase as any)
      .from('repair_analytics')
      .select('*')
      .eq('vehicle_make', make)
      .gte('zones_affected_count', zonesCount - 1)
      .lte('zones_affected_count', zonesCount + 1);

    if (error || !data || data.length === 0) {
      // Return defaults if no history
      return {
        inspection: 3600, // 1h
        disassembly: 7200, // 2h
        bodywork: 14400, // 4h
        prep: 10800, // 3h
        paint: 18000, // 5h
        reassembly: 7200, // 2h
        detailing: 3600, // 1h
        ready: 1800 // 30m
      };
    }

    const stages = ['inspection', 'disassembly', 'bodywork', 'prep', 'paint', 'reassembly', 'detailing', 'ready'];
    const predictions: any = {};

    stages.forEach(stage => {
      const values = data.map((d: any) => d[`duration_${stage}`]).filter((v: any) => v != null);
      if (values.length > 0) {
        predictions[stage] = Math.round(values.reduce((a: number, b: number) => a + b, 0) / values.length);
      } else {
        predictions[stage] = 3600; // Default fallback
      }
    });

    return predictions;
  } catch (error) {
    console.error('predictStageDurations error:', error);
    return null;
  }
};
