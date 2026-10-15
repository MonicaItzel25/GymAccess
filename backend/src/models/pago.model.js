// models/pago.model.js
// Acceso a datos de la tabla `pagos`. Consultas parametrizadas.
// Sin operaciones de eliminación ordinaria (FR-008). ES Modules.

import { consultar, ejecutar } from '../config/db.js';

const COLUMNAS = `
  p.id_pago, p.id_cliente, p.id_membresia, p.monto, p.fecha_pago,
  p.metodo_pago, p.estado,
  c.nombre AS cliente_nombre, c.apellido AS cliente_apellido
`;

const JOINS = `
  FROM pagos p
  JOIN clientes c ON c.id_cliente = p.id_cliente
`;

/** Inserta un pago y devuelve su identificador. */
export async function crear({ idCliente, idMembresia, monto, metodoPago }) {
  const resultado = await ejecutar(
    `INSERT INTO pagos (id_cliente, id_membresia, monto, metodo_pago, estado)
     VALUES (?, ?, ?, ?, 'pagado')`,
    [idCliente, idMembresia, monto, metodoPago]
  );
  return resultado.insertId;
}

/** Lista pagos; filtro opcional por cliente. */
export async function listar(idCliente = null) {
  if (idCliente) {
    return consultar(
      `SELECT ${COLUMNAS} ${JOINS} WHERE p.id_cliente = ? ORDER BY p.fecha_pago DESC`,
      [idCliente]
    );
  }
  return consultar(`SELECT ${COLUMNAS} ${JOINS} ORDER BY p.fecha_pago DESC`);
}

/** Devuelve un pago por identificador, o null. */
export async function obtenerPorId(id) {
  const filas = await consultar(`SELECT ${COLUMNAS} ${JOINS} WHERE p.id_pago = ?`, [id]);
  return filas[0] || null;
}

/** Suma los pagos de una membresía (para el cálculo de adeudo, FR-009). */
export async function sumarPagosPorMembresia(idMembresia) {
  const filas = await consultar(
    'SELECT COALESCE(SUM(monto), 0) AS total FROM pagos WHERE id_membresia = ?',
    [idMembresia]
  );
  return Number(filas[0].total);
}
