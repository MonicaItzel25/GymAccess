// controllers/rutina.controller.js
// Endpoints de las rutinas de entrenamiento (Sprint 3, US-S3-03).
// Recurso exclusivo del entrenador (autorizar en rutas, contrato §4); la
// asignación vigente se resuelve en el servicio. ES Modules.

import * as servicio from '../services/rutina.service.js';
import { enviarOk, envolverControlador } from '../utils/response.js';

/** GET /api/rutinas?cliente=:id */
export const listar = envolverControlador(async (req, res) => {
  const rutinas = await servicio.listar({
    idCliente: req.query.cliente ? Number(req.query.cliente) : null,
    usuario: req.usuario,
  });
  return enviarOk(res, rutinas);
});

/** GET /api/rutinas/:id */
export const obtenerPorId = envolverControlador(async (req, res) => {
  const rutina = await servicio.obtenerPorId(Number(req.params.id), req.usuario);
  return enviarOk(res, rutina);
});

/** POST /api/rutinas */
export const crear = envolverControlador(async (req, res) => {
  const rutina = await servicio.crear(
    {
      idCliente: Number(req.body.id_cliente),
      nombre: req.body.nombre,
      ejercicios: req.body.ejercicios,
      usuario: req.usuario,
    },
    req.usuario.id_usuario
  );
  return enviarOk(res, rutina, 201);
});

/** PUT /api/rutinas/:id */
export const actualizar = envolverControlador(async (req, res) => {
  const rutina = await servicio.modificar(
    Number(req.params.id),
    {
      nombre: req.body.nombre ?? null,
      ejercicios: req.body.ejercicios ?? null,
    },
    req.usuario,
    req.usuario.id_usuario
  );
  return enviarOk(res, rutina);
});

/** PATCH /api/rutinas/:id/estado */
export const cambiarEstado = envolverControlador(async (req, res) => {
  const rutina = await servicio.cambiarEstado(
    Number(req.params.id),
    req.body.estado,
    req.usuario,
    req.usuario.id_usuario
  );
  return enviarOk(res, rutina);
});
