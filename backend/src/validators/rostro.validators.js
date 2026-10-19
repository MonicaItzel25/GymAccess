// validators/rostro.validators.js
// Reglas de validación de la información facial (FR-021, FR-022):
//   descriptor_facial: requerido, arreglo de exactamente 128 números.
// ES Modules.

import { body, param } from 'express-validator';

/** Valida que el descriptor sea un arreglo de 128 elementos numéricos. */
export const reglasRegistrarRostro = [
  param('id').isInt({ min: 1 }).withMessage('El identificador de cliente debe ser un número entero positivo'),
  body('descriptor_facial')
    .notEmpty()
    .withMessage('El descriptor facial es obligatorio')
    .isArray({ min: 128, max: 128 })
    .withMessage('El descriptor facial debe ser un arreglo de 128 números')
    .bail()
    .custom((arreglo) => arreglo.every((n) => typeof n === 'number' && Number.isFinite(n)))
    .withMessage('El descriptor facial debe contener solo números válidos'),
];

/** Reglas para las rutas que reciben el identificador de cliente. */
export const reglasIdClienteRostro = [
  param('id').isInt({ min: 1 }).withMessage('El identificador de cliente debe ser un número entero positivo'),
];
