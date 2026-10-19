// controllers/rostro.controller.js
// Endpoints de información facial. Escritura y consulta: administrador y
// recepcionista. El entrenador y el cliente reciben 403. El descriptor facial
// nunca se devuelve (FR-024). ES Modules.

import * as servicio from '../services/rostro.service.js';
import { enviarOk, envolverControlador } from '../utils/response.js';

/** POST /api/clientes/:id/rostro */
export const registrar = envolverControlador(async (req, res) => {
  const idCliente = Number(req.params.id);
  const resultado = await servicio.registrarRostro(
    idCliente,
    req.body.descriptor_facial,
    req.usuario.id_usuario
  );
  // 201 al crear un registro nuevo, 200 al actualizar uno existente (contrato).
  const { es_creacion, ...estado } = resultado;
  return enviarOk(res, estado, es_creacion ? 201 : 200);
});

/** GET /api/clientes/:id/rostro */
export const obtenerEstado = envolverControlador(async (req, res) => {
  const estado = await servicio.obtenerEstadoRostro(Number(req.params.id));
  return enviarOk(res, estado);
});
