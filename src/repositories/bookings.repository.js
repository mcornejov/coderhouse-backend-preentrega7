import bookingsDao from '../dao/bookings.dao.js';

// El repository ofrece métodos de acceso a datos y desacopla a la capa de
// servicio de la fuente concreta de persistencia. No contiene reglas de negocio.
class BookingsRepository {
  constructor(dao) {
    this.dao = dao;
  }

  getById(id) {
    return this.dao.getById(id);
  }

  create(data) {
    return this.dao.create(data);
  }

  update(id, data) {
    return this.dao.update(id, data);
  }
}

export default new BookingsRepository(bookingsDao);
