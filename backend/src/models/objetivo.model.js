// models/objetivo.model.js
// Acceso a datos de la tabla `objetivos` (Sprint 3, US-S3-04, data-model §5).
// Consultas siempre parametrizadas. Los objetivos se registran por cliente
// (FR-019) y conservan su historial sin borrado físico (FR-021, RN-009). Solo
// un objetivo `activo` admite cambios: `alcanzado` y `cerrado` son estados
// terminales. Permisos, asignación vigente y auditoría corresponden al
// servicio. ES Modules.

import { consultar, ejecutar } from '../config/db.js';
import { aFechaLocal } from '../utils/fechas.js';

const COLUMNAS = `
  id_objetivo, id_cliente, meta, unidad, fecha_objetivo, estado,
  fecha_registro, fecha_cierre
`;

/** Normaliza la columna DATE al formato 'YYYY-MM-DD' de la API. */
function normalizar(objetivo) {
  if (!objetivo) return objetivo;
  return { ...objetivo, fecha_objetivo: aFechaLocal(objetivo.fecha_objetivo) };
}

/** Lista el historial de objetivos de un cliente, del más antiguo al más reciente. */
export async function listar({ idCliente }) {
  const filas = await consultar(
    `SELECT ${COLUMNAS} FROM objetivos
     WHERE id_cliente = ?
     ORDER BY fecha_registro, id_objetivo`,
    [idCliente]
  );
  return filas.map(normalizar);
}

/** Devuelve un objetivo por identificador, o null. */
export async function obtenerPorId(id) {
  const filas = await consultar(
    `SELECT ${COLUMNAS} FROM objetivos WHERE id_objetivo = ?`,
    [id]
  );
  return normalizar(filas[0] || null);
}

/** Inserta un objetivo (estado por defecto 'activo') y devuelve su id. */
export async function crear({ idCliente, meta, unidad = null, fechaObjetivo }) {
  const resultado = await ejecutar(
    `INSERT INTO objetivos (id_cliente, meta, unidad, fecha_objetivo)
     VALUES (?, ?, ?, ?)`,
    [idCliente, meta, unidad, fechaObjetivo]
  );
  return resultado.insertId;
}

/**
 * Actualiza meta, unidad y fecha objetivo de un objetivo `activo`. Recibe los
 * tres valores finales: el servicio completa con los actuales los campos no
 * enviados. Devuelve false si no existe o ya no está activo.
 */
export async function actualizar(id, { meta, unidad, fechaObjetivo }) {
  const resultado = await ejecutar(
    `UPDATE objetivos
     SET meta = ?, unidad = ?, fecha_objetivo = ?
     WHERE id_objetivo = ? AND estado = 'activo'`,
    [meta, unidad, fechaObjetivo, id]
  );
  return resultado.affectedRows > 0;
}

/**
 * Pasa un objetivo `activo` a `alcanzado` o `cerrado` y marca `fecha_cierre`.
 * La condición sobre el estado impide reabrirlo o cerrarlo dos veces, incluso
 * ante solicitudes concurrentes. Devuelve false si no hubo transición.
 */
export async function cambiarEstado(id, estado) {
  const resultado = await ejecutar(
    `UPDATE objetivos
     SET estado = ?, fecha_cierre = CURRENT_TIMESTAMP
     WHERE id_objetivo = ? AND estado = 'activo'`,
    [estado, id]
  );
  return resultado.affectedRows > 0;
}
