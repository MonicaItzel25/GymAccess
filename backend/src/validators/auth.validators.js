// validators/auth.validators.js
// Reglas de validación del inicio de sesión (FR-001, spec Sprint 1). ES Modules.

import { body } from 'express-validator';

export const reglasLogin = [
  body('correo')
    .trim()
    .notEmpty()
    .withMessage('El correo es obligatorio')
    .isEmail()
    .withMessage('El correo no tiene un formato válido'),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es obligatoria'),
];
