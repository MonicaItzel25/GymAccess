// models/membresia.model.js
// Acceso a datos de la tabla `membresias`. Consultas siempre parametrizadas.
// Incluye las operaciones transaccionales para la regla de una sola membresía
// vigente por cliente (FR-025). ES Modules.

import { consultar, ejecutar, obtenerPool } from '../config/db.js';
import { aFechaLocal } from '../utils/fechas.js';

const COLUMNAS_LISTADO = `
  m.id_membresia, m.id_cliente, m.id_tipo_membresia,
  m.fecha_inicio, m.fecha_fin, m.estado,
  t.nombre AS tipo_nombre, t.duracion, t.precio,
  c.nombre AS cliente_nombre, c.apellido AS cliente_apellido
`;

const JOINS = `
  FROM membresias m
  JOIN tipos_membresia t ON t.id_tipo_membresia = m.id_tipo_membresia
  JOIN clientes c ON c.id_cliente = m.id_cliente
`;

/** Normaliza las fechas de una membresía al formato 'YYYY-MM-DD'. */
function normalizarFechas(membresia) {
  if (!membresia) return membresia;
  return {
    ...membresia,
    fecha_inicio: aFechaLocal(membresia.fecha_inicio),
    fecha_fin: aFechaLocal(membresia.fecha_fin),
  };
}

/** Lista membresías; filtro opcional por cliente. */
export async function listar(idCliente = null) {
  if (idCliente) {
    const filas = await consultar(
      `SELECT ${COLUMNAS_LISTADO} ${JOINS} WHERE m.id_cliente = ? ORDER BY m.fecha_inicio DESC`,
      [idCliente]
    );
    return filas.map(normalizarFechas);
  }
  const filas = await consultar(`SELECT ${COLUMNAS_LISTADO} ${JOINS} ORDER BY m.fecha_inicio DESC`);
  return filas.map(normalizarFechas);
}

/** Devuelve una membresía por identificador con sus joins, o null. */
export async function obtenerPorId(id) {
  const filas = await consultar(
    `SELECT ${COLUMNAS_LISTADO} ${JOINS} WHERE m.id_membresia = ?`,
    [id]
  );
  return normalizarFechas(filas[0] || null);
}

/** Devuelve la membresía más reciente de un cliente (cualquier estado),
 *  para que el control de acceso pueda determinar el motivo de rechazo. */
export async function obtenerUltima(idCliente, conexion = null) {
  const sql = `SELECT ${COLUMNAS_LISTADO} ${JOINS}
               WHERE m.id_cliente = ?
               ORDER BY m.fecha_inicio DESC, m.id_membresia DESC LIMIT 1`;
  const filas = conexion ? (await conexion.query(sql, [idCliente]))[0] : await consultar(sql, [idCliente]);
  return normalizarFechas(filas[0] || null);
}

/** Devuelve la membresía vigente (activa y no vencida) de un cliente, o null. */
export async function obtenerVigente(idCliente, conexion = null) {
  const sql = `SELECT ${COLUMNAS_LISTADO} ${JOINS}
               WHERE m.id_cliente = ? AND m.estado = 'activa' AND m.fecha_fin >= CURDATE()
               ORDER BY m.fecha_inicio DESC LIMIT 1`;
  const filas = conexion ? (await conexion.query(sql, [idCliente]))[0] : await consultar(sql, [idCliente]);
  return normalizarFechas(filas[0] || null);
}

/** Inserta una membresía y devuelve su identificador.
 *  Acepta una `conexion` opcional para formar parte de una transacción. */
export async function crear({ idCliente, idTipoMembresia, fechaInicio, fechaFin, estado = 'activa' }, conexion = null) {
  const sql = `INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado)
               VALUES (?, ?, ?, ?, ?)`;
  const parametros = [idCliente, idTipoMembresia, fechaInicio, fechaFin, estado];
  const resultado = conexion
    ? (await conexion.execute(sql, parametros))[0]
    : await ejecutar(sql, parametros);
  return resultado.insertId;
}

/** Cambia el estado de una membresía. */
export async function cambiarEstado(id, estado) {
  const resultado = await ejecutar('UPDATE membresias SET estado = ? WHERE id_membresia = ?', [
    estado,
    id,
  ]);
  return resultado.affectedRows > 0;
}

/** Cambia el estado de una membresía dentro de una conexión transaccional. */
export async function cambiarEstadoEnConexion(id, estado, conexion) {
  await conexion.execute('UPDATE membresias SET estado = ? WHERE id_membresia = ?', [
    estado,
    id,
  ]);
}

/** Cierra una membresía vigente (la marca como vencida) en una conexión dada. */
export async function cerrarVigente(id, conexion) {
  await conexion.execute('UPDATE membresias SET estado = ? WHERE id_membresia = ?', [
    'vencida',
    id,
  ]);
}

/** Bloquea con FOR UPDATE la membresía vigente de un cliente dentro de una
 *  transacción, para garantizar una sola vigente por cliente (FR-025). */
export async function bloquearVigente(idCliente, conexion) {
  const [filas] = await conexion.query(
    `SELECT id_membresia FROM membresias
     WHERE id_cliente = ? AND estado = 'activa' AND fecha_fin >= CURDATE()
     ORDER BY fecha_inicio DESC LIMIT 1
     FOR UPDATE`,
    [idCliente]
  );
  return filas[0] || null;
}

/** Inicia una transacción sobre el pool. */
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
