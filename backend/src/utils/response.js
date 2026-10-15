// utils/response.js
// Formato único de respuesta de la API (research D-07):
//   éxito:   { ok: true, data }
//   error:   { ok: false, message }
// ES Modules.

/** Responde con éxito y datos en formato envuelto. */
export function enviarOk(res, data, estado = 200) {
  return res.status(estado).json({ ok: true, data });
}

/** Responde con un error y mensaje en español (sin detalles internos). */
export function enviarError(res, mensaje, estado = 500) {
  return res.status(estado).json({ ok: false, message: mensaje });
}

/** Envuelve un controlador asíncrono para que sus errores pasen al
 *  middleware centralizado de errores. */
export function envolverControlador(fn) {
  return function controladorEnvuelto(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
