import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Los tests corren contra una base MongoDB en memoria (mongodb-memory-server), de
// modo que son aislados y reproducibles, sin tocar la base real de Atlas.
let mem;

before(async () => {
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri(), { dbName: 'test' });
});

after(async () => {
  await mongoose.disconnect();
  await mem.stop();
});

// Cada test parte de colecciones limpias
beforeEach(async () => {
  const colecciones = await mongoose.connection.db.collections();
  for (const c of colecciones) {
    await c.deleteMany({});
  }
});

const { default: app } = await import('../src/app.js');
const { default: request } = await import('supertest');

// Datos de apoyo para crear servicios en los tests
const servicioBase = {
  name: 'Taller de barismo inicial',
  description: 'Introducción práctica a espresso.',
  duration: 90,
  price: 25000,
  category: 'Talleres',
  available: true,
};

async function crearServicio(datos = servicioBase) {
  const res = await request(app).post('/api/services').send(datos);
  return res.body.payload;
}

test('POST /api/services crea un servicio con _id generado por MongoDB', async () => {
  const res = await request(app).post('/api/services').send(servicioBase);
  assert.equal(res.status, 201);
  assert.ok(res.body.payload._id);
  assert.equal(res.body.payload.name, servicioBase.name);
});

test('GET /api/services devuelve la lista de servicios', async () => {
  await crearServicio();
  const res = await request(app).get('/api/services');
  assert.equal(res.status, 200);
  assert.equal(res.body.payload.length, 1);
});

test('GET /api/services?category filtra por categoría', async () => {
  await crearServicio();
  await crearServicio({ ...servicioBase, category: 'Experiencias', name: 'Cata' });
  const res = await request(app).get('/api/services?category=Talleres');
  assert.equal(res.status, 200);
  assert.equal(res.body.payload.length, 1);
  assert.equal(res.body.payload[0].category, 'Talleres');
});

