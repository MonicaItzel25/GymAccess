// models/tipoMembresia.model.js
// Acceso a datos de la tabla `tipos_membresia`. Consultas parametrizadas.
// ES Modules.

import { consultar, ejecutar } from '../config/db.js';

/** Devuelve todos los tipos de membresía. */
export async function listar() {
  return consultar(
    `SELECT id_tipo_membresia, nombre, descripcion, duracion, precio, estado
     FROM tipos_membresia
     ORDER BY nombre`
  );
}

/** Devuelve un tipo de membresía por identificador, o null. */
export async function obtenerPorId(id) {
  const filas = await consultar(
    `SELECT id_tipo_membresia, nombre, descripcion, duracion, precio, estado
     FROM tipos_membresia WHERE id_tipo_membresia = ?`,
    [id]
  );
  return filas[0] || null;
}

/** Inserta un tipo de membresía y devuelve su identificador. */
export async function crear({ nombre, descripcion = null, duracion, precio, estado = 'activo' }) {
  const resultado = await ejecutar(
    `INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado)
     VALUES (?, ?, ?, ?, ?)`,
    [nombre, descripcion, duracion, precio, estado]
  );
  return resultado.insertId;
}

/** Actualiza los campos indicados de un tipo de membresía. */
export async function actualizar(id, campos) {
  const permitidos = ['nombre', 'descripcion', 'duracion', 'precio', 'estado'];
  const usados = Object.keys(campos).filter((c) => permitidos.includes(c));
  if (usados.length === 0) return false;

  const asignaciones = usados.map((c) => `${c} = ?`).join(', ');
  const valores = usados.map((c) => campos[c]);
  const resultado = await ejecutar(
    `UPDATE tipos_membresia SET ${asignaciones} WHERE id_tipo_membresia = ?`,
    [...valores, id]
  );
  return resultado.affectedRows > 0;
}
