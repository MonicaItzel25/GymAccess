// validators/validar.js
// Ejecuta las reglas de express-validator de una ruta y responde 400 con
// el primer mensaje en español si la validación falla. ES Modules.

import { validationResult } from 'express-validator';

export function validar(req, res, next) {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({
      ok: false,
      message: errores.array()[0].msg,
    });
  }
  return next();
}
