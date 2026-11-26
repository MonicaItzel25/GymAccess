// controllers/entrenador.controller.js
// Endpoints de perfiles de entrenador (Sprint 3, US-S3-01).
// Escritura (POST/PUT): solo administrador. Consulta (GET): administrador y
// recepcionista (contrato §1). ES Modules.

import * as servicio from '../services/entrenador.service.js';
import { enviarOk, envolverControlador } from '../utils/response.js';

/** GET /api/entrenadores */
export const listar = envolverControlador(async (req, res) => {
  const entrenadores = await servicio.listar();
  return enviarOk(res, entrenadores);
});

/** GET /api/entrenadores/:id */
export const obtener = envolverControlador(async (req, res) => {
  const entrenador = await servicio.obtener(Number(req.params.id));
  return enviarOk(res, entrenador);
});

/** POST /api/entrenadores */
export const crear = envolverControlador(async (req, res) => {
  const entrenador = await servicio.crearPerfil(
    {
      idUsuario: Number(req.body.id_usuario),
      especialidad: req.body.especialidad ?? null,
      telefono: req.body.telefono ?? null,
    },
    req.usuario.id_usuario
  );
  return enviarOk(res, entrenador, 201);
});

/** PUT /api/entrenadores/:id */
export const actualizar = envolverControlador(async (req, res) => {
  const entrenador = await servicio.modificarPerfil(
    Number(req.params.id),
    {
      especialidad: req.body.especialidad ?? null,
      telefono: req.body.telefono ?? null,
    },
    req.usuario.id_usuario
  );
  return enviarOk(res, entrenador);
});

/** PUT /api/entrenadores/:id/estado */
export const cambiarEstado = envolverControlador(async (req, res) => {
  const entrenador = await servicio.cambiarEstadoPerfil(
    Number(req.params.id),
    req.body.estado,
    req.usuario.id_usuario
  );
  return enviarOk(res, entrenador);
});
