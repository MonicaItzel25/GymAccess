// validators/rutina.validators.js
// Reglas de validación de las rutinas (Sprint 3, US-S3-03, data-model §4):
//   nombre: requerido en alta, ≤ 100 caracteres
//   ejercicios: al menos una fila; por fila id_ejercicio entero > 0,
//     series/repeticiones enteros 1–999, peso_recomendado 0–999.99,
//     descanso_segundos 0–3600, instrucciones no vacío cuando se capture,
//     orden entero > 0 opcional (si no, lo asigna el servicio por posición)
//   estado: solo 'activa' | 'inactiva'
// (FR-016, RN-007, research R-10). ES Modules.

import { body, param, query } from 'express-validator';

// Reglas comunes de cada fila de ejercicios (reutilizadas en alta y edición).
const reglasFilaEjercicio = [
  body('ejercicios.*.id_ejercicio')
    .isInt({ gt: 0 })
    .withMessage('Cada ejercicio debe tener un identificador válido'),
  body('ejercicios.*.series')
    .isInt({ min: 1, max: 999 })
    .withMessage('Las series deben ser un entero entre 1 y 999'),
  body('ejercicios.*.repeticiones')
    .isInt({ min: 1, max: 999 })
    .withMessage('Las repeticiones deben ser un entero entre 1 y 999'),
  body('ejercicios.*.peso_recomendado')
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 999.99 })
    .withMessage('El peso recomendado debe estar entre 0 y 999.99 kg'),
  body('ejercicios.*.descanso_segundos')
    .optional({ nullable: true })
    .isInt({ min: 0, max: 3600 })
    .withMessage('El descanso debe estar entre 0 y 3600 segundos'),
  body('ejercicios.*.instrucciones')
    .optional({ nullable: true })
    .notEmpty()
    .withMessage('Las instrucciones no pueden estar vacías')
    .trim(),
  body('ejercicios.*.orden')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('El orden debe ser un entero positivo'),
];

export const reglasCrearRutina = [
  body('id_cliente')
    .isInt({ gt: 0 })
    .withMessage('El cliente es obligatorio'),
  body('nombre')
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ max: 100 })
    .withMessage('El nombre no puede exceder 100 caracteres')
    .trim(),
  body('ejercicios')
    .isArray({ min: 1 })
    .withMessage('La rutina debe incluir al menos un ejercicio'),
  ...reglasFilaEjercicio,
];

// Para la modificación: nombre y/o lista de ejercicios (contrato §4); si se
// envía la lista, debe tener al menos una fila y validar por completo.
export const reglasModificarRutina = [
  body('nombre')
    .optional({ nullable: true })
    .notEmpty()
    .withMessage('El nombre no puede estar vacío')
    .isLength({ max: 100 })
    .withMessage('El nombre no puede exceder 100 caracteres')
    .trim(),
  body('ejercicios')
    .optional()
    .isArray({ min: 1 })
    .withMessage('La rutina debe incluir al menos un ejercicio'),
  ...reglasFilaEjercicio,
];

export const reglasCambiarEstadoRutina = [
  body('estado')
    .notEmpty()
    .withMessage('El estado es obligatorio')
    .isIn(['activa', 'inactiva'])
    .withMessage("El estado debe ser 'activa' o 'inactiva'"),
];

/** Identificador de ruta: entero > 0. */
export const reglasIdRutina = [
  param('id')
    .isInt({ gt: 0 })
    .withMessage('El identificador de la rutina debe ser un número entero positivo'),
];

/** Filtro opcional de listado por cliente. */
export const reglasListarRutinas = [
  query('cliente')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('El filtro de cliente debe ser un identificador válido'),
];
