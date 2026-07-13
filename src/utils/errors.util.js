// Error de validación de datos. Permite que la capa de controllers distinga un
// error del cliente (400) de un error interno del servidor (500).
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Error de recurso inexistente. La capa de controllers lo traduce a un 404.
export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}
