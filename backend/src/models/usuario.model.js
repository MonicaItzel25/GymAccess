// models/usuario.model.js
// Acceso a datos de la tabla `usuarios`. Todas las consultas usan
// parámetros para evitar inyecciones SQL. ES Modules.

import { consultar, ejecutar } from '../config/db.js';

/** Busca un usuario por su correo (para el inicio de sesión). */
export async function obtenerPorCorreo(correo) {
  const filas = await consultar(
    'SELECT * FROM usuarios WHERE correo = ?',
    [correo]
  );
  return filas[0] || null;
}

/** Devuelve todos los usuarios (sin la contraseña). */
export async function listar() {
  return consultar(
    `SELECT id_usuario, nombre, correo, rol, estado, fecha_creacion
     FROM usuarios
     ORDER BY id_usuario`
  );
}

/** Devuelve un usuario por identificador (sin la contraseña). */
export async function obtenerPorId(id) {
  const filas = await consultar(
    `SELECT id_usuario, nombre, correo, rol, estado, fecha_creacion
     FROM usuarios WHERE id_usuario = ?`,
    [id]
  );
  return filas[0] || null;
}

/** Inserta un usuario y devuelve su identificador. */
export async function crear({ nombre, correo, password, rol, estado = 'activo' }) {
  const resultado = await ejecutar(
    `INSERT INTO usuarios (nombre, correo, password, rol, estado)
     VALUES (?, ?, ?, ?, ?)`,
    [nombre, correo, password, rol, estado]
  );
  return resultado.insertId;
}

/** Actualiza los campos indicados de un usuario. */
export async function modificar(id, campos) {
  const permitidos = ['nombre', 'correo', 'password', 'rol', 'estado'];
  const usados = Object.keys(campos).filter((c) => permitidos.includes(c));
  if (usados.length === 0) return false;

  const asignaciones = usados.map((c) => `${c} = ?`).join(', ');
  const valores = usados.map((c) => campos[c]);
  const resultado = await ejecutar(
    `UPDATE usuarios SET ${asignaciones} WHERE id_usuario = ?`,
    [...valores, id]
  );
  return resultado.affectedRows > 0;
}

/** Indica si ya existe un usuario con ese correo. */
export async function correoExiste(correo) {
  const filas = await consultar(
    'SELECT id_usuario FROM usuarios WHERE correo = ?',
    [correo]
  );
  return filas.length > 0;
}

/** Indica si ya existe un usuario con ese correo distinto del indicado. */
export async function correoExisteEnOtro(correo, idExcluir) {
  const filas = await consultar(
    'SELECT id_usuario FROM usuarios WHERE correo = ? AND id_usuario <> ?',
    [correo, idExcluir]
  );
  return filas.length > 0;
}
