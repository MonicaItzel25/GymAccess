// controllers/objetivo.controller.js
// Endpoints de los objetivos de entrenamiento (Sprint 3, US-S3-04).
// Recurso exclusivo del entrenador (autorizar en rutas, contrato §5); el
// perfil activo, la asignación vigente y las reglas de negocio se resuelven en
// el servicio. ES Modules.

import * as servicio from '../services/objetivo.service.js';
import { enviarOk, envolverControlador } from '../utils/response.js';

/** GET /api/objetivos?cliente=:id */
export const listar = envolverControlador(async (req, res) => {
  const objetivos = await servicio.listar({
    idCliente: Number(req.query.cliente),
    usuario: req.usuario,
  });
  return enviarOk(res, objetivos);
});

/** POST /api/objetivos */
export const crear = envolverControlador(async (req, res) => {
  const objetivo = await servicio.crear(
    {
      idCliente: Number(req.body.id_cliente),
      meta: req.body.meta,
      unidad: req.body.unidad,
      fechaObjetivo: req.body.fecha_objetivo,
    },
    req.usuario
  );
  return enviarOk(res, objetivo, 201);
});

/** PUT /api/objetivos/:id */
export const actualizar = envolverControlador(async (req, res) => {
  // Los campos no enviados llegan como `undefined` para que el servicio los
  // conserve; `unidad: null` significa quitar la unidad.
  const objetivo = await servicio.modificar(
    Number(req.params.id),
    {
      meta: req.body.meta,
      unidad: req.body.unidad,
      fechaObjetivo: req.body.fecha_objetivo,
    },
    req.usuario
  );
  return enviarOk(res, objetivo);
});

/** PATCH /api/objetivos/:id/estado */
export const cambiarEstado = envolverControlador(async (req, res) => {
  const objetivo = await servicio.cambiarEstado(
    Number(req.params.id),
    req.body.estado,
    req.usuario
  );
  return enviarOk(res, objetivo);
});
