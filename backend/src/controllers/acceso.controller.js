// controllers/acceso.controller.js
// Endpoints del control de acceso. El intento del kiosco es la única ruta sin
// token (decisión justificada en plan.md / Complexity Tracking). La consulta
// exige autenticación y rol autorizado. ES Modules.

import * as servicio from '../services/acceso.service.js';
import * as accesoModelo from '../models/acceso.model.js';
import { enviarOk, envolverControlador } from '../utils/response.js';

/** POST /api/acceso/intento (kiosco, sin token). */
export const intentar = envolverControlador(async (req, res) => {
  const decision = await servicio.intentarAcceso(req.body.descriptor_facial);
  return enviarOk(res, decision, 200);
});

/** POST /api/acceso/manual (administrador o recepcionista, FR-030).
 *  El backend valida y decide; responde 201 al registrar. */
export const autorizarManual = envolverControlador(async (req, res) => {
  const { id_cliente, resultado, motivo } = req.body;
  const registro = await servicio.autorizarAccesoManual(
    { idCliente: Number(id_cliente), resultado, motivo: motivo ?? null },
    req.usuario.id_usuario
  );
  return enviarOk(res, registro, 201);
});

/** GET /api/accesos (administrador, recepcionista, entrenador). */
export const listar = envolverControlador(async (req, res) => {
  const { desde, hasta, cliente } = req.query;
  const accesos = await accesoModelo.listar({
    desde: desde || null,
    hasta: hasta || null,
    idCliente: cliente ? Number(cliente) : null,
  });
  return enviarOk(res, accesos);
});

/** GET /api/accesos/mio (solo cliente, FR-036). */
export const mio = envolverControlador(async (req, res) => {
  // Localiza al cliente por coincidencia de correo (patrón heredado).
  const { obtenerPorCorreo } = await import('../models/cliente.model.js');
  const cliente = await obtenerPorCorreo(req.usuario.correo);
  const accesos = cliente
    ? await accesoModelo.listar({ idCliente: cliente.id_cliente })
    : [];
  return enviarOk(res, accesos);
});
