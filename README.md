# Café Aurora · API + Vistas de Servicios y Reservas (Turnos)

Aplicación backend construida con **Node.js + Express** (ES Modules) para el Sistema de Turnos
y Reservas de Café Aurora. Mantiene la **API REST** y la persistencia en **MongoDB Atlas**
(Mongoose) de las etapas anteriores, y suma una **capa de vistas server-side con Handlebars**
y **comunicación en tiempo real con Socket.io**.

La API REST no cambia su comportamiento. Las vistas y el tiempo real se agregan encima,
reutilizando la misma arquitectura en capas: los controllers de vistas usan el mismo
`service → repository → DAO → model` que la API, sin datos hardcodeados.

## Novedades de esta etapa

- **Handlebars** como motor de vistas server-side.
- `GET /views/services`: listado de servicios traído desde MongoDB (nombre, descripción,
  duración, precio, categoría y disponibilidad), con un formulario para crear servicios.
- `GET /views/availability`: disponibilidad de los servicios con datos reales, separando
  disponibles de no disponibles.
- **Socket.io**: al crear, actualizar o eliminar un servicio (acciones reales del sistema),
  el servidor emite `servicesUpdated` y las vistas se refrescan **sin recargar la página**.

## Arquitectura

```
API REST:   router → controller → service → repository → DAO → Mongoose → MongoDB
Vistas:     views.router → views.controller → service → repository → DAO → Mongoose → MongoDB
Tiempo real: acción en el controller de services → io.emit('servicesUpdated') → vistas
```

| Capa            | Responsabilidad                                                             |
|-----------------|-----------------------------------------------------------------------------|
| **Router**      | Define endpoints (API y vistas) y los conecta con su controller.            |
| **Controller**  | Lee `req`, llama al service y responde (JSON o `res.render`).               |
| **Service**     | Reglas de negocio. No conoce `req`/`res` ni la persistencia.                 |
| **Repository**  | Acceso a datos desacoplado de la fuente.                                     |
| **DAO**         | Lee y escribe en MongoDB vía modelos de Mongoose.                           |
| **Views/Public**| Plantillas Handlebars y assets estáticos (CSS y cliente de Socket.io).      |

## Requisitos

- Node.js 18 o superior.
- Una base de datos en **MongoDB Atlas** (o un MongoDB accesible por URI).

## Instalación

```bash
git clone https://github.com/mcornejov/coderhouse-backend-preentrega7.git
cd coderhouse-backend-preentrega7
pnpm install
```

## Variables de entorno

Crea un archivo `.env` en la raíz tomando como referencia `.env.example`:

```bash
PORT=8080
NODE_ENV=development
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/cafe_aurora
```

| Variable    | Descripción                        | Ejemplo                                 |
|-------------|------------------------------------|-----------------------------------------|
| `PORT`      | Puerto en el que escucha el server | `8080`                                  |
| `NODE_ENV`  | Entorno de ejecución               | `development`                           |
| `MONGO_URI` | URI de conexión a MongoDB Atlas    | `mongodb+srv://...@cluster/cafe_aurora` |

Si falta una variable obligatoria, la app no inicia (patrón Fail-Fast). El `.env` **no** se
sube al repositorio: contiene credenciales.

## Ejecución

```bash
pnpm start       # levanta el servidor (src/server.js)
pnpm dev         # levanta con recarga automática (node --watch)
```

## Vistas

Con el servidor corriendo:

- **`http://localhost:8080/views/services`** — tabla de servicios en tiempo real más un
  formulario para crear servicios. También permite eliminar servicios.
- **`http://localhost:8080/views/availability`** — disponibilidad de los servicios,
  separando disponibles de no disponibles.

### Cómo verificar el tiempo real

1. Abre `/views/services` en **dos pestañas** del navegador.
2. En una, crea un servicio con el formulario (o elimínalo con el botón).
3. La tabla se actualiza sola en **ambas** pestañas, sin recargar. Lo mismo ocurre con la
   vista `/views/availability` si el servicio cambia su disponibilidad.

## Endpoints de la API REST

### Recurso `services` — base `/api/services`

| Método   | Ruta                 | Descripción                                         | Códigos       |
|----------|----------------------|-----------------------------------------------------|---------------|
| `GET`    | `/api/services`      | Lista todos los servicios. Filtros por query params.| `200`         |
| `GET`    | `/api/services/:sid` | Devuelve un servicio por id.                        | `200` / `404` |
| `POST`   | `/api/services`      | Crea un servicio.                                   | `201` / `400` |
| `PUT`    | `/api/services/:sid` | Actualiza un servicio. No permite modificar el id.  | `200` / `404` / `400` |
| `DELETE` | `/api/services/:sid` | Elimina un servicio.                                | `200` / `404` |

### Recurso `bookings` — base `/api/bookings`

| Método | Ruta                                | Descripción                                            | Códigos       |
|--------|-------------------------------------|--------------------------------------------------------|---------------|
| `POST` | `/api/bookings`                     | Crea una reserva (puede iniciar con `services` vacío). | `201` / `400` |
| `GET`  | `/api/bookings/:bid`                | Devuelve una reserva por id.                           | `200` / `404` |
| `POST` | `/api/bookings/:bid/services/:sid`  | Asocia un servicio existente a la reserva.             | `200` / `404` |

## Estructura del proyecto

```
src/
  config/
    env.config.js               # Variables de entorno (Fail-Fast)
    db.config.js                # Conexión a MongoDB Atlas
    socket.config.js            # Inicialización de Socket.io
  models/
    service.model.js
    booking.model.js
    message.model.js
  controllers/
    services.controller.js      # API de services (emite eventos en tiempo real)
    bookings.controller.js
    views.controller.js         # Renderiza las vistas con datos reales
  services/
    services.service.js
    bookings.service.js
  repositories/
    services.repository.js
    bookings.repository.js
  dao/
    services.dao.js
    bookings.dao.js
  routes/
    services.router.js
    bookings.router.js
    views.router.js             # Endpoints de las vistas
  views/
    layouts/main.handlebars     # Layout base
    services.handlebars         # Vista de servicios + formulario
    availability.handlebars     # Vista de disponibilidad
  public/
    css/styles.css              # Estilos
    js/socket.js                # Cliente de Socket.io (actualiza las vistas)
  utils/
    errors.util.js
    responses.util.js
  app.js                        # Express + Handlebars + estáticos + routers
  server.js                     # Conecta a Mongo, monta Socket.io y levanta el server
.env.example
.gitignore
package.json
README.md
```
