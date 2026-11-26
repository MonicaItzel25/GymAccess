// validators/ejercicio.validators.js
// Reglas de validación del catálogo de ejercicios (Sprint 3, data-model §3):
//   nombre: requerido en alta, ≤ 100 caracteres
//   descripcion: requerida en alta, ≤ 255 caracteres
//   grupo_muscular: opcional, ≤ 50 caracteres
//   estado: solo 'activo' | 'inactivo'
// ES Modules.

import { body, param } from 'express-validator';

export const reglasCrearEjercicio = [
  body('nombre')
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ max: 100 })
    .withMessage('El nombre no puede exceder 100 caracteres')
    .trim(),
  body('descripcion')
    .notEmpty()
    .withMessage('La descripción es obligatoria')
    .isLength({ max: 255 })
    .withMessage('La descripción no puede exceder 255 caracteres')
    .trim(),
  body('grupo_muscular')
    .optional({ nullable: true })
    .isLength({ max: 50 })
    .withMessage('El grupo muscular no puede exceder 50 caracteres')
    .trim(),
];

// Para la modificación los campos son opcionales pero, si vienen, validan
// (la unicidad del nombre y la existencia del registro se resuelven en el
// servicio, que conoce el historial).
export const reglasModificarEjercicio = [
  body('nombre')
    .optional({ nullable: true })
    .notEmpty()
    .withMessage('El nombre no puede estar vacío')
    .isLength({ max: 100 })
    .withMessage('El nombre no puede exceder 100 caracteres')
    .trim(),
  body('descripcion')
    .optional({ nullable: true })
    .notEmpty()
    .withMessage('La descripción no puede estar vacía')
    .isLength({ max: 255 })
    .withMessage('La descripción no puede exceder 255 caracteres')
    .trim(),
  body('grupo_muscular')
    .optional({ nullable: true })
    .isLength({ max: 50 })
    .withMessage('El grupo muscular no puede exceder 50 caracteres')
    .trim(),
];

export const reglasCambiarEstadoEjercicio = [
  body('estado')
    .notEmpty()
    .withMessage('El estado es obligatorio')
    .isIn(['activo', 'inactivo'])
    .withMessage("El estado debe ser 'activo' o 'inactivo'"),
];

/** Identificador de ruta: entero > 0 (evita consultas con basura). */
export const reglasIdEjercicio = [
  param('id')
    .isInt({ gt: 0 })
    .withMessage('El identificador del ejercicio debe ser un número entero positivo'),
];
