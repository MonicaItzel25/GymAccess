// models/progreso.model.js
// Acceso a datos de la tabla `progresos` (Sprint 3, US-S3-04, data-model §6).
// Consultas siempre parametrizadas. El historial solo admite alta y consulta:
// las entradas no se sobrescriben ni se borran (FR-021, RN-009). La forma de
// registrar correcciones (FR-022) está pendiente de decisión. Permisos, reglas
// de negocio y auditoría corresponden al servicio. ES Modules.

import { consultar, ejecutar } from '../config/db.js';
import { aFechaLocal } from '../utils/fechas.js';

const COLUMNAS = `
  id_progreso, id_cliente, id_objetivo, fecha, valor_numerico, avance,
  comentario, fecha_registro
`;

/** Normaliza DATE a 'YYYY-MM-DD' y DECIMAL (cadena en mysql2) a número. */
function normalizar(progreso) {
  if (!progreso) return progreso;
  return {
    ...progreso,
    fecha: aFechaLocal(progreso.fecha),
    valor_numerico:
      progreso.valor_numerico === null ? null : Number(progreso.valor_numerico),
  };
}

/**
 * Lista las entradas de un cliente en orden cronológico ascendente.
 * `desde` y `hasta` ('YYYY-MM-DD', inclusivos) son filtros opcionales.
 */
export async function listar({ idCliente, desde = null, hasta = null }) {
  const condiciones = ['id_cliente = ?'];
  const parametros = [idCliente];

  if (desde) {
    condiciones.push('fecha >= ?');
    parametros.push(desde);
  }
  if (hasta) {
    condiciones.push('fecha <= ?');
    parametros.push(hasta);
  }

  const filas = await consultar(
    `SELECT ${COLUMNAS} FROM progresos
     WHERE ${condiciones.join(' AND ')}
     ORDER BY fecha, id_progreso`,
    parametros
  );
  return filas.map(normalizar);
}

/** Devuelve una entrada por identificador, o null. */
export async function obtenerPorId(id) {
  const filas = await consultar(
    `SELECT ${COLUMNAS} FROM progresos WHERE id_progreso = ?`,
    [id]
  );
  return normalizar(filas[0] || null);
}

/** Inserta una entrada de progreso y devuelve su id. */
export async function crear({
  idCliente,
  idObjetivo = null,
  fecha,
  valorNumerico = null,
  avance = null,
  comentario = null,
}) {
  const resultado = await ejecutar(
    `INSERT INTO progresos
       (id_cliente, id_objetivo, fecha, valor_numerico, avance, comentario)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [idCliente, idObjetivo, fecha, valorNumerico, avance, comentario]
  );
  return resultado.insertId;
}
