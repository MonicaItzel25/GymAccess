// validators/accesoManual.validators.js
// Reglas de validación de la autorización manual de ingreso (FR-030,
// contracts/api-sprint2.md §1.1):
//   id_cliente: requerido, entero > 0
//   resultado: requerido, "autorizado" | "rechazado"
//   motivo: obligatorio cuando resultado="rechazado"; opcional (null) al autorizar
// ES Modules.

import { body } from 'express-validator';

export const reglasAccesoManual = [
  body('id_cliente')
    .notEmpty()
    .withMessage('El cliente es obligatorio')
    .isInt({ min: 1 })
    .withMessage('El identificador de cliente debe ser un número entero positivo'),
  body('resultado')
    .notEmpty()
    .withMessage('El resultado es obligatorio')
    .isIn(['autorizado', 'rechazado'])
    .withMessage('El resultado debe ser "autorizado" o "rechazado"'),
  body('motivo')
    .optional({ nullable: true })
    .isString()
    .withMessage('El motivo debe ser una cadena')
    .isLength({ max: 100 })
    .withMessage('El motivo no puede exceder 100 caracteres')
    .custom((valor, { req }) => {
      if (req.body.resultado === 'rechazado' && (!valor || !String(valor).trim())) {
        throw new Error('El motivo es obligatorio cuando el resultado es "rechazado"');
      }
      return true;
    }),
];
