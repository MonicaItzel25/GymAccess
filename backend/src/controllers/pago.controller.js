// controllers/pago.controller.js
// Endpoints de pagos. Escritura y consulta: administrador y recepcionista.
// Información propia: solo rol cliente. No hay endpoints de eliminación
// (FR-016, SC-005). ES Modules.

import * as servicio from '../services/pago.service.js';
import { enviarOk, envolverControlador } from '../utils/response.js';

/** POST /api/pagos */
export const registrar = envolverControlador(async (req, res) => {
  const { id_cliente, id_membresia, monto, metodo_pago, id_operacion } = req.body;
  const pago = await servicio.registrarPago(
    { idCliente: id_cliente, idMembresia: id_membresia, monto, metodoPago: metodo_pago, idOperacion: id_operacion },
    req.usuario.id_usuario
  );
  return enviarOk(res, pago, 201);
});

/** GET /api/pagos */
export const listar = envolverControlador(async (req, res) => {
  const idCliente = req.query.cliente ? Number(req.query.cliente) : null;
  const pagos = await servicio.listar({ idCliente });
  return enviarOk(res, pagos);
});

/** GET /api/pagos/mio (solo cliente) */
export const mio = envolverControlador(async (req, res) => {
  const pagos = await servicio.listarPorCorreo(req.usuario.correo);
  return enviarOk(res, pagos);
});
