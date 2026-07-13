import { createServer } from 'http';
import config from './config/env.config.js';
import { connectDB } from './config/db.config.js';
import { initSocket } from './config/socket.config.js';
import app from './app.js';

// Primero se establece la conexión con MongoDB y recién después se levanta el
// servidor HTTP, para no aceptar peticiones sin base de datos disponible.
await connectDB();

// Se crea un servidor HTTP explícito para poder montar Socket.io sobre él,
// además de servir la app de Express.
const httpServer = createServer(app);
initSocket(httpServer, app);

httpServer.listen(config.port, () => {
  console.log(
    `Servidor de turnos y reservas escuchando en http://localhost:${config.port} (modo ${config.nodeEnv})`
  );
});
