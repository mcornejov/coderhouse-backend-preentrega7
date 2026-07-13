import bookingsService from '../services/bookings.service.js';
import { ValidationError, NotFoundError } from '../utils/errors.util.js';
import { responderErrorInterno } from '../utils/responses.util.js';

// El controller recibe la request, delega la lógica en el service y arma la
// response. No accede a la persistencia ni contiene reglas de negocio.

// POST /api/bookings -> crea una reserva (puede iniciar con services vacío)
export async function createBooking(req, res) {
  try {
    const nueva = await bookingsService.createBooking(req.body);
    res.status(201).json({ status: 'success', payload: nueva });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ status: 'error', error: error.message });
    }
    responderErrorInterno(res, error);
  }
}

// GET /api/bookings/:bid -> devuelve una reserva por id (404 si no existe)
export async function getBookingById(req, res) {
  try {
    const booking = await bookingsService.getBookingById(req.params.bid);

    if (!booking) {
      return res
        .status(404)
        .json({ status: 'error', error: 'Reserva no encontrada' });
    }

    res.status(200).json({ status: 'success', payload: booking });
  } catch (error) {
    responderErrorInterno(res, error);
  }
}

// POST /api/bookings/:bid/services/:sid -> asocia un servicio existente a una reserva
export async function addServiceToBooking(req, res) {
  try {
    const { bid, sid } = req.params;

    // addServiceToBooking lanza NotFoundError si el servicio no existe
    // y devuelve null si la reserva no existe.
    const booking = await bookingsService.addServiceToBooking(bid, sid);

    if (!booking) {
      return res
        .status(404)
        .json({ status: 'error', error: 'Reserva no encontrada' });
    }

    res.status(200).json({ status: 'success', payload: booking });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ status: 'error', error: error.message });
    }
    responderErrorInterno(res, error);
  }
}
