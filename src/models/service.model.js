import mongoose from 'mongoose';

// Colección de servicios (experiencias reservables de Café Aurora)
const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    duration: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    available: { type: Boolean, required: true },
  },
  { versionKey: false }
);

const Service = mongoose.model('Service', serviceSchema);

export default Service;
