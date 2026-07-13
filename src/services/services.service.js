import servicesRepository from '../repositories/services.repository.js';
import { ValidationError } from '../utils/errors.util.js';

// Campos que componen un servicio (lista blanca; el id se genera en persistencia)
const CAMPOS_REQUERIDOS = [
  'name',
  'description',
  'duration',
  'price',
  'category',
  'available',
];

// El service concentra las reglas de negocio de los servicios. No conoce req/res
// ni la forma en que se persisten los datos: para eso usa el repository.
class ServicesService {
  constructor(repository) {
    this.repository = repository;
  }

  // Deja solo los campos conocidos de un objeto (lista blanca), descartando extras
  #soloCamposConocidos(datos) {
    const resultado = {};
    for (const campo of CAMPOS_REQUERIDOS) {
      if (datos[campo] !== undefined) {
        resultado[campo] = datos[campo];
      }
    }
    return resultado;
  }

  // Valida presencia y tipo de cada campo.
  // Con { parcial: true } solo valida los campos presentes (para actualizar).
  #validarServicio(serviceData, { parcial = false } = {}) {
    if (!serviceData || typeof serviceData !== 'object') {
      throw new ValidationError('Los datos del servicio deben ser un objeto.');
    }

    const esTextoValido = (valor) =>
      typeof valor === 'string' && valor.trim() !== '';
    const esNumeroValido = (valor) =>
      typeof valor === 'number' && !Number.isNaN(valor) && valor >= 0;
    const esBooleanoValido = (valor) => typeof valor === 'boolean';

    const reglas = {
      name: esTextoValido,
      description: esTextoValido,
      category: esTextoValido,
      duration: esNumeroValido,
      price: esNumeroValido,
      available: esBooleanoValido,
    };

    const errores = [];

    for (const campo of CAMPOS_REQUERIDOS) {
      const presente = serviceData[campo] !== undefined;

      if (!presente) {
        if (!parcial) {
          errores.push(`falta "${campo}"`);
        }
        continue;
      }

      if (!reglas[campo](serviceData[campo])) {
        errores.push(`"${campo}" tiene un valor inválido`);
      }
    }

    if (errores.length > 0) {
      throw new ValidationError(
        `Datos del servicio inválidos: ${errores.join(', ')}.`
      );
    }
  }

  // Devuelve todos los servicios
  getServices() {
    return this.repository.getAll();
  }

  // Devuelve un servicio por id, o null si no existe
  getServiceById(id) {
    return this.repository.getById(id);
  }

  // Crea un servicio validado; el id se genera en la capa de persistencia
  async createService(serviceData) {
    this.#validarServicio(serviceData);
    const datos = this.#soloCamposConocidos(serviceData);
    return this.repository.create(datos);
  }

  // Actualiza un servicio existente. No permite modificar el id ni agregar campos
  // extra. Devuelve null si el servicio no existe.
  async updateService(id, updatedData) {
    const existente = await this.repository.getById(id);
    if (!existente) {
      return null;
    }

    // Se descarta cualquier intento de modificar el id y se ignoran campos extra
    const { id: _idIgnorado, ...resto } = updatedData ?? {};
    const datosPermitidos = this.#soloCamposConocidos(resto);

    // Se valida solo lo que llega (modo parcial); datos inválidos cortan el flujo
    this.#validarServicio(datosPermitidos, { parcial: true });

    return this.repository.update(id, datosPermitidos);
  }

  // Elimina un servicio por id; devuelve el eliminado o null si no existe
  deleteService(id) {
    return this.repository.delete(id);
  }
}

export default new ServicesService(servicesRepository);
