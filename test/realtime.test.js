import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { io as ioClient } from 'socket.io-client';

// Verifica la funcionalidad en tiempo real: al crear un servicio (acción real del
// sistema) el servidor emite 'servicesUpdated' y el cliente conectado lo recibe.
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

test('crear un servicio emite servicesUpdated a los clientes conectados', async () => {
  const cliente = ioClient(baseUrl);
  await once(cliente, 'connect');

  // Se prepara la espera del evento antes de disparar la acción
  const esperaEvento = once(cliente, 'servicesUpdated');

  // Acción real del sistema: crear un servicio vía la API REST
  await request(app).post('/api/services').send({
    name: 'Servicio en tiempo real',
    description: 'creado durante el test',
    duration: 30,
    price: 9000,
    category: 'Experiencias',
    available: true,
  });

  const [lista] = await esperaEvento;
  assert.ok(Array.isArray(lista));
  assert.ok(lista.some((s) => s.name === 'Servicio en tiempo real'));

  cliente.close();
});
