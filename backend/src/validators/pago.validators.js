// validators/pago.validators.js
// Reglas de validación de pagos (FR-007, contracts/api.md §3):
//   id_cliente, id_membresia: requeridos, enteros positivos
//   monto: requerido, numérico > 0
//   metodo_pago: requerido, presente en el catálogo
// ES Modules.

import { body } from 'express-validator';
import { METODOS_PAGO } from '../utils/catalogos.js';

export const reglasCrearPago = [
  body('id_cliente')
    .notEmpty()
    .withMessage('El cliente es obligatorio')
    .isInt({ min: 1 })
    .withMessage('El identificador de cliente debe ser un número entero positivo'),
  body('id_membresia')
    .notEmpty()
    .withMessage('La membresía es obligatoria')
    .isInt({ min: 1 })
    .withMessage('El identificador de membresía debe ser un número entero positivo'),
  body('monto')
    .notEmpty()
    .withMessage('El monto es obligatorio')
    .isFloat({ min: 0.01 })
    .withMessage('El monto debe ser un número positivo'),
  body('metodo_pago')
    .notEmpty()
    .withMessage('El método de pago es obligatorio')
    .isIn(METODOS_PAGO)
    .withMessage(`El método de pago debe ser uno de: ${METODOS_PAGO.join(', ')}`),
];
