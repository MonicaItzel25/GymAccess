// controllers/asignacion.controller.js
// Endpoints de asignaciones entrenador–cliente (Sprint 3, US-S3-02).
// GET: administrador, recepcionista y entrenador (el entrenador siempre
// recibe solo las suyas, validado en el servicio, contrato §2).
// Escritura: administrador y recepcionista. ES Modules.

import * as servicio from '../services/asignacion.service.js';
import { enviarOk, envolverControlador } from '../utils/response.js';

/** GET /api/asignaciones?entrenador=:id&vigentes=true|false */
export const listar = envolverControlador(async (req, res) => {
  const vigentes =
    req.query.vigentes === undefined ? undefined : req.query.vigentes === 'true';
  const asignaciones = await servicio.listar({
    idEntrenador: req.query.entrenador ? Number(req.query.entrenador) : null,
    vigentes,
    usuario: req.usuario,
  });
  return enviarOk(res, asignaciones);
});

/** POST /api/asignaciones */
export const crear = envolverControlador(async (req, res) => {
  const asignacion = await servicio.crear(
    {
      idCliente: Number(req.body.id_cliente),
      idEntrenador: Number(req.body.id_entrenador),
      fechaInicio: req.body.fecha_inicio ?? null,
    },
    req.usuario.id_usuario
  );
  return enviarOk(res, asignacion, 201);
});

/** PUT /api/asignaciones/:id/finalizar */
export const finalizar = envolverControlador(async (req, res) => {
  const asignacion = await servicio.finalizar(
    Number(req.params.id),
    { fechaFin: req.body.fecha_fin ?? null },
    req.usuario.id_usuario
  );
  return enviarOk(res, asignacion);
});
