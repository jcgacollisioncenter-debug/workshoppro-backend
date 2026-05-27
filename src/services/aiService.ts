import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

if (!geminiApiKey) {
  console.warn('GEMINI_API_KEY is not configured. AI damage analysis will fail until it is set.');
}

const genAI = new GoogleGenerativeAI(geminiApiKey || '');

const buildDamagePrompt = (zones: string[], vehicleSpecs?: any) => {
  let specsInfo = '';
  if (vehicleSpecs) {
    specsInfo = `
CRITICAL VERIFICATION:
The VIN for this vehicle decodes as: ${vehicleSpecs.year} ${vehicleSpecs.make} ${vehicleSpecs.model} (${vehicleSpecs.bodyClass || 'N/A'}).
Analyze if the vehicle in the photo matches these specifications. 
If the vehicle in the photo is CLEARLY different (e.g., VIN says Truck but photo is a Sedan), you MUST start your response with the keyword: VERIFICATION_FAILED.
    `;
  }

  return `You are an experienced automotive repair technician preparing a work-order description for the mechanic who will perform the job.
    
Based on the provided photo(s) and the indicated damaged zones: ${zones.join(', ')}.
${specsInfo}

Analyze the image carefully. Provide a concise, technical description (max 100 words) of the visible damage.
Classify the damage as 'light', 'moderate', 'heavy', or 'structural'.
Mention if parts likely need 'repair', 'replacement', or 'paint refinish'.

FORMAT:
Assessment: [Your technical assessment here]`;
};

export const analyzeVehicleDamage = async (imageBuffer: Buffer, mimeType: string, zones: string[], vehicleSpecs?: any) => {
  try {
    const model = genAI.getGenerativeModel({ model: geminiModel });
    
    const prompt = buildDamagePrompt(zones, vehicleSpecs);
    
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error in AI analysis:', {
      model: geminiModel,
      mimeType,
      message: error instanceof Error ? error.message : error,
    });
    throw new Error('AI analysis failed');
  }
};
