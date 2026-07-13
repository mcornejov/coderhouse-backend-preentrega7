import { Router } from 'express';
import {
  createBooking,
  getBookingById,
  addServiceToBooking,
} from '../controllers/bookings.controller.js';

// El router solo define los endpoints y los conecta con su controller.
// No contiene lógica de negocio ni accede a los datos.
const router = Router();

router.post('/', createBooking);
router.get('/:bid', getBookingById);
router.post('/:bid/services/:sid', addServiceToBooking);

export default router;
