// models/cliente.model.js
// Acceso a datos de la tabla `clientes`. Consultas siempre parametrizadas.
// ES Modules.

import { consultar, ejecutar } from '../config/db.js';

const COLUMNAS_BASICAS =
  'id_cliente, nombre, apellido, telefono, estado';
const COLUMNAS_COMPLETAS =
  'id_cliente, nombre, apellido, correo, telefono, direccion, fecha_registro, estado';

/** Devuelve todos los clientes, con búsqueda opcional por nombre o apellido. */
export async function listar(buscar = '') {
  if (buscar) {
    const patron = `%${buscar}%`;
    return consultar(
      `SELECT ${COLUMNAS_COMPLETAS}
       FROM clientes
       WHERE nombre LIKE ? OR apellido LIKE ?
       ORDER BY apellido, nombre`,
      [patron, patron]
    );
  }
  return consultar(`SELECT ${COLUMNAS_COMPLETAS} FROM clientes ORDER BY apellido, nombre`);
}

/** Devuelve solo los campos básicos (información para el entrenador). */
export async function listarBasicos() {
  return consultar(
    `SELECT ${COLUMNAS_BASICAS} FROM clientes ORDER BY apellido, nombre`
  );
}

/** Devuelve un cliente por identificador con todas sus columnas. */
export async function obtenerPorId(id) {
  const filas = await consultar(
    `SELECT ${COLUMNAS_COMPLETAS} FROM clientes WHERE id_cliente = ?`,
    [id]
  );
  return filas[0] || null;
}

/** Devuelve un cliente por correo (consulta de información propia). */
export async function obtenerPorCorreo(correo) {
  if (!correo) return null;
  const filas = await consultar(
    `SELECT ${COLUMNAS_COMPLETAS} FROM clientes WHERE correo = ?`,
    [correo]
  );
  return filas[0] || null;
}

/** Inserta un cliente y devuelve su identificador. */
export async function crear({ nombre, apellido, correo, telefono, direccion, estado = 'activo' }) {
  const resultado = await ejecutar(
    `INSERT INTO clientes (nombre, apellido, correo, telefono, direccion, estado)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [nombre, apellido, correo ?? null, telefono ?? null, direccion ?? null, estado]
  );
  return resultado.insertId;
}

/** Actualiza los campos indicados de un cliente. */
export async function actualizar(id, campos) {
  const permitidos = ['nombre', 'apellido', 'correo', 'telefono', 'direccion', 'estado'];
  const usados = Object.keys(campos).filter((c) => permitidos.includes(c));
  if (usados.length === 0) return false;

  const asignaciones = usados.map((c) => `${c} = ?`).join(', ');
  const valores = usados.map((c) => campos[c]);
  const resultado = await ejecutar(
    `UPDATE clientes SET ${asignaciones} WHERE id_cliente = ?`,
    [...valores, id]
  );
  return resultado.affectedRows > 0;
}

/** Indica si un correo ya pertenece a un cliente distinto del indicado. */
export async function correoExisteEnOtro(correo, idExcluir = null) {
  if (!correo) return false;
  const filas = idExcluir
    ? await consultar(
        'SELECT id_cliente FROM clientes WHERE correo = ? AND id_cliente <> ?',
        [correo, idExcluir]
      )
    : await consultar('SELECT id_cliente FROM clientes WHERE correo = ?', [correo]);
  return filas.length > 0;
}
