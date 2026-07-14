import bookingsRepository from '../repositories/bookings.repository.js';
import servicesService from './services.service.js';
import { ValidationError, NotFoundError } from '../utils/errors.util.js';

// Campos obligatorios de cada reserva (services se maneja aparte)
const CAMPOS_REQUERIDOS = ['clientName', 'clientEmail', 'date', 'time'];

// Estados válidos de una reserva
const ESTADOS_PERMITIDOS = ['pending', 'confirmed', 'cancelled'];

// El service concentra las reglas de negocio de las reservas. No conoce req/res
// ni la forma en que se persisten los datos.
class BookingsService {
  constructor(repository, serviciosService) {
    this.repository = repository;
    // Se apoya en el service de servicios para validar la existencia de un servicio
    this.servicesService = serviciosService;
  }

  // Valida los datos de creación de una reserva
  #validarReserva(bookingData) {
    if (!bookingData || typeof bookingData !== 'object') {
      throw new ValidationError('Los datos de la reserva deben ser un objeto.');
    }

    const errores = [];

    for (const campo of CAMPOS_REQUERIDOS) {
      const valor = bookingData[campo];
      if (typeof valor !== 'string' || valor.trim() === '') {
        errores.push(`"${campo}" es obligatorio`);
      }
    }

    // Validación básica de formato de email
    const email = bookingData.clientEmail;
    if (typeof email === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errores.push('"clientEmail" no tiene un formato válido');
    }

    if (errores.length > 0) {
      throw new ValidationError(
        `Datos de la reserva inválidos: ${errores.join(', ')}.`
      );
    }
  }

  // Crea una reserva (puede iniciarse con services vacío). El id se genera en
  // persistencia; se aplican los valores por defecto de status y services.
  async createBooking(bookingData) {
    this.#validarReserva(bookingData);

    // status es un campo controlado: solo se acepta un valor de la lista blanca;
    // cualquier otra cosa (o su ausencia) cae al valor por defecto 'pending'.
    const status = ESTADOS_PERMITIDOS.includes(bookingData.status)
      ? bookingData.status
      : 'pending';

    const nueva = {
      clientName: bookingData.clientName,
      clientEmail: bookingData.clientEmail,
      date: bookingData.date,
      time: bookingData.time,
      status,
      services: [],
    };

    return this.repository.create(nueva);
  }

  // Devuelve una reserva por id, o null si no existe
  getBookingById(id) {
    return this.repository.getById(id);
  }

  // Asocia un servicio existente a una reserva. Guarda solo el id del servicio y su
  // cantidad; si el servicio ya está en la reserva, incrementa quantity (regla de
  // negocio). Devuelve la reserva actualizada; null si la reserva no existe;
  // lanza NotFoundError si el servicio no existe.
  async addServiceToBooking(bookingId, serviceId) {
    const servicio = await this.servicesService.getServiceById(serviceId);
    if (!servicio) {
      throw new NotFoundError('Servicio no encontrado');
    }

    const reserva = await this.repository.getById(bookingId);
    if (!reserva) {
      return null;
    }

    // Los servicios se guardan como referencias (ObjectId); la comparación se
    // hace por su representación en texto.
    const services = reserva.services.map((s) => ({
      service: s.service,
      quantity: s.quantity,
    }));
    const item = services.find((s) => String(s.service) === String(serviceId));

    if (item) {
      item.quantity += 1;
    } else {
      services.push({ service: serviceId, quantity: 1 });
    }

    return this.repository.update(bookingId, { services });
  }
}

export default new BookingsService(bookingsRepository, servicesService);
