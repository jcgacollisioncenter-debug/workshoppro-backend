import { Router } from 'express';
import { 
  getParts, 
  getSuppliers, 
  submitEstimateFeedback,
  generateAPIKey,
  listAPIKeys,
  revokeAPIKey,
  getAccessories,
  getCompatibleAccessories,
  addAccessory,
  updateAccessory,
  deleteAccessory,
  linkAccessoryToQuote,
  getWorkshopSettings,
  updateWorkshopSettings
} from '../controllers/adminController';

const router = Router();

// Middleware de depuración para ver qué ruta se está pidiendo
router.use((req, res, next) => {
  console.log(`[Admin Route] ${req.method} ${req.url}`);
  next();
});

router.get('/parts', getParts);
router.get('/suppliers', getSuppliers);
router.post('/estimate-feedback', submitEstimateFeedback);

// Integration Endpoints
router.get('/api-keys', listAPIKeys);
router.post('/api-keys', generateAPIKey);
router.delete('/api-keys/:id', revokeAPIKey);

// Workshop Store: Accessories
router.get('/accessories', getAccessories);
router.get('/accessories/compatible', getCompatibleAccessories);
router.post('/accessories', addAccessory);
router.patch('/accessories/:id', updateAccessory);
router.delete('/accessories/:id', deleteAccessory);
router.post('/quotes/link-accessory', linkAccessoryToQuote);

// Workshop Settings
router.get('/settings', getWorkshopSettings);
router.patch('/settings', updateWorkshopSettings);

export default router;
