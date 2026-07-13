import mongoose from 'mongoose';
import Booking from '../models/booking.model.js';

// El DAO lee y escribe directamente en la colección de MongoDB a través del
// modelo de Mongoose. No conoce reglas de negocio: solo expone operaciones de
// acceso a datos.
class BookingsDao {
  // Devuelve una reserva por id, o null si no existe o el id no es válido
  getById(id) {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }
    return Booking.findById(id).lean();
  }

  // Crea una reserva; el id (_id) lo genera MongoDB
  async create(data) {
    const creada = await Booking.create(data);
    return creada.toObject();
  }

  // Actualiza una reserva; devuelve la actualizada o null si no existe
  update(id, data) {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }
    return Booking.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
  }
}

export default new BookingsDao();
