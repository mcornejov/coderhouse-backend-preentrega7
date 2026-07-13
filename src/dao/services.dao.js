import mongoose from 'mongoose';
import Service from '../models/service.model.js';

// El DAO lee y escribe directamente en la colección de MongoDB a través del
// modelo de Mongoose. No conoce reglas de negocio: solo expone operaciones de
// acceso a datos.
class ServicesDao {
  // Devuelve todos los servicios que cumplan el filtro (por defecto, todos)
  getAll(filtro = {}) {
    return Service.find(filtro).lean();
  }

  // Devuelve un servicio por id, o null si no existe o el id no es un ObjectId válido
  getById(id) {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }
    return Service.findById(id).lean();
  }

  // Crea un servicio; el id (_id) lo genera MongoDB
  async create(data) {
    const creado = await Service.create(data);
    return creado.toObject();
  }

  // Actualiza un servicio; devuelve el actualizado o null si no existe
  update(id, data) {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }
    return Service.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
  }

  // Elimina un servicio; devuelve el eliminado o null si no existe
  delete(id) {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }
    return Service.findByIdAndDelete(id).lean();
  }
}

export default new ServicesDao();