test('GET /api/services/:sid devuelve un servicio existente', async () => {
  const s = await crearServicio();
  const res = await request(app).get(`/api/services/${s._id}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.payload._id, s._id);
});

test('GET /api/services/:sid responde 404 con id inexistente', async () => {
  const res = await request(app).get('/api/services/aaaaaaaaaaaaaaaaaaaaaaaa');
  assert.equal(res.status, 404);
});

test('GET /api/services/:sid responde 404 con id mal formado', async () => {
  const res = await request(app).get('/api/services/no-es-un-id');
  assert.equal(res.status, 404);
});

test('POST /api/services responde 400 si faltan campos', async () => {
  const res = await request(app).post('/api/services').send({ name: 'x' });
  assert.equal(res.status, 400);
});

test('PUT /api/services/:sid actualiza sin cambiar el _id', async () => {
  const s = await crearServicio();
  const res = await request(app)
    .put(`/api/services/${s._id}`)
    .send({ _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', price: 30000 });
  assert.equal(res.status, 200);
  assert.equal(res.body.payload._id, s._id);
  assert.equal(res.body.payload.price, 30000);
});

test('PUT /api/services/:sid responde 404 si no existe', async () => {
  const res = await request(app)
    .put('/api/services/aaaaaaaaaaaaaaaaaaaaaaaa')
    .send({ price: 1 });
  assert.equal(res.status, 404);
});

test('DELETE /api/services/:sid elimina un servicio', async () => {
  const s = await crearServicio();
  const res = await request(app).delete(`/api/services/${s._id}`);
  assert.equal(res.status, 200);
  const verificar = await request(app).get(`/api/services/${s._id}`);
  assert.equal(verificar.status, 404);
});

test('POST /api/bookings crea una reserva con services vacío', async () => {
  const res = await request(app).post('/api/bookings').send({
    clientName: 'Camila Rojas',
    clientEmail: 'camila@example.cl',
    date: '2026-08-01',
    time: '16:00',
  });
  assert.equal(res.status, 201);
  assert.deepEqual(res.body.payload.services, []);
});

test('POST /api/bookings responde 400 con email inválido', async () => {
  const res = await request(app).post('/api/bookings').send({
    clientName: 'Camila',
    clientEmail: 'no-es-mail',
    date: '2026-08-01',
    time: '16:00',
  });
  assert.equal(res.status, 400);
});

test('POST asociar servicio a reserva guarda referencia y suma quantity', async () => {
  const s = await crearServicio();
  const reserva = await request(app).post('/api/bookings').send({
    clientName: 'Diego Soto',
    clientEmail: 'diego@example.cl',
    date: '2026-08-02',
    time: '10:00',
  });
  const bid = reserva.body.payload._id;

  await request(app).post(`/api/bookings/${bid}/services/${s._id}`);
  const segunda = await request(app).post(`/api/bookings/${bid}/services/${s._id}`);

  assert.equal(segunda.status, 200);
  const item = segunda.body.payload.services[0];
  assert.equal(String(item.service), s._id);
  assert.equal(item.quantity, 2);
});

test('POST asociar servicio inexistente responde 404', async () => {
  const reserva = await request(app).post('/api/bookings').send({
    clientName: 'Ana',
    clientEmail: 'ana@example.cl',
    date: '2026-08-03',
    time: '12:00',
  });
  const bid = reserva.body.payload._id;
  const res = await request(app).post(
    `/api/bookings/${bid}/services/aaaaaaaaaaaaaaaaaaaaaaaa`
  );
  assert.equal(res.status, 404);
});

test('POST asociar a reserva inexistente responde 404', async () => {
  const s = await crearServicio();
  const res = await request(app).post(
    `/api/bookings/aaaaaaaaaaaaaaaaaaaaaaaa/services/${s._id}`
  );
  assert.equal(res.status, 404);
});

// --- Vistas server-side (Handlebars) ---

test('GET /views/services renderiza HTML con datos reales de la base', async () => {
  await crearServicio();
  const res = await request(app).get('/views/services');
  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], /html/);
  // El nombre del servicio creado aparece renderizado en la vista
  assert.match(res.text, /Taller de barismo inicial/);
  // La vista incluye el cliente de Socket.io
  assert.match(res.text, /\/socket\.io\/socket\.io\.js/);
});

test('GET /views/availability renderiza HTML de disponibilidad', async () => {
  await crearServicio();
  const res = await request(app).get('/views/availability');
  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], /html/);
  assert.match(res.text, /Disponibilidad/);
});

test('GET /views/availability separa disponibles de no disponibles (datos reales)', async () => {
  await crearServicio({ ...servicioBase, name: 'Servicio disponible', available: true });
  await crearServicio({ ...servicioBase, name: 'Servicio no disponible', available: false });
  const res = await request(app).get('/views/availability');
  assert.equal(res.status, 200);
  // Los nombres reales de la base aparecen en la vista (no está hardcodeada)
  assert.match(res.text, /Servicio disponible/);
  assert.match(res.text, /Servicio no disponible/);
});

// --- Cobertura adicional de la API ---

test('GET /api/bookings/:bid devuelve una reserva existente', async () => {
  const reserva = await request(app).post('/api/bookings').send({
    clientName: 'Valentina Núñez',
    clientEmail: 'vale@example.cl',
    date: '2026-08-10',
    time: '09:30',
  });
  const bid = reserva.body.payload._id;
  const res = await request(app).get(`/api/bookings/${bid}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.payload._id, bid);
});

test('GET /api/bookings/:bid responde 404 con id inexistente', async () => {
  const res = await request(app).get('/api/bookings/aaaaaaaaaaaaaaaaaaaaaaaa');
  assert.equal(res.status, 404);
  assert.equal(res.body.status, 'error');
});

test('DELETE /api/services/:sid responde 404 con id inexistente', async () => {
  const res = await request(app).delete('/api/services/aaaaaaaaaaaaaaaaaaaaaaaa');
  assert.equal(res.status, 404);
});

test('PUT /api/services/:sid responde 400 con name vacío', async () => {
  const s = await crearServicio();
  const res = await request(app).put(`/api/services/${s._id}`).send({ name: '  ' });
  assert.equal(res.status, 400);
});

test('GET /api/services?available=false filtra por disponibilidad', async () => {
  await crearServicio({ ...servicioBase, available: true });
  await crearServicio({ ...servicioBase, name: 'No disp', available: false });
  const res = await request(app).get('/api/services?available=false');
  assert.equal(res.status, 200);
  assert.ok(res.body.payload.every((s) => s.available === false));
});

test('POST /api/bookings ignora un status arbitrario y usa pending', async () => {
  const res = await request(app).post('/api/bookings').send({
    clientName: 'Tomás Vera',
    clientEmail: 'tomas@example.cl',
    date: '2026-08-11',
    time: '15:00',
    status: 'estado-inventado',
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.payload.status, 'pending');
});

test('GET / redirige a la vista de servicios', async () => {
  const res = await request(app).get('/').redirects(0);
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/views/services');
});
