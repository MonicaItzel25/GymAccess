// models/entrenador.model.js
// Acceso a datos de la tabla `entrenadores` (Sprint 3, US-S3-01).
// Consultas siempre parametrizadas. El nombre completo procede de la cuenta
// (`usuarios.nombre`), nunca se duplica en el perfil (data-model §1).
// ES Modules.

import { consultar, ejecutar } from '../config/db.js';

const COLUMNAS_LISTADO = `
  e.id_entrenador, e.id_usuario, e.especialidad, e.telefono, e.estado,
  e.fecha_creacion, u.nombre
`;

const JOINS = `
  FROM entrenadores e
  JOIN usuarios u ON u.id_usuario = e.id_usuario
`;

/** Lista los perfiles de entrenador con el nombre de su cuenta. */
export async function listar() {
  return consultar(`SELECT ${COLUMNAS_LISTADO} ${JOINS} ORDER BY u.nombre`);
}

/** Devuelve un perfil por identificador con el nombre de su cuenta, o null. */
export async function obtenerPorId(id) {
  const filas = await consultar(
    `SELECT ${COLUMNAS_LISTADO} ${JOINS} WHERE e.id_entrenador = ?`,
    [id]
  );
  return filas[0] || null;
}

/** Devuelve el perfil ligado a una cuenta, o null (control de duplicados). */
export async function obtenerPorIdUsuario(idUsuario) {
  const filas = await consultar(
    `SELECT ${COLUMNAS_LISTADO} ${JOINS} WHERE e.id_usuario = ?`,
    [idUsuario]
  );
  return filas[0] || null;
}

/** Inserta un perfil de entrenador y devuelve su identificador. */
export async function crear({ idUsuario, especialidad = null, telefono = null, estado = 'activo' }) {
  const resultado = await ejecutar(
    `INSERT INTO entrenadores (id_usuario, especialidad, telefono, estado)
     VALUES (?, ?, ?, ?)`,
    [idUsuario, especialidad, telefono, estado]
  );
  return resultado.insertId;
}

/** Actualiza los campos permitidos del perfil y devuelve si hubo cambios. */
export async function actualizar(id, { especialidad, telefono }) {
  const resultado = await ejecutar(
    `UPDATE entrenadores
     SET especialidad = ?, telefono = ?
     WHERE id_entrenador = ?`,
    [especialidad, telefono, id]
  );
  return resultado.affectedRows > 0;
}

/** Cambia el estado (`activo` | `inactivo`) del perfil (FR-002, FR-003). */
export async function cambiarEstado(id, estado) {
  const resultado = await ejecutar(
    'UPDATE entrenadores SET estado = ? WHERE id_entrenador = ?',
    [estado, id]
  );
  return resultado.affectedRows > 0;
}
