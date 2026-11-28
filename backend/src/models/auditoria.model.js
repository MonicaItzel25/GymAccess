// models/auditoria.model.js
// Acceso a datos de la tabla `auditoria` (FR-037). Consultas parametrizadas.
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

/**
 * Lista registros de auditoría con filtros opcionales de fecha, módulo y actor
 * (US-S3-09). `actor` es un identificador de usuario si solo tiene dígitos; en
 * otro caso se busca como parte del nombre. Cada registro incluye `actor`, el
 * nombre de la cuenta, nulo en las acciones sin sesión. Solo consulta.
 */
export async function listar({ desde = null, hasta = null, modulo = null, actor = null } = {}) {
  const condiciones = [];
  const parametros = [];

  if (desde) {
    condiciones.push('a.fecha >= ?');
    parametros.push(desde);
  }
  if (hasta) {
    condiciones.push('a.fecha <= ?');
    parametros.push(hasta);
  }
  if (modulo) {
    condiciones.push('a.modulo = ?');
    parametros.push(modulo);
  }
  if (actor) {
    if (/^\d+$/.test(actor)) {
      condiciones.push('a.id_usuario = ?');
      parametros.push(Number(actor));
    } else {
      // Los comodines de LIKE se escapan para buscarlos como texto.
      condiciones.push('u.nombre LIKE ?');
      parametros.push(`%${actor.replace(/[\\%_]/g, '\\$&')}%`);
    }
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  return consultar(
    `SELECT a.id_auditoria, a.id_usuario, u.nombre AS actor, a.accion, a.modulo,
            a.fecha, a.resultado, a.descripcion
     FROM auditoria a
     LEFT JOIN usuarios u ON u.id_usuario = a.id_usuario
     ${where}
     ORDER BY a.fecha DESC, a.id_auditoria DESC`,
    parametros
  );
}
