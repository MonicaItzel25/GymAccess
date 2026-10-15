// middlewares/errorHandler.js
// Manejo de errores centralizado (principio IX de la constitución).
// El detalle completo solo se registra en el servidor; el cliente recibe
// un mensaje genérico en español sin información interna.
// ES Modules.

/** Manejador final de errores: cualquier excepción no capturada cae aquí. */
export function errorHandler(error, req, res, next) {
  // El detalle se guarda en el log del servidor, nunca en la respuesta.
  console.error(
    `${new Date().toISOString()} | ERROR | ${req.method} ${req.originalUrl} | ${
      error.message
    }`
  );

  if (res.headersSent) {
    return next(error);
  }

  const estado = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  const mensaje =
    estado === 500 ? 'Error interno del servidor' : error.message;

  return res.status(estado).json({ ok: false, message: mensaje });
}
