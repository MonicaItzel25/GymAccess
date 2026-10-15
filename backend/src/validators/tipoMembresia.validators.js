// validators/tipoMembresia.validators.js
// Reglas de validación de tipos de membresía (FR-001, contracts/api.md §1):
//   nombre: requerido, 2–100 caracteres
//   duracion: requerida, entero positivo (días)
//   precio: requerido, número positivo con hasta 2 decimales
//   descripcion y estado: opcionales
// ES Modules.

import { body, param } from 'express-validator';

export const reglasCrearTipoMembresia = [
  body('nombre')
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .trim(),
  body('duracion')
    .notEmpty()
    .withMessage('La duración es obligatoria')
    .isInt({ min: 1 })
    .withMessage('La duración debe ser un número entero positivo (días)'),
  body('precio')
    .notEmpty()
    .withMessage('El precio es obligatorio')
    .isFloat({ min: 0.01 })
    .withMessage('El precio debe ser un número positivo'),
  body('descripcion')
    .optional({ nullable: true })
    .isLength({ max: 255 })
    .withMessage('La descripción no puede exceder 255 caracteres'),
  body('estado')
    .optional({ nullable: true })
    .isIn(['activo', 'inactivo'])
    .withMessage('El estado debe ser activo o inactivo'),
];

// Para la modificación todos los campos son opcionales pero, si vienen, validan.
export const reglasModificarTipoMembresia = [
  param('id').isInt({ min: 1 }).withMessage('El identificador de tipo debe ser un número entero positivo'),
  body('nombre')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .trim(),
  body('duracion')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La duración debe ser un número entero positivo (días)'),
  body('precio')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('El precio debe ser un número positivo'),
  body('descripcion')
    .optional({ nullable: true })
    .isLength({ max: 255 })
    .withMessage('La descripción no puede exceder 255 caracteres'),
  body('estado')
    .optional({ nullable: true })
    .isIn(['activo', 'inactivo'])
    .withMessage('El estado debe ser activo o inactivo'),
];

export const reglasIdTipoMembresia = [
  param('id').isInt({ min: 1 }).withMessage('El identificador de tipo debe ser un número entero positivo'),
];
