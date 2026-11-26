// validators/progreso.validators.js
// Reglas de validación de progresos (Sprint 3, US-S3-04, data-model §6):
//   id_cliente (cuerpo) y cliente (consulta): requeridos, enteros > 0
//   id_objetivo e id_progreso_corregido: opcionales, enteros > 0
//   fecha: requerida, fecha real con formato YYYY-MM-DD
//   valor_numerico: opcional, 0–999999.99 (límite de DECIMAL(8,2))
//   avance: opcional, ≤ 150 caracteres; comentario: opcional, ≤ 255
//   se exige al menos uno entre valor_numerico y avance (FR-020)
// La existencia de los identificadores y su pertenencia al cliente se
// comprueban en el servicio. ES Modules.

import { body, query } from 'express-validator';
import { exigirEnteroPositivo, exigirFecha } from './objetivo.validators.js';

/** Identificador opcional del cuerpo: ausente o `null` es válido. */
const identificadorOpcional = (campo) =>
  exigirEnteroPositivo(
    body(campo).optional({ values: 'null' }),
    `El ${campo} debe ser un número entero positivo`
  );

/** Texto opcional: recorta espacios y convierte el texto vacío en `null`. */
const textoOpcional = (campo, maximo) =>
  body(campo)
    .optional({ values: 'null' })
    .isString()
    .withMessage(`El campo ${campo} debe ser un texto`)
    .bail()
    .trim()
    .isLength({ max: maximo })
    .withMessage(`El campo ${campo} no puede exceder ${maximo} caracteres`)
    .bail()
    .customSanitizer((valor) => valor || null);

/** Consulta del historial: cliente obligatorio y periodo opcional. */
export const reglasListarProgresos = [
  exigirEnteroPositivo(
    query('cliente'),
    'El parámetro cliente es obligatorio y debe ser un número entero positivo'
  ),
  exigirFecha(query('desde').optional({ values: 'falsy' }), 'desde'),
  exigirFecha(query('hasta').optional({ values: 'falsy' }), 'hasta'),
  query('hasta')
    .optional({ values: 'falsy' })
    .custom((hasta, { req }) => !req.query.desde || req.query.desde <= hasta)
    .withMessage('El periodo de fechas es inválido'),
];

export const reglasCrearProgreso = [
  exigirEnteroPositivo(
    body('id_cliente'),
    'El id_cliente es obligatorio y debe ser un número entero positivo'
  ),
  identificadorOpcional('id_objetivo'),
  identificadorOpcional('id_progreso_corregido'),
  exigirFecha(body('fecha'), 'fecha'),
  body('valor_numerico')
    .optional({ values: 'null' })
    .not()
    .isArray()
    .withMessage('El valor numérico debe ser un número entre 0 y 999999.99')
    .bail()
    .isFloat({ min: 0, max: 999999.99 })
    .withMessage('El valor numérico debe ser un número entre 0 y 999999.99'),
  textoOpcional('avance', 150),
  textoOpcional('comentario', 255),
  // Va al final: evalúa los valores ya recortados. El 0 es un valor válido.
  body()
    .custom((cuerpo) => {
      const presente = (valor) => valor !== undefined && valor !== null && valor !== '';
      return presente(cuerpo?.valor_numerico) || presente(cuerpo?.avance);
    })
    .withMessage('Indica un valor o un avance medido'),
];
