import { Server } from 'socket.io';
import servicesService from '../services/services.service.js';

// Inicializa Socket.io sobre el servidor HTTP y lo deja accesible desde la app
// (app.get('io')) para que los controllers puedan emitir eventos ante acciones
// concretas del sistema (crear, actualizar o eliminar un servicio).
export function initSocket(httpServer, app) {
  const io = new Server(httpServer);

  // Se comparte la instancia de io con el resto de la app vía el objeto Express
  app.set('io', io);

  io.on('connection', async (socket) => {
    console.log(`Cliente conectado por WebSocket: ${socket.id}`);

    // Se envía SOLO al cliente recién conectado el estado actual de servicios,
    // por si la base cambió entre el render server-side y la conexión del socket.
    try {
      const services = await servicesService.getServices();
      socket.emit('servicesUpdated', services);
    } catch (error) {
      console.error('No se pudo enviar el estado inicial de servicios:', error);
    }

    socket.on('disconnect', () => {
      console.log(`Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
}
