// models/ejercicio.model.js
// Acceso a datos de la tabla `ejercicios` (Sprint 3, US-S3-08).
// Catálogo independiente y reutilizable por múltiples rutinas (FR-010).
// Consultas siempre parametrizadas; sin borrado físico (FR-011, SC-004).
// ES Modules.

import { consultar, ejecutar } from '../config/db.js';

const COLUMNAS =
  'id_ejercicio, nombre, descripcion, grupo_muscular, estado, fecha_creacion';

/** Lista el catálogo filtrado por estado: 'activo' | 'inactivo' | 'todos'.
 *  Por defecto solo los activos (disponibles para rutinas nuevas). */
export async function listar(estado = 'activo') {
  if (estado === 'todos') {
    return consultar(`SELECT ${COLUMNAS} FROM ejercicios ORDER BY nombre`);
  }
  return consultar(
    `SELECT ${COLUMNAS} FROM ejercicios WHERE estado = ? ORDER BY nombre`,
    [estado]
  );
}

/** Devuelve un ejercicio por identificador, o null. */
export async function obtenerPorId(id) {
  const filas = await consultar(
    `SELECT ${COLUMNAS} FROM ejercicios WHERE id_ejercicio = ?`,
    [id]
  );
  return filas[0] || null;
}

/** Indica si ya existe un ejercicio con ese nombre (unicidad del catálogo
 *  compartido, data-model §3); `idExcluir` permite ignorar el propio registro
 *  durante una modificación. */
export async function nombreExiste(nombre, idExcluir = null) {
  const parametros = [nombre];
  let sql = 'SELECT id_ejercicio FROM ejercicios WHERE nombre = ?';
  if (idExcluir) {
    sql += ' AND id_ejercicio <> ?';
    parametros.push(idExcluir);
  }
  const filas = await consultar(sql, parametros);
  return filas.length > 0;
}

/** Inserta un ejercicio y devuelve su identificador. */
export async function crear({ nombre, descripcion, grupoMuscular = null, estado = 'activo' }) {
  const resultado = await ejecutar(
    `INSERT INTO ejercicios (nombre, descripcion, grupo_muscular, estado)
     VALUES (?, ?, ?, ?)`,
    [nombre, descripcion, grupoMuscular, estado]
  );
  return resultado.insertId;
}

/** Actualiza los campos editables del ejercicio y devuelve si hubo cambios. */
export async function actualizar(id, { nombre, descripcion, grupoMuscular }) {
  const resultado = await ejecutar(
    `UPDATE ejercicios
     SET nombre = ?, descripcion = ?, grupo_muscular = ?
     WHERE id_ejercicio = ?`,
    [nombre, descripcion, grupoMuscular, id]
  );
  return resultado.affectedRows > 0;
}

/** Cambia el estado (`activo` | `inactivo`) sin borrar el registro (FR-011). */
export async function cambiarEstado(id, estado) {
  const resultado = await ejecutar(
    'UPDATE ejercicios SET estado = ? WHERE id_ejercicio = ?',
    [estado, id]
  );
  return resultado.affectedRows > 0;
}
