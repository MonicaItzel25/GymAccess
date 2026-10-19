// models/acceso.model.js
// Acceso a datos de la tabla `accesos`. Registra TODOS los intentos, sin
// eliminación ordinaria (FR-034, SC-005). Consultas parametrizadas. ES Modules.

import { consultar, ejecutar } from '../config/db.js';

/** Registra un intento de acceso y devuelve su identificador.
 *  `idUsuario` y `origen` soportan la autorización manual de recepción
 *  (FR-030, FR-034): 'kiosco' deja id_usuario nulo; 'manual' registra al personal
 *  responsable. Por defecto se comporta como el kiosco. */
export async function registrar({ idCliente = null, fecha, hora, resultado, motivoRechazo = null, idUsuario = null, origen = 'kiosco' }) {
  const r = await ejecutar(
    `INSERT INTO accesos (id_cliente, fecha, hora, resultado, motivo_rechazo, id_usuario, origen)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [idCliente, fecha, hora, resultado, motivoRechazo, idUsuario, origen]
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
            a.id_usuario, a.origen,
            c.nombre AS cliente_nombre, c.apellido AS cliente_apellido,
            u.nombre AS usuario_nombre
     FROM accesos a
     LEFT JOIN clientes c ON c.id_cliente = a.id_cliente
     LEFT JOIN usuarios u ON u.id_usuario = a.id_usuario
     ${where}
     ORDER BY a.fecha_intento DESC, a.id_acceso DESC`,
    parametros
  );
}
