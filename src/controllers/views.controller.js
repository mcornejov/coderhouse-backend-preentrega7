import servicesService from '../services/services.service.js';

// El controller de vistas usa las mismas capas que la API (service → repository →
// DAO → model). No contiene reglas de negocio ni datos hardcodeados: toda la
// información proviene de MongoDB.

// GET /views/services -> renderiza el listado de servicios desde la base de datos
export async function renderServices(req, res) {
  try {
    const services = await servicesService.getServices();
    res.render('services', {
      titulo: 'Servicios · Café Aurora',
      services,
      hayServicios: services.length > 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('services', {
      titulo: 'Servicios · Café Aurora',
      services: [],
      hayServicios: false,
      error: 'No se pudieron cargar los servicios.',
    });
  }
}

// GET /views/availability -> renderiza la disponibilidad de los servicios con
// datos reales de la base de datos, separando disponibles de no disponibles.
export async function renderAvailability(req, res) {
  try {
    const services = await servicesService.getServices();
    const disponibles = services.filter((s) => s.available);
    const noDisponibles = services.filter((s) => !s.available);

    res.render('availability', {
      titulo: 'Disponibilidad · Café Aurora',
      disponibles,
      noDisponibles,
      totalDisponibles: disponibles.length,
      totalNoDisponibles: noDisponibles.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('availability', {
      titulo: 'Disponibilidad · Café Aurora',
      disponibles: [],
      noDisponibles: [],
      error: 'No se pudo cargar la disponibilidad.',
    });
  }
}
