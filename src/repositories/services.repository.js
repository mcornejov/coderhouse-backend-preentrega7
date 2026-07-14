import servicesDao from '../dao/services.dao.js';

// El repository ofrece métodos de acceso a datos y desacopla a la capa de
// servicio de la fuente concreta de persistencia (hoy MongoDB/Mongoose vía DAO;
// mañana podría ser otra fuente, sin tocar el service). No contiene reglas de
// negocio.
class ServicesRepository {
  constructor(dao) {
    this.dao = dao;
  }

  getAll(filtro) {
    return this.dao.getAll(filtro);
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

  delete(id) {
    return this.dao.delete(id);
  }
}

export default new ServicesRepository(servicesDao);
