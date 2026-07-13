// Helpers de respuesta compartidos por los controllers, para mantener un
// formato de respuesta uniforme en toda la API.

// Responde un error interno sin filtrar detalles del servidor al cliente
export function responderErrorInterno(res, error) {
  console.error(error);
  return res
    .status(500)
    .json({ status: 'error', error: 'Error interno del servidor' });
}
