// validators/cliente.validators.js
// Reglas de validación de clientes (data-model.md / FR-013, FR-014):
//   nombre y apellido: requeridos, 2–100 caracteres
//   correo: opcional, formato válido y único si existe
//   telefono: opcional, hasta 20 caracteres
// ES Modules.

import { body } from 'express-validator';

export const reglasCrearCliente = [
  body('nombre')
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .trim(),
  body('apellido')
    .notEmpty()
    .withMessage('El apellido es obligatorio')
    .isLength({ min: 2, max: 100 })
    .withMessage('El apellido debe tener entre 2 y 100 caracteres')
    .trim(),
  body('correo')
    .optional({ nullable: true })
    .isEmail()
    .withMessage('El correo no tiene un formato válido')
    .normalizeEmail(),
  body('telefono')
    .optional({ nullable: true })
    .isLength({ max: 20 })
    .withMessage('El teléfono no puede exceder 20 caracteres')
    .matches(/^[0-9+\-\s()]*$/)
    .withMessage('El teléfono solo puede contener dígitos, espacios y los símbolos + - ( )'),
  body('direccion')
    .optional({ nullable: true })
    .isLength({ max: 200 })
    .withMessage('La dirección no puede exceder 200 caracteres'),
];

// Para la modificación los campos son opcionales pero, si vienen, validan.
export const reglasModificarCliente = [
  body('nombre')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .trim(),
  body('apellido')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('El apellido debe tener entre 2 y 100 caracteres')
    .trim(),
  body('correo')
    .optional({ nullable: true })
    .isEmail()
    .withMessage('El correo no tiene un formato válido')
    .normalizeEmail(),
  body('telefono')
    .optional({ nullable: true })
    .isLength({ max: 20 })
    .withMessage('El teléfono no puede exceder 20 caracteres')
    .matches(/^[0-9+\-\s()]*$/)
    .withMessage('El teléfono solo puede contener dígitos, espacios y los símbolos + - ( )'),
  body('direccion')
    .optional({ nullable: true })
    .isLength({ max: 200 })
    .withMessage('La dirección no puede exceder 200 caracteres'),
];
