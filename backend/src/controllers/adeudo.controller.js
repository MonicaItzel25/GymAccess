// controllers/adeudo.controller.js
// Endpoints de consulta de adeudos (FR-019, FR-020).
// GET /api/adeudos: solo administrador. GET /api/adeudos/mio: solo cliente.
// ES Modules.

import * as servicio from '../services/pago.service.js';
import { enviarOk, envolverControlador } from '../utils/response.js';

/** GET /api/adeudos (solo administrador) */
export const listar = envolverControlador(async (req, res) => {
  const adeudos = await servicio.listarAdeudos();
  return enviarOk(res, adeudos);
});

/** GET /api/adeudos/mio (solo cliente) */
export const mio = envolverControlador(async (req, res) => {
  const adeudos = await servicio.listarAdeudosPorCorreo(req.usuario.correo);
  return enviarOk(res, adeudos);
});
