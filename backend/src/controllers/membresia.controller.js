// controllers/membresia.controller.js
// Endpoints de membresías. Asignación y renovación: administrador y
// recepcionista. Consulta: administrador, recepcionista y entrenador.
// ES Modules.

import * as servicio from '../services/membresia.service.js';
import { enviarOk, envolverControlador } from '../utils/response.js';

/** POST /api/membresias */
export const asignar = envolverControlador(async (req, res) => {
  const { id_cliente, id_tipo_membresia, fecha_inicio } = req.body;
  const membresia = await servicio.asignarMembresia({
    idCliente: Number(id_cliente),
    idTipoMembresia: Number(id_tipo_membresia),
    fechaInicio: fecha_inicio ? new Date(fecha_inicio).toISOString().slice(0, 10) : null,
    idUsuario: req.usuario.id_usuario,
  });
  return enviarOk(res, membresia, 201);
});

/** GET /api/membresias */
export const listar = envolverControlador(async (req, res) => {
  const idCliente = req.query.cliente ? Number(req.query.cliente) : null;
  const membresias = await servicio.listar({ idCliente });
  return enviarOk(res, membresias);
});

/** GET /api/membresias/:id */
export const obtener = envolverControlador(async (req, res) => {
  const membresia = await servicio.obtener(Number(req.params.id));
  return enviarOk(res, membresia);
});

/** PUT /api/membresias/:id/renovar (administrador, recepcionista) */
export const renovar = envolverControlador(async (req, res) => {
  const { fecha_inicio, id_tipo_membresia } = req.body;
  const membresia = await servicio.renovarMembresia(
    Number(req.params.id),
    {
      fechaInicio: fecha_inicio ? new Date(fecha_inicio).toISOString().slice(0, 10) : null,
      idTipoMembresia: id_tipo_membresia ? Number(id_tipo_membresia) : null,
    },
    req.usuario.id_usuario
  );
  return enviarOk(res, membresia, 201);
});

/** PUT /api/membresias/:id/suspender (solo administrador) */
export const suspender = envolverControlador(async (req, res) => {
  const membresia = await servicio.suspenderMembresia(Number(req.params.id), req.usuario.id_usuario);
  return enviarOk(res, membresia);
});

/** PUT /api/membresias/:id/reactivar (solo administrador) */
export const reactivar = envolverControlador(async (req, res) => {
  const membresia = await servicio.reactivarMembresia(Number(req.params.id), req.usuario.id_usuario);
  return enviarOk(res, membresia);
});

/** PUT /api/membresias/:id/cancelar (solo administrador) */
export const cancelar = envolverControlador(async (req, res) => {
  const membresia = await servicio.cancelarMembresia(Number(req.params.id), req.usuario.id_usuario);
  return enviarOk(res, membresia);
});
