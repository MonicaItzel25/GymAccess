// models/acceso.model.js
// Acceso a datos de la tabla `accesos`. Registra TODOS los intentos, sin
// eliminación ordinaria (FR-018). Consultas parametrizadas. ES Modules.

import { consultar, ejecutar } from '../config/db.js';

/** Registra un intento de acceso y devuelve su identificador. */
export async function registrar({ idCliente = null, fecha, hora, resultado, motivoRechazo = null }) {
  const r = await ejecutar(
    `INSERT INTO accesos (id_cliente, fecha, hora, resultado, motivo_rechazo)
     VALUES (?, ?, ?, ?, ?)`,
    [idCliente, fecha, hora, resultado, motivoRechazo]
  );
  return r.insertId;
}

/** Lista los intentos de acceso con filtros opcionales. */
export async function listar({ desde = null, hasta = null, idCliente = null } = {}) {
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
  if (idCliente) {
    condiciones.push('a.id_cliente = ?');
    parametros.push(idCliente);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  return consultar(
    `SELECT a.id_acceso, a.id_cliente, a.fecha, a.hora, a.resultado, a.motivo_rechazo,
            c.nombre AS cliente_nombre, c.apellido AS cliente_apellido
     FROM accesos a
     LEFT JOIN clientes c ON c.id_cliente = a.id_cliente
     ${where}
     ORDER BY a.fecha_intento DESC, a.id_acceso DESC`,
    parametros
  );
}
