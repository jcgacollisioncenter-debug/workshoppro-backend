import { getEstimateCalibration } from './estimateLearningService';

interface BudgetRange {
  min: number;
  max: number;
}

interface ItemizedEstimate {
  labour: BudgetRange;
  parts: BudgetRange;
  paint: BudgetRange;
  total: BudgetRange;
  duration: {
    hours: number;
    days: number;
  };
  priority: {
    score: number;
    flexibility: 'low' | 'medium' | 'high';
  };
}

const ZONE_BASE_COSTS: Record<string, any> = {
  'Bumper': { labour: 300, parts: 450, paint: 150, hours: 6, priority: 2 },
  'Hood': { labour: 250, parts: 600, paint: 250, hours: 8, priority: 2 },
  'Door': { labour: 400, parts: 550, paint: 200, hours: 10, priority: 3 },
  'Fender': { labour: 200, parts: 300, paint: 150, hours: 5, priority: 2 },
  'Headlight': { labour: 100, parts: 800, paint: 0, hours: 2, priority: 1 },
  'Windshield': { labour: 150, parts: 500, paint: 0, hours: 3, priority: 1 },
  'Chassis': { labour: 1200, parts: 200, paint: 0, hours: 24, priority: 5 },
  'Engine': { labour: 1500, parts: 2500, paint: 0, hours: 32, priority: 5 },
  'Suspension': { labour: 600, parts: 1200, paint: 0, hours: 12, priority: 4 },
  'Bodywork': { labour: 500, parts: 100, paint: 300, hours: 12, priority: 3 },
};

/**
 * Calculates a detailed repair estimate based on damaged zones and AI description.
 * This is the core logic that the system will "learn" to calibrate over time.
 */
export const calculateRepairEstimate = (zones: string[], aiDescription: string): ItemizedEstimate => {
  if (zones.length === 0) {
    zones = ['Bodywork'];
  }

  let totalLabour = 0;
  let totalParts = 0;
  let totalPaint = 0;
  let totalHours = 0;
  let maxPriority = 1;

  zones.forEach(zone => {
    const config = ZONE_BASE_COSTS[zone] || { labour: 200, parts: 200, paint: 100, hours: 4, priority: 2 };
    totalLabour += config.labour;
    totalParts += config.parts;
    totalPaint += config.paint;
    totalHours += config.hours;
    if (config.priority > maxPriority) maxPriority = config.priority;
  });

  // Apply multipliers based on mechanic-facing AI description.
  let multiplier = 1.0;
  const description = aiDescription.toLowerCase();
  const unclearAssessment = description.includes('cannot be assessed')
    || description.includes('can not be assessed')
    || description.includes('does not clearly show')
    || description.includes('does not depict')
    || description.includes('no assessment')
    || description.includes('no visible')
    || description.includes('no bodywork damage');

  if (unclearAssessment) {
    multiplier = 0.85;
    maxPriority = Math.min(maxPriority, 2);
  } else {
    if (description.includes('light') || description.includes('minor') || description.includes('surface')) {
      multiplier -= 0.08;
    }
    if (description.includes('moderate')) {
      multiplier += 0.12;
    }
    if (description.includes('structural') || description.includes('chassis') || description.includes('frame rail') || description.includes('subframe')) {
      multiplier += 0.5;
      maxPriority = Math.min(5, maxPriority + 1);
    }
    if (description.includes('replacement') || description.includes('replace') || description.includes('cracked') || description.includes('split')) {
      multiplier += 0.35;
    }
    if (description.includes('refinish') || description.includes('repaint') || description.includes('colour blend') || description.includes('paint blend')) {
      totalPaint = Math.max(totalPaint, 250);
      multiplier += 0.12;
    }
    if (description.includes('alignment') || description.includes('displaced') || description.includes('misaligned')) {
      multiplier += 0.18;
      maxPriority = Math.min(5, maxPriority + 1);
    }
    if (description.includes('leak') || description.includes('leaking') || description.includes('worn')) {
      multiplier += 0.18;
    }
    if (description.includes('heavy') || description.includes('severe') || description.includes('deformation') || description.includes('deformed')) {
      multiplier += 0.2;
      maxPriority = Math.min(5, maxPriority + 1);
    }
  }

  multiplier = Math.max(0.85, multiplier);

  // Apply learned calibration factors
  const calibration = getEstimateCalibration();
  const zoneCalibrationFactors = zones.map(zone => calibration.zoneFactors[zone]).filter(Boolean);
  if (zoneCalibrationFactors.length > 0) {
    const calibrationFactor = zoneCalibrationFactors.reduce((sum, factor) => (sum as number) + (factor as number), 0) / zoneCalibrationFactors.length;
    multiplier *= Math.min(1.5, Math.max(0.65, calibrationFactor as number));
  }

  const applyRange = (base: number) => ({
    min: base > 0 ? Math.max(1, Math.round(base * multiplier * 0.9)) : 0,
    max: base > 0 ? Math.max(1, Math.round(base * multiplier * 1.2)) : 0,
  });

  const labour = applyRange(totalLabour);
  const parts = applyRange(totalParts);
  const paint = applyRange(totalPaint);
  const estimatedHours = Math.ceil(totalHours * multiplier);

  return {
    labour,
    parts,
    paint,
    total: {
      min: labour.min + parts.min + paint.min,
      max: labour.max + parts.max + paint.max,
    },
    duration: {
      hours: estimatedHours,
      days: Math.ceil(estimatedHours / 8),
    },
    priority: {
      score: maxPriority,
      flexibility: maxPriority >= 4 ? 'low' : (maxPriority >= 2 ? 'medium' : 'high')
    }
  };
};
