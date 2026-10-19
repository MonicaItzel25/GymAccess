// validators/membresia.validators.js
// Reglas de validación de membresías (FR-006, FR-007):
//   id_cliente e id_tipo_membresia: requeridos, enteros positivos
//   fecha_inicio: opcional, con formato de fecha
// ES Modules.

import { body, param } from 'express-validator';

export const reglasCrearMembresia = [
  body('id_cliente')
    .notEmpty()
    .withMessage('El cliente es obligatorio')
    .isInt({ min: 1 })
    .withMessage('El identificador de cliente debe ser un número entero positivo'),
  body('id_tipo_membresia')
    .notEmpty()
    .withMessage('El tipo de membresía es obligatorio')
    .isInt({ min: 1 })
    .withMessage('El identificador de tipo de membresía debe ser un número entero positivo'),
  body('fecha_inicio')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('La fecha de inicio no tiene un formato válido')
    .toDate(),
  // El precio lo decide el servidor (principio II): se rechaza si el cliente lo envía.
  body('precio_acordado')
    .optional()
    .bail()
    .custom(() => {
      throw new Error('El precio_acordado lo determina el servidor y no puede enviarse en la petición');
    }),
];

export const reglasRenovarMembresia = [
  param('id').isInt({ min: 1 }).withMessage('El identificador de membresía debe ser un número entero positivo'),
  body('id_tipo_membresia')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('El identificador de tipo de membresía debe ser un número entero positivo'),
  body('fecha_inicio')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('La fecha de inicio no tiene un formato válido')
    .toDate(),
  body('precio_acordado')
    .optional()
    .bail()
    .custom(() => {
      throw new Error('El precio_acordado lo determina el servidor y no puede enviarse en la petición');
    }),
];

export const reglasIdMembresia = [
  param('id').isInt({ min: 1 }).withMessage('El identificador de membresía debe ser un número entero positivo'),
];
