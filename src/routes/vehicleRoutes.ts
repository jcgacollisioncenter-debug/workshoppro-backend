import { Router } from 'express';
import multer from 'multer';
import { getVehicleByVIN, analyzeDamage, ocrVin } from '../controllers/vehicleController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/decode-vin/:vin', getVehicleByVIN);
router.post('/ocr-vin', upload.single('image'), ocrVin);
router.post('/analyze-damage', upload.single('image'), analyzeDamage);

export default router;
