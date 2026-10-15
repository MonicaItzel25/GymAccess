// models/rostro.model.js
// Acceso a datos de la tabla `rostros`. Consultas parametrizadas.
// El descriptor facial NUNCA se devuelve en las respuestas de la API
// (FR-020): este modelo solo lo expone a los servicios internos para la
// comparación. ES Modules.

import { consultar, ejecutar } from '../config/db.js';

/** Registra o actualiza el descriptor facial de un cliente (UNIQUE por cliente).
 *  Devuelve true si creó un registro nuevo y false si actualizó uno existente. */
export async function registrarOActualizar(idCliente, descriptor) {
  const resultado = await ejecutar(
    `INSERT INTO rostros (id_cliente, descriptor_facial, estado)
     VALUES (?, ?, 'activo')
     ON DUPLICATE KEY UPDATE
       descriptor_facial = VALUES(descriptor_facial),
       fecha_registro = CURRENT_TIMESTAMP,
       estado = 'activo'`,
    [idCliente, JSON.stringify(descriptor)]
  );
  return resultado.affectedRows > 0 && resultado.insertId > 0;
}

/** Devuelve los metadatos del rostro de un cliente (sin el descriptor). */
export async function obtenerMetadatos(idCliente) {
  const filas = await consultar(
    'SELECT id_cliente, fecha_registro, estado FROM rostros WHERE id_cliente = ?',
    [idCliente]
  );
  return filas[0] || null;
}

/** Indica si un cliente tiene rostro registrado y activo. */
export async function tieneRostroActivo(idCliente) {
  const filas = await consultar(
    "SELECT id_rostro FROM rostros WHERE id_cliente = ? AND estado = 'activo'",
    [idCliente]
  );
  return filas.length > 0;
}

/** Devuelve los descriptores faciales activos junto a su cliente, para la
 *  comparación en memoria. Uso INTERNO del backend; jamás se expone por API. */
export async function listarDescriptoresActivos() {
  return consultar(
    `SELECT r.id_cliente, r.descriptor_facial, c.nombre, c.apellido, c.estado AS cliente_estado
     FROM rostros r
     JOIN clientes c ON c.id_cliente = r.id_cliente
     WHERE r.estado = 'activo' AND c.estado = 'activo'`
  );
}
