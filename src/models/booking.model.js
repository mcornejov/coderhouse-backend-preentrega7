import mongoose from 'mongoose';

// Cada servicio asociado a una reserva se guarda como una referencia (ObjectId)
// al documento de la colección services, junto con su cantidad. Nunca se guarda
// el objeto completo del servicio.
const bookingServiceSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

// Colección de reservas de los clientes
const bookingSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true, trim: true },
    clientEmail: { type: String, required: true, trim: true },
    date: { type: String, required: true, trim: true },
    time: { type: String, required: true, trim: true },
    status: { type: String, default: 'pending', trim: true },
    services: { type: [bookingServiceSchema], default: [] },
  },
  { versionKey: false }
);

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
