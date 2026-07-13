import { Router } from 'express';
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from '../controllers/services.controller.js';

// El router solo define los endpoints y los conecta con su controller.
// No contiene lógica de negocio ni accede a los datos.
const router = Router();

router.get('/', getServices);
router.get('/:sid', getServiceById);
router.post('/', createService);
router.put('/:sid', updateService);
router.delete('/:sid', deleteService);

export default router;
