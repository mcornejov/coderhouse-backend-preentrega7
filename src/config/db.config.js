import mongoose from 'mongoose';
import config from './env.config.js';

// Establece la conexión con MongoDB Atlas usando Mongoose. Se llama una sola vez
// al iniciar el servidor. Si la conexión falla, la app no debe seguir arrancando.
export async function connectDB() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Conexión con MongoDB Atlas establecida.');
  } catch (error) {
    console.error('No se pudo conectar con MongoDB Atlas:', error.message);
    process.exit(1);
  }
}
