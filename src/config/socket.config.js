import { Server } from 'socket.io';

// Inicializa Socket.io sobre el servidor HTTP y lo deja accesible desde la app
// (app.get('io')) para que los controllers puedan emitir eventos ante acciones
// concretas del sistema (crear, actualizar o eliminar un servicio).
export function initSocket(httpServer, app) {
  const io = new Server(httpServer);

  // Se comparte la instancia de io con el resto de la app vía el objeto Express
  app.set('io', io);

  io.on('connection', (socket) => {
    console.log(`Cliente conectado por WebSocket: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
}
