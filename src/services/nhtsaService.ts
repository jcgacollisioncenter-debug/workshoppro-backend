import axios from 'axios';

export interface VehicleDetails {
  year: string;
  make: string;
  model: string;
  engineDisplacement?: string;
  fuelType?: string;
  plantCountry?: string;
  bodyClass?: string;
  driveType?: string;
}

export const decodeVIN = async (vin: string): Promise<VehicleDetails | null> => {
  try {
    const response = await axios.get(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`);
    const results = response.data.Results;
    
    const getValue = (variable: string) => results.find((r: any) => r.Variable === variable)?.Value;

    const year = getValue('Model Year');
    const make = getValue('Make');
    const model = getValue('Model');

    if (year && make && model) {
      return {
        year,
        make,
        model,
        engineDisplacement: getValue('Displacement (L)'),
        fuelType: getValue('Fuel Type - Primary'),
        plantCountry: getValue('Plant Country'),
        bodyClass: getValue('Body Class'),
        driveType: getValue('Drive Type'),
      };
    }
    return null;
  } catch (error) {
    console.error('Error decoding VIN:', error);
    return null;
  }
};
