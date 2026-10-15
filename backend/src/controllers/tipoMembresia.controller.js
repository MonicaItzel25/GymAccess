// controllers/tipoMembresia.controller.js
// Endpoints de tipos de membresía. Escritura (POST/PUT): solo administrador
// (FR-001). Consulta (GET): administrador y recepcionista. ES Modules.

import * as servicio from '../services/tipoMembresia.service.js';
import { enviarOk, envolverControlador } from '../utils/response.js';

/** POST /api/tipos-membresia */
export const crear = envolverControlador(async (req, res) => {
  const tipo = await servicio.crear(req.body, req.usuario.id_usuario);
  return enviarOk(res, tipo, 201);
});

/** GET /api/tipos-membresia */
export const listar = envolverControlador(async (req, res) => {
  const tipos = await servicio.listar();
  return enviarOk(res, tipos);
});

/** GET /api/tipos-membresia/:id */
export const obtener = envolverControlador(async (req, res) => {
  const tipo = await servicio.obtener(Number(req.params.id));
  return enviarOk(res, tipo);
});

/** PUT /api/tipos-membresia/:id */
export const actualizar = envolverControlador(async (req, res) => {
  const tipo = await servicio.actualizar(Number(req.params.id), req.body, req.usuario.id_usuario);
  return enviarOk(res, tipo);
});
