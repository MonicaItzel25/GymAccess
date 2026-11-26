// validators/asignacion.validators.js
// Reglas de validación de asignaciones entrenador–cliente (Sprint 3,
// data-model §2):
//   id_cliente e id_entrenador: requeridos, enteros > 0
//   fecha_inicio / fecha_fin: opcionales, formato YYYY-MM-DD
// ES Modules.

import { body, param } from 'express-validator';

const mensajeFecha = (campo) =>
  `El ${campo} debe ser una fecha con el formato YYYY-MM-DD`;

export const reglasCrearAsignacion = [
  body('id_cliente')
    .notEmpty()
    .withMessage('El id_cliente es obligatorio')
    .isInt({ gt: 0 })
    .withMessage('El id_cliente debe ser un número entero positivo'),
  body('id_entrenador')
    .notEmpty()
    .withMessage('El id_entrenador es obligatorio')
    .isInt({ gt: 0 })
    .withMessage('El id_entrenador debe ser un número entero positivo'),
  body('fecha_inicio')
    .optional({ nullable: true })
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage(mensajeFecha('fecha_inicio')),
];

export const reglasFinalizarAsignacion = [
  body('fecha_fin')
    .optional({ nullable: true })
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage(mensajeFecha('fecha_fin')),
];

/** Identificador de ruta: entero > 0 (evita consultas con basura). */
export const reglasIdAsignacion = [
  param('id')
    .isInt({ gt: 0 })
    .withMessage('El identificador de la asignación debe ser un número entero positivo'),
];
