// validators/objetivo.validators.js
// Reglas de validación de objetivos (Sprint 3, US-S3-04, data-model §5):
//   id_cliente (cuerpo) y cliente (consulta): requeridos, enteros > 0
//   meta: requerida en alta, no vacía, ≤ 255 caracteres
//   unidad: opcional, ≤ 30 caracteres (vacía equivale a sin unidad)
//   fecha_objetivo: requerida en alta, fecha real con formato YYYY-MM-DD
//   estado (cierre): solo 'alcanzado' | 'cerrado'
// En la edición todos los campos son opcionales: los no enviados se conservan.
// También exporta las reglas de enteros y fechas que usan los progresos.
// ES Modules.

import { body, param, query } from 'express-validator';

/** Encadena la comprobación de entero positivo (rechaza listas). */
export const exigirEnteroPositivo = (cadena, mensaje) =>
  cadena
    .not()
    .isArray()
    .withMessage(mensaje)
    .bail()
    .isInt({ gt: 0 })
    .withMessage(mensaje);

/** Encadena la comprobación de una fecha real YYYY-MM-DD (rechaza 2026-02-30). */
export const exigirFecha = (cadena, campo) => {
  const mensaje = `El campo ${campo} debe ser una fecha válida con el formato YYYY-MM-DD`;
  return cadena
    .isString()
    .withMessage(mensaje)
    .bail()
    .matches(/^[1-9]\d{3}-\d{2}-\d{2}$/)
    .withMessage(mensaje)
    .bail()
    .isISO8601({ strict: true })
    .withMessage(mensaje);
};

/** Meta: texto no vacío tras recortar espacios. */
const exigirMeta = (cadena) =>
  cadena
    .isString()
    .withMessage('La meta es obligatoria y debe ser un texto')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('La meta no puede estar vacía')
    .bail()
    .isLength({ max: 255 })
    .withMessage('La meta no puede exceder 255 caracteres');

/** Unidad opcional: `null` o texto vacío significan «sin unidad». */
const reglaUnidad = body('unidad')
  .optional({ values: 'null' })
  .isString()
  .withMessage('La unidad debe ser un texto')
  .bail()
  .trim()
  .isLength({ max: 30 })
  .withMessage('La unidad no puede exceder 30 caracteres')
  .bail()
  .customSanitizer((valor) => valor || null);

/** Consulta del historial: el cliente es obligatorio. */
export const reglasListarObjetivos = [
  exigirEnteroPositivo(
    query('cliente'),
    'El parámetro cliente es obligatorio y debe ser un número entero positivo'
  ),
];

export const reglasCrearObjetivo = [
  exigirEnteroPositivo(
    body('id_cliente'),
    'El id_cliente es obligatorio y debe ser un número entero positivo'
  ),
  exigirMeta(body('meta')),
  reglaUnidad,
  exigirFecha(body('fecha_objetivo'), 'fecha_objetivo'),
];

// Edición parcial: un campo ausente no se valida ni se modifica. `meta` y
// `fecha_objetivo` no admiten `null`; `unidad` sí, para quitarla.
export const reglasModificarObjetivo = [
  exigirMeta(body('meta').optional()),
  reglaUnidad,
  exigirFecha(body('fecha_objetivo').optional(), 'fecha_objetivo'),
];

export const reglasCambiarEstadoObjetivo = [
  body('estado')
    .notEmpty()
    .withMessage('El estado es obligatorio')
    .bail()
    .isString()
    .withMessage("El estado debe ser 'alcanzado' o 'cerrado'")
    .bail()
    .isIn(['alcanzado', 'cerrado'])
    .withMessage("El estado debe ser 'alcanzado' o 'cerrado'"),
];

/** Identificador de ruta: entero > 0. */
export const reglasIdObjetivo = [
  param('id')
    .isInt({ gt: 0 })
    .withMessage('El identificador del objetivo debe ser un número entero positivo'),
];
