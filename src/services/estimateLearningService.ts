import fs from 'fs';
import path from 'path';

interface EstimateFeedback {
  zones: string[];
  aiEstimate: {
    labour: number;
    parts: number;
    paint: number;
    total: number;
  };
  finalEstimate: {
    labour: number;
    parts: number;
    paint: number;
    total: number;
  };
}

const FEEDBACK_PATH = path.join(__dirname, '../../database/estimate-feedback.jsonl');
const CALIBRATION_PATH = path.join(__dirname, '../../database/estimate-calibration.json');

/**
 * Records admin moderation feedback for future learning.
 * Stores data in a JSONL file for training.
 */
export const recordEstimateFeedback = (feedback: EstimateFeedback) => {
  try {
    const entry = JSON.stringify({ ...feedback, timestamp: new Date().toISOString() }) + '\n';
    fs.appendFileSync(FEEDBACK_PATH, entry);
    
    // Trigger a simple re-calibration (in a real app, this might be a background job)
    return updateCalibrationFactors();
  } catch (error) {
    console.error('Error recording estimate feedback:', error);
    return null;
  }
};

/**
 * Basic "learning" logic:
 * Calculates average correction factors per zone.
 */
const updateCalibrationFactors = () => {
  if (!fs.existsSync(FEEDBACK_PATH)) return null;

  const lines = fs.readFileSync(FEEDBACK_PATH, 'utf-8').split('\n').filter(Boolean);
  const feedbacks: EstimateFeedback[] = lines.map(line => JSON.parse(line));

  const zoneFactors: Record<string, number> = {};
  const zoneCounts: Record<string, number[]> = {};

  feedbacks.forEach(f => {
    const totalFactor = f.finalEstimate.total / (f.aiEstimate.total || 1);
    f.zones.forEach(zone => {
      if (!zoneCounts[zone]) zoneCounts[zone] = [];
      zoneCounts[zone].push(totalFactor);
    });
  });

  Object.keys(zoneCounts).forEach(zone => {
    const factors = zoneCounts[zone];
    const average = factors.reduce((a, b) => a + b, 0) / factors.length;
    zoneFactors[zone] = Number(average.toFixed(3));
  });

  fs.writeFileSync(CALIBRATION_PATH, JSON.stringify({ zoneFactors, sampleSize: lines.length }, null, 2));

  return { zoneFactors, sampleSize: lines.length };
};

/**
 * Returns current calibration multipliers for the budget engine.
 */
export const getEstimateCalibration = () => {
  if (!fs.existsSync(CALIBRATION_PATH)) {
    return { zoneFactors: {} as Record<string, number>, sampleSize: 0 };
  }
  return JSON.parse(fs.readFileSync(CALIBRATION_PATH, 'utf-8'));
};
