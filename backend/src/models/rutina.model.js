// models/rutina.model.js
// Acceso a datos de las tablas `rutinas` y `ejercicio_rutina` (Sprint 3, US-S3-03).
// Consultas siempre parametrizadas. La unicidad de la rutina activa por cliente
// la garantiza el índice UNIQUE (id_cliente, esta_activa) de la migración 007
// (research R-03): la activación ocurre en transacción con bloqueo FOR UPDATE
// de la fila activa del cliente. Historial = filas distintas (research R-04);
// sin borrados físicos (FR-017). ES Modules.

import { consultar, ejecutar, obtenerPool } from '../config/db.js';

const COLUMNAS_LISTADO = `
  r.id_rutina, r.id_cliente, r.id_entrenador, r.nombre, r.estado,
  r.fecha_creacion, r.fecha_actualizacion, r.fecha_activacion,
  c.nombre AS cliente_nombre, c.apellido AS cliente_apellido
`;

const JOINS = `
  FROM rutinas r
  JOIN clientes c ON c.id_cliente = r.id_cliente
`;

/** Lista las rutinas de los clientes con asignación vigente del entrenador.
 *  Incluye las creadas por otro entrenador (FR-017, Clarification Q1);
 *  `idCliente` filtra dentro de ese conjunto. */
export async function listar({ idEntrenador, idCliente = null }) {
  const parametros = [idEntrenador];
  let filtroCliente = '';
  if (idCliente) {
    filtroCliente = ' AND r.id_cliente = ?';
    parametros.push(idCliente);
  }
  return consultar(
    `SELECT ${COLUMNAS_LISTADO} ${JOINS}
     WHERE r.id_cliente IN (
       SELECT id_cliente FROM asignaciones_entrenador
       WHERE id_entrenador = ? AND estado = 'vigente'
     )${filtroCliente}
     ORDER BY COALESCE(r.fecha_activacion, r.fecha_creacion) DESC, r.id_rutina DESC`,
    parametros
  );
}

/** Devuelve una rutina con sus ejercicios y parámetros, o null. */
export async function obtenerPorId(id) {
  const filas = await consultar(
    `SELECT ${COLUMNAS_LISTADO} ${JOINS} WHERE r.id_rutina = ?`,
    [id]
  );
  const rutina = filas[0] || null;
  if (!rutina) return null;

  const ejercicios = await consultar(
    `SELECT er.id_rutina_ejercicio, er.id_ejercicio, er.orden, er.series,
            er.repeticiones, er.peso_recomendado, er.descanso_segundos,
            er.instrucciones, e.nombre, e.grupo_muscular
     FROM ejercicio_rutina er
     JOIN ejercicios e ON e.id_ejercicio = er.id_ejercicio
     WHERE er.id_rutina = ?
     ORDER BY er.orden`,
    [id]
  );
  return { ...rutina, ejercicios };
}

/** Indica si el entrenador tiene una asignación vigente con el cliente
 *  (FR-014, RN-005; también aplica a rutinas creadas por otro, Q1). */
export async function existeAsignacionVigente(idEntrenador, idCliente) {
  const filas = await consultar(
    `SELECT id_asignacion FROM asignaciones_entrenador
     WHERE id_entrenador = ? AND id_cliente = ? AND estado = 'vigente'`,
    [idEntrenador, idCliente]
  );
  return filas.length > 0;
}

/** Inserta la rutina (estado por defecto 'inactiva') y devuelve su id.
 *  Acepta una conexión de transacción; sin ella usa el pool. */
export async function crear({ idCliente, idEntrenador, nombre }, conexion = null) {
  const destino = conexion || obtenerPool();
  const [resultado] = await destino.execute(
    `INSERT INTO rutinas (id_cliente, id_entrenador, nombre)
     VALUES (?, ?, ?)`,
    [idCliente, idEntrenador, nombre]
  );
  return resultado.insertId;
}

/** Actualiza el nombre y marca `fecha_actualizacion` (FR-015 «fechas»). */
export async function actualizar(id, { nombre }, conexion = null) {
  const destino = conexion || obtenerPool();
  const [resultado] = await destino.execute(
    `UPDATE rutinas
     SET nombre = ?, fecha_actualizacion = CURRENT_TIMESTAMP
     WHERE id_rutina = ?`,
    [nombre, id]
  );
  return resultado.affectedRows > 0;
}

/** Reemplaza la lista de ejercicios de la rutina (borrado lógico de filas
 *  dependientes + INSERT de las nuevas apariciones). Acepta transacción. */
export async function reemplazarEjercicios(idRutina, ejercicios, conexion = null) {
  const destino = conexion || obtenerPool();
  await destino.execute('DELETE FROM ejercicio_rutina WHERE id_rutina = ?', [idRutina]);
  for (const fila of ejercicios) {
    await destino.execute(
      `INSERT INTO ejercicio_rutina
         (id_rutina, id_ejercicio, orden, series, repeticiones,
          peso_recomendado, descanso_segundos, instrucciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idRutina,
        fila.id_ejercicio,
        fila.orden,
        fila.series,
        fila.repeticiones,
        fila.peso_recomendado,
        fila.descanso_segundos,
        fila.instrucciones,
      ]
    );
  }
}

/**
 * Bloquea (FOR UPDATE) la rutina activa del cliente dentro de una
 * transacción, para impedir activaciones concurrentes de una segunda
 * (data-model §4.1, patrón de asignacion.model.bloquearVigentePorCliente).
 */
export async function bloquearActivaPorCliente(idCliente, conexion) {
  const [filas] = await conexion.query(
    `SELECT id_rutina FROM rutinas
     WHERE id_cliente = ? AND estado = 'activa'
     FOR UPDATE`,
    [idCliente]
  );
  return filas[0] || null;
}

/** Cambia el estado de la rutina; al activar marca `fecha_activacion`.
 *  Acepta conexión de transacción. */
export async function cambiarEstado(id, estado, conexion = null) {
  const destino = conexion || obtenerPool();
  const [resultado] = await destino.execute(
    `UPDATE rutinas
     SET estado = ?,
         fecha_activacion = IF(? = 'activa', CURRENT_TIMESTAMP, fecha_activacion),
         fecha_actualizacion = CURRENT_TIMESTAMP
     WHERE id_rutina = ?`,
    [estado, estado, id]
  );
  return resultado.affectedRows > 0;
}

/** Inicia una transacción sobre el pool (patrón asignacion.model.js). */
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

/** Devuelve la rutina `activa` del cliente con sus ejercicios, o null
 *  (US-S3-05; hay como máximo una por cliente, Clarification Q5). */
export async function obtenerActivaPorCliente(idCliente) {
  const filas = await consultar(
    `SELECT id_rutina FROM rutinas WHERE id_cliente = ? AND estado = 'activa'`,
    [idCliente]
  );
  return filas[0] ? obtenerPorId(filas[0].id_rutina) : null;
}
