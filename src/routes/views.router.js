import { Router } from 'express';
import {
  renderServices,
  renderAvailability,
} from '../controllers/views.controller.js';

// El router solo define los endpoints de las vistas y los conecta con su
// controller. No contiene lógica de negocio.
const router = Router();

router.get('/services', renderServices);
router.get('/availability', renderAvailability);

export default router;
