// validators/dashboard.validators.js
// Periodo del dashboard (contrato §8): `desde` y `hasta` opcionales, fechas
// reales con formato YYYY-MM-DD. El orden se comprueba en el servicio, después
// de completar los valores por defecto. ES Modules.

import { query } from 'express-validator';

const MENSAJE = 'El periodo de fechas es inválido';

const fechaOpcional = (campo) =>
  query(campo)
    .optional({ values: 'falsy' })
    .isString()
    .withMessage(MENSAJE)
    .bail()
    .matches(/^[1-9]\d{3}-\d{2}-\d{2}$/)
    .withMessage(MENSAJE)
    .bail()
    .isISO8601({ strict: true })
    .withMessage(MENSAJE);

export const reglasPeriodo = [fechaOpcional('desde'), fechaOpcional('hasta')];
