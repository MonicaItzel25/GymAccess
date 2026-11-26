// models/asignacion.model.js
// Acceso a datos de la tabla `asignaciones_entrenador` (Sprint 3, US-S3-02).
// Consultas siempre parametrizadas. La unicidad de la asignación vigente por
// cliente la garantiza el índice UNIQUE (id_cliente, esta_vigente) de la
// migración 007 (research R-03): el alta ocurre en transacción con bloqueo
// FOR UPDATE de la fila vigente del cliente. Sin borrados físicos (FR-008).
// ES Modules.

import { consultar, ejecutar, obtenerPool } from '../config/db.js';
import { aFechaLocal } from '../utils/fechas.js';

const COLUMNAS_LISTADO = `
  a.id_asignacion, a.id_cliente, a.id_entrenador,
  a.fecha_inicio, a.fecha_fin, a.estado,
  c.nombre AS cliente_nombre, c.apellido AS cliente_apellido,
  u.nombre AS entrenador_nombre
`;

const JOINS = `
  FROM asignaciones_entrenador a
  JOIN clientes c ON c.id_cliente = a.id_cliente
  JOIN entrenadores e ON e.id_entrenador = a.id_entrenador
  JOIN usuarios u ON u.id_usuario = e.id_usuario
`;

/** Normaliza las fechas DATE al formato 'YYYY-MM-DD' de la API. */
function normalizar(asignacion) {
  if (!asignacion) return asignacion;
  return {
    ...asignacion,
    fecha_inicio: aFechaLocal(asignacion.fecha_inicio),
    fecha_fin: aFechaLocal(asignacion.fecha_fin),
  };
}

/** Lista asignaciones; filtros opcionales por entrenador y solo vigentes. */
export async function listar({ idEntrenador = null, soloVigentes = false } = {}) {
  const condiciones = [];
  const parametros = [];

  if (idEntrenador) {
    condiciones.push('a.id_entrenador = ?');
    parametros.push(idEntrenador);
  }
  if (soloVigentes) {
    condiciones.push("a.estado = 'vigente'");
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const filas = await consultar(
    `SELECT ${COLUMNAS_LISTADO} ${JOINS} ${where}
     ORDER BY a.fecha_inicio DESC, a.id_asignacion DESC`,
    parametros
  );
  return filas.map(normalizar);
}

/** Devuelve una asignación por identificador con sus joins, o null. */
export async function obtenerPorId(id) {
  const filas = await consultar(
    `SELECT ${COLUMNAS_LISTADO} ${JOINS} WHERE a.id_asignacion = ?`,
    [id]
  );
  return normalizar(filas[0] || null);
}

/**
 * Bloquea (FOR UPDATE) la asignación vigente del cliente dentro de una
 * transacción, para impedir altas concurrentes de una segunda vigente
 * (data-model §2, patrón de membresia.model.bloquearVigente).
 */
export async function bloquearVigentePorCliente(idCliente, conexion) {
  const [filas] = await conexion.query(
    `SELECT id_asignacion FROM asignaciones_entrenador
     WHERE id_cliente = ? AND estado = 'vigente'
     FOR UPDATE`,
    [idCliente]
  );
  return filas[0] || null;
}

/** Inserta la asignación (estado por defecto 'vigente') y devuelve su id.
 *  Acepta una conexión de transacción; sin ella usa el pool. */
export async function crear({ idCliente, idEntrenador, fechaInicio }, conexion = null) {
  const destino = conexion || obtenerPool();
  const [resultado] = await destino.execute(
    `INSERT INTO asignaciones_entrenador (id_cliente, id_entrenador, fecha_inicio)
     VALUES (?, ?, ?)`,
    [idCliente, idEntrenador, fechaInicio]
  );
  return resultado.insertId;
}

/** Finaliza la asignación: estado 'finalizada' y fecha_fin (FR-007). */
export async function finalizar(id, fechaFin) {
  const resultado = await ejecutar(
    `UPDATE asignaciones_entrenador
     SET estado = 'finalizada', fecha_fin = ?
     WHERE id_asignacion = ?`,
    [fechaFin, id]
  );
  return resultado.affectedRows > 0;
}

/** Inicia una transacción sobre el pool (patrón membresia.model.js). */
export async function iniciarTransaccion() {
  const conexion = await obtenerPool().getConnection();
  await conexion.beginTransaction();
  return conexion;
}

/** Confirma la transacción. */
export async function confirmarTransaccion(conexion) {
  await conexion.commit();
  conexion.release();
}

/** Revierte la transacción. */
export async function revertirTransaccion(conexion) {
  await conexion.rollback();
  conexion.release();
}
