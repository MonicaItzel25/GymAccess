// models/auditoria.model.js
// Acceso a datos de la tabla `auditoria` (FR-021). Consultas parametrizadas.
// id_usuario puede ser nulo para acciones del sistema (kiosco sin sesión).
// ES Modules.

import { consultar, ejecutar } from '../config/db.js';

/** Inserta un registro de auditoría y devuelve su identificador. */
export async function crear({ idUsuario = null, accion, modulo, resultado, descripcion = null }) {
  const resultadoIns = await ejecutar(
    `INSERT INTO auditoria (id_usuario, accion, modulo, resultado, descripcion)
     VALUES (?, ?, ?, ?, ?)`,
    [idUsuario, accion, modulo, resultado, descripcion]
  );
  return resultadoIns.insertId;
}

/** Lista registros de auditoría con filtros opcionales de fecha y módulo. */
export async function listar({ desde = null, hasta = null, modulo = null } = {}) {
  const condiciones = [];
  const parametros = [];

  if (desde) {
    condiciones.push('fecha >= ?');
    parametros.push(desde);
  }
  if (hasta) {
    condiciones.push('fecha <= ?');
    parametros.push(hasta);
  }
  if (modulo) {
    condiciones.push('modulo = ?');
    parametros.push(modulo);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  return consultar(
    `SELECT id_auditoria, id_usuario, accion, modulo, fecha, resultado, descripcion
     FROM auditoria
     ${where}
     ORDER BY fecha DESC, id_auditoria DESC`,
    parametros
  );
}
