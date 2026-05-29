import { Request, Response } from 'express';
import { decodeVIN } from '../services/nhtsaService';
import { analyzeVehicleDamage, extractVinFromImage } from '../services/aiService';
import { calculateRepairEstimate } from '../services/budgetService';

export const ocrVin = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }
    
    const vin = await extractVinFromImage(req.file.buffer, req.file.mimetype);
    
    if (vin === 'NOT_FOUND' || vin.length !== 17) {
      return res.status(422).json({ error: 'VIN_NOT_DETECTED', message: 'Could not clearly read a 17-character VIN from this photo.' });
    }

    res.json({ vin });
  } catch (error) {
    console.error('OCR Controller error:', error);
    res.status(500).json({ error: 'OCR failed' });
  }
};

export const getVehicleByVIN = async (req: Request, res: Response) => {
  const { vin } = req.params;
  
  if (!vin || typeof vin !== 'string') {
    return res.status(400).json({ error: 'VIN is required and must be a string' });
  }

  const details = await decodeVIN(vin);
  
  if (details) {
    res.json(details);
  } else {
    res.status(404).json({ error: 'Could not decode VIN' });
  }
};

export const analyzeDamage = async (req: Request, res: Response) => {
  try {
    const { zones, vehicleSpecs } = req.body;
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Uploaded file must be an image' });
    }

    // Parse zones if they come as a JSON string
    let parsedZones: string[] = [];
    try {
      parsedZones = typeof zones === 'string' ? JSON.parse(zones) : zones || [];
    } catch {
      parsedZones = typeof zones === 'string' ? zones.split(',') : [];
    }

    // Parse vehicleSpecs if they come as a JSON string
    let parsedSpecs: any = null;
    try {
      parsedSpecs = typeof vehicleSpecs === 'string' ? JSON.parse(vehicleSpecs) : vehicleSpecs;
    } catch {
      parsedSpecs = null;
    }

    const aiResponse = await analyzeVehicleDamage(req.file.buffer, req.file.mimetype, parsedZones, parsedSpecs);
    
    // Check for verification failure
    if (aiResponse.includes('VERIFICATION_FAILED')) {
      return res.status(400).json({
        error: 'VEHICLE_MISMATCH',
        message: 'The vehicle in the photo does not match the provided VIN specifications. Please ensure you are uploading the correct vehicle photos.'
      });
    }

    const estimate = calculateRepairEstimate(parsedZones, aiResponse);

    res.json({ 
      description: aiResponse,
      estimate,
      disclaimer: "This is an automated estimate for guidance only. A shop professional will review your request and provide a final binding quote."
    });
  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({
      error: 'AI Analysis failed',
      message: 'The image could not be analyzed right now. Please try another photo or retry later.'
    });
  }
};
