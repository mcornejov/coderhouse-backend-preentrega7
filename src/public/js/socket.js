// Cliente de Socket.io. Escucha el evento 'servicesUpdated' que emite el servidor
// cuando ocurre una acción concreta del sistema (crear, actualizar o eliminar un
// servicio) y refresca la vista correspondiente sin recargar la página.

const socket = io();

// --- Utilidades de formato (equivalentes a los helpers de Handlebars) ---
const clp = (valor) => `$${Number(valor).toLocaleString('es-CL')}`;
const min = (valor) => `${valor} min`;
const escapar = (texto) =>
  String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// --- Vista de servicios (/views/services) ---
const servicesBody = document.getElementById('services-body');

function renderServicios(services) {
  if (!servicesBody) return;

  servicesBody.innerHTML = services
    .map(
      (s) => `
      <tr data-id="${s._id}">
        <td>${escapar(s.name)}</td>
        <td>${escapar(s.description)}</td>
        <td>${min(s.duration)}</td>
        <td>${clp(s.price)}</td>
        <td>${escapar(s.category)}</td>
        <td>${s.available ? 'Sí' : 'No'}</td>
        <td><button class="btn-eliminar" data-id="${s._id}">Eliminar</button></td>
      </tr>`
    )
    .join('');

  const count = document.getElementById('services-count');
  if (count) count.textContent = services.length;

  const vacia = document.getElementById('tabla-vacia');
  if (vacia) vacia.hidden = services.length > 0;
}

// --- Vista de disponibilidad (/views/availability) ---
const disponiblesList = document.getElementById('disponibles-list');
const noDisponiblesList = document.getElementById('no-disponibles-list');

function renderDisponibilidad(services) {
  if (!disponiblesList && !noDisponiblesList) return;

  const disponibles = services.filter((s) => s.available);
  const noDisponibles = services.filter((s) => !s.available);

  if (disponiblesList) {
    disponiblesList.innerHTML = disponibles
      .map(
        (s) => `
        <li data-id="${s._id}">
          <strong>${escapar(s.name)}</strong> · ${escapar(s.category)} · ${clp(s.price)} · ${min(s.duration)}
        </li>`
      )
      .join('');
  }

  if (noDisponiblesList) {
    noDisponiblesList.innerHTML = noDisponibles
      .map(
        (s) => `
        <li data-id="${s._id}">
          <strong>${escapar(s.name)}</strong> · ${escapar(s.category)} · ${clp(s.price)}
        </li>`
      )
      .join('');
  }

  const cd = document.getElementById('disponibles-count');
  if (cd) cd.textContent = disponibles.length;
  const cnd = document.getElementById('no-disponibles-count');
  if (cnd) cnd.textContent = noDisponibles.length;

  const vd = document.getElementById('disponibles-vacio');
  if (vd) vd.hidden = disponibles.length > 0;
  const vnd = document.getElementById('no-disponibles-vacio');
  if (vnd) vnd.hidden = noDisponibles.length > 0;
}

// Evento en tiempo real: el servidor manda la lista actualizada de servicios
socket.on('servicesUpdated', (services) => {
  renderServicios(services);
  renderDisponibilidad(services);
});

// --- Alta de servicios desde el formulario de la vista ---
const form = document.getElementById('service-form');
const mensaje = document.getElementById('form-mensaje');

if (form) {
  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const payload = {
      name: form.name.value.trim(),
      description: form.description.value.trim(),
      duration: Number(form.duration.value),
      price: Number(form.price.value),
      category: form.category.value.trim(),
      available: form.available.checked,
    };

    try {
      const respuesta = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const datos = await respuesta.json();

      if (respuesta.ok) {
        form.reset();
        form.available.checked = true;
        if (mensaje) mensaje.textContent = 'Servicio creado correctamente.';
      } else if (mensaje) {
        mensaje.textContent = datos.error ?? 'No se pudo crear el servicio.';
      }
    } catch (error) {
      if (mensaje) mensaje.textContent = 'Error de conexión al crear el servicio.';
    }
  });
}

// --- Baja de servicios (delegación en el cuerpo de la tabla) ---
if (servicesBody) {
  servicesBody.addEventListener('click', async (evento) => {
    const boton = evento.target.closest('.btn-eliminar');
    if (!boton) return;

    const id = boton.dataset.id;
    try {
      await fetch(`/api/services/${id}`, { method: 'DELETE' });
      // La tabla se actualiza sola al recibir 'servicesUpdated'.
    } catch (error) {
      if (mensaje) mensaje.textContent = 'Error de conexión al eliminar el servicio.';
    }
  });
}
