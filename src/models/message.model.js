import mongoose from 'mongoose';

// Colección de mensajes. Modela la mensajería del sistema (por ejemplo, avisos o
// consultas de clientes) y queda disponible para las funcionalidades en tiempo
// real que se incorporan en etapas posteriores del proyecto.
const messageSchema = new mongoose.Schema(
  {
    user: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
  },
  { versionKey: false, timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);

export default Message;
