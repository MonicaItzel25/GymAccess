// validators/entrenador.validators.js
// Reglas de validación de perfiles de entrenador (Sprint 3, data-model §1):
//   id_usuario: requerido, entero > 0
//   especialidad: opcional, hasta 150 caracteres
//   telefono: opcional, hasta 20 caracteres (mismos símbolos que clientes)
//   estado: solo 'activo' | 'inactivo'
// ES Modules.

import { body, param } from 'express-validator';

export const reglasCrearEntrenador = [
  body('id_usuario')
    .notEmpty()
    .withMessage('El id_usuario es obligatorio')
    .isInt({ gt: 0 })
    .withMessage('El id_usuario debe ser un número entero positivo'),
  body('especialidad')
    .optional({ nullable: true })
    .isLength({ max: 150 })
    .withMessage('La especialidad no puede exceder 150 caracteres')
    .trim(),
  body('telefono')
    .optional({ nullable: true })
    .isLength({ max: 20 })
    .withMessage('El teléfono no puede exceder 20 caracteres')
    .matches(/^[0-9+\-\s()]*$/)
    .withMessage('El teléfono solo puede contener dígitos, espacios y los símbolos + - ( )'),
];

export const reglasModificarEntrenador = [
  body('especialidad')
    .optional({ nullable: true })
    .isLength({ max: 150 })
    .withMessage('La especialidad no puede exceder 150 caracteres')
    .trim(),
  body('telefono')
    .optional({ nullable: true })
    .isLength({ max: 20 })
    .withMessage('El teléfono no puede exceder 20 caracteres')
    .matches(/^[0-9+\-\s()]*$/)
    .withMessage('El teléfono solo puede contener dígitos, espacios y los símbolos + - ( )'),
];

export const reglasCambiarEstadoEntrenador = [
  body('estado')
    .notEmpty()
    .withMessage('El estado es obligatorio')
    .isIn(['activo', 'inactivo'])
    .withMessage("El estado debe ser 'activo' o 'inactivo'"),
];

/** Identificador de ruta: entero > 0 (evita consultas con basura). */
export const reglasIdEntrenador = [
  param('id')
    .isInt({ gt: 0 })
    .withMessage('El identificador del entrenador debe ser un número entero positivo'),
];
