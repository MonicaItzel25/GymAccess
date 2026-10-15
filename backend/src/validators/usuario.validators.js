// validators/usuario.validators.js
// Reglas de validación para la gestión de usuarios.
// Política de contraseña: mínimo 8 caracteres, al menos una mayúscula y un
// número (FR-028). ES Modules.

import { body } from 'express-validator';

const ROLES_PERMITIDOS = ['administrador', 'recepcionista', 'entrenador', 'cliente'];

const reglasPassword = body('password')
  .notEmpty()
  .withMessage('La contraseña es obligatoria')
  .isLength({ min: 8 })
  .withMessage('La contraseña debe tener al menos 8 caracteres')
  .matches(/[A-Z]/)
  .withMessage('La contraseña debe incluir al menos una letra mayúscula')
  .matches(/\d/)
  .withMessage('La contraseña debe incluir al menos un número');

export const reglasCrearUsuario = [
  body('nombre')
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .trim(),
  body('correo')
    .trim()
    .notEmpty()
    .withMessage('El correo es obligatorio')
    .isEmail()
    .withMessage('El correo no tiene un formato válido')
    .normalizeEmail(),
  reglasPassword,
  body('rol')
    .isIn(ROLES_PERMITIDOS)
    .withMessage('El rol no es válido'),
];

// Para la modificación: los campos son opcionales pero, si vienen, validan.
export const reglasModificarUsuario = [
  body('nombre')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .trim(),
  body('correo')
    .optional()
    .trim()
    .isEmail()
    .withMessage('El correo no tiene un formato válido')
    .normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/)
    .withMessage('La contraseña debe incluir al menos una letra mayúscula')
    .matches(/\d/)
    .withMessage('La contraseña debe incluir al menos un número'),
  body('rol')
    .optional()
    .isIn(ROLES_PERMITIDOS)
    .withMessage('El rol no es válido'),
  body('estado')
    .optional()
    .isIn(['activo', 'inactivo'])
    .withMessage('El estado no es válido'),
];
