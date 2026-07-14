import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import servicesRouter from './routes/services.router.js';
import bookingsRouter from './routes/bookings.router.js';
import viewsRouter from './routes/views.router.js';

// Reconstrucción de __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares para interpretar el body de las peticiones (JSON y formularios)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos (CSS y JS del cliente, incluido el socket)
app.use(express.static(path.join(__dirname, 'public')));

// Motor de vistas Handlebars
app.engine(
  'handlebars',
  engine({
    helpers: {
      // Formatea un precio como pesos chilenos (por ejemplo, 15000 -> $15.000)
      clp: (valor) => `$${Number(valor).toLocaleString('es-CL')}`,
      // Muestra la duración en minutos
      min: (valor) => `${valor} min`,
    },
  })
);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Rutas de la API REST
app.use('/api/services', servicesRouter);
app.use('/api/bookings', bookingsRouter);

// Rutas de las vistas server-side
app.use('/views', viewsRouter);

// La raíz redirige a la vista de servicios (mejor primera impresión que un 404)
app.get('/', (req, res) => {
  res.redirect('/views/services');
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ status: 'error', error: 'Ruta no encontrada' });
});

// Middleware de manejo de errores (cuatro argumentos)
app.use((err, req, res, next) => {
  // Body con JSON mal formado: es un error del cliente, no del servidor
  if (err.type === 'entity.parse.failed') {
    return res
      .status(400)
      .json({ status: 'error', error: 'El body de la petición no es un JSON válido.' });
  }

  console.error(err);
  res.status(500).json({ status: 'error', error: 'Error interno del servidor' });
});

export default app;
