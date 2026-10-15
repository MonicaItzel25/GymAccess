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

/** Actualiza los campos indicados de un usuario. Si se entrega una `conexion`
 *  (transacción abierta), la sentencia se ejecuta sobre esa conexión; en caso
 *  contrario, sobre el pool. */
export async function modificar(id, campos, conexion = null) {
  const permitidos = ['nombre', 'correo', 'password', 'rol', 'estado'];
  const usados = Object.keys(campos).filter((c) => permitidos.includes(c));
  if (usados.length === 0) return false;

  const asignaciones = usados.map((c) => `${c} = ?`).join(', ');
  const valores = usados.map((c) => campos[c]);
  const sql = `UPDATE usuarios SET ${asignaciones} WHERE id_usuario = ?`;
  const parametros = [...valores, id];

  if (conexion) {
    const [resultado] = await conexion.execute(sql, parametros);
    return resultado.affectedRows > 0;
  }
  const resultado = await ejecutar(sql, parametros);
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

/** Devuelve el usuario con bloqueo FOR UPDATE dentro de una transacción
 *  (FR-014): congela la fila mientras se verifica el último administrador. */
export async function obtenerConBloqueo(id, conexion) {
  const [filas] = await conexion.query(
    `SELECT id_usuario, nombre, rol, estado
     FROM usuarios
     WHERE id_usuario = ?
     FOR UPDATE`,
    [id]
  );
  return filas[0] || null;
}

/** Cuenta los administradores activos con bloqueo FOR UPDATE (FR-014): el
 *  bloqueo serializa verificaciones concurrentes del último administrador. */
export async function contarAdministradoresActivos(conexion) {
  const [filas] = await conexion.query(
    `SELECT COUNT(*) AS total
     FROM usuarios
     WHERE rol = 'administrador' AND estado = 'activo'
     FOR UPDATE`
  );
  return Number(filas[0].total);
}
