// controllers/ejercicio.controller.js
// Endpoints del catálogo de ejercicios (Sprint 3, US-S3-08).
// GET: administrador y entrenador (el entrenador solo recibe activos,
// resuelto en el servicio, FR-012). Escritura: solo administrador (FR-011).
// ES Modules.

import * as servicio from '../services/ejercicio.service.js';
import { enviarOk, envolverControlador } from '../utils/response.js';

/** GET /api/ejercicios?estado=activo|inactivo|todos */
export const listar = envolverControlador(async (req, res) => {
  const ejercicios = await servicio.listar({
    estado: req.query.estado || 'activo',
    usuario: req.usuario,
  });
  return enviarOk(res, ejercicios);
});

/** POST /api/ejercicios */
export const crear = envolverControlador(async (req, res) => {
  const ejercicio = await servicio.crear(
    {
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      grupoMuscular: req.body.grupo_muscular ?? null,
    },
    req.usuario.id_usuario
  );
  return enviarOk(res, ejercicio, 201);
});

/** PUT /api/ejercicios/:id */
export const actualizar = envolverControlador(async (req, res) => {
  const ejercicio = await servicio.modificar(
    Number(req.params.id),
    {
      nombre: req.body.nombre ?? null,
      descripcion: req.body.descripcion ?? null,
      grupoMuscular: req.body.grupo_muscular ?? null,
    },
    req.usuario.id_usuario
  );
  return enviarOk(res, ejercicio);
});

/** PUT /api/ejercicios/:id/estado */
export const cambiarEstado = envolverControlador(async (req, res) => {
  const ejercicio = await servicio.cambiarEstado(
    Number(req.params.id),
    req.body.estado,
    req.usuario.id_usuario
  );
  return enviarOk(res, ejercicio);
});
