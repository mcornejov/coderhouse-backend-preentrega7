import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { io as ioClient } from 'socket.io-client';

// Verifica la funcionalidad en tiempo real: ante una acción real del sistema
// (crear o eliminar un servicio) el servidor emite 'servicesUpdated' y el
// cliente conectado lo recibe.
let mem;
let httpServer;
let baseUrl;
let app;
let request;

before(async () => {
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri(), { dbName: 'test' });

  const { default: appModule } = await import('../src/app.js');
  const { initSocket } = await import('../src/config/socket.config.js');
  const { default: supertest } = await import('supertest');

  app = appModule;
  request = supertest;

  // Se levanta un servidor HTTP real con Socket.io montado, en un puerto libre
  httpServer = createServer(app);
  initSocket(httpServer, app);
  httpServer.listen(0);
  await once(httpServer, 'listening');
  const { port } = httpServer.address();
  baseUrl = `http://localhost:${port}`;
});

after(async () => {
  httpServer?.close();
  await mongoose.disconnect();
  await mem.stop();
});

// Espera un evento 'servicesUpdated' cuya lista cumpla el predicado. Es robusto
// ante el estado inicial que el servidor emite al conectar el socket.
function esperarServicesUpdated(cliente, predicado, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const temporizador = setTimeout(() => {
      cliente.off('servicesUpdated', manejador);
      reject(new Error('No llegó un servicesUpdated que cumpla el predicado.'));
    }, timeoutMs);

    function manejador(lista) {
      if (predicado(lista)) {
        clearTimeout(temporizador);
        cliente.off('servicesUpdated', manejador);
        resolve(lista);
      }
    }

    cliente.on('servicesUpdated', manejador);
  });
}

test('crear un servicio emite servicesUpdated a los clientes conectados', async () => {
  const cliente = ioClient(baseUrl);
  await once(cliente, 'connect');

  const espera = esperarServicesUpdated(cliente, (lista) =>
    lista.some((s) => s.name === 'Servicio en tiempo real')
  );

  // Acción real del sistema: crear un servicio vía la API REST
  await request(app).post('/api/services').send({
    name: 'Servicio en tiempo real',
    description: 'creado durante el test',
    duration: 30,
    price: 9000,
    category: 'Experiencias',
    available: true,
  });

  const lista = await espera;
  assert.ok(lista.some((s) => s.name === 'Servicio en tiempo real'));

  cliente.close();
});

test('eliminar un servicio emite servicesUpdated sin ese servicio', async () => {
  // Se crea el servicio a eliminar
  const creado = await request(app).post('/api/services').send({
    name: 'Servicio a eliminar',
    description: 'se borrará durante el test',
    duration: 20,
    price: 4000,
    category: 'Experiencias',
    available: true,
  });
  const id = creado.body.payload._id;

  const cliente = ioClient(baseUrl);
  await once(cliente, 'connect');

  // Se espera un evento cuya lista YA no contenga el servicio eliminado
  const espera = esperarServicesUpdated(
    cliente,
    (lista) => !lista.some((s) => s._id === id)
  );

  // Acción real: eliminar el servicio (equivale al botón Eliminar de la vista)
  await request(app).delete(`/api/services/${id}`);

  const lista = await espera;
  assert.ok(!lista.some((s) => s._id === id));

  cliente.close();
});
