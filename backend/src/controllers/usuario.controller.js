// controllers/usuario.controller.js
// Endpoints de gestión de usuarios (exclusivos del administrador).
// ES Modules.

import * as servicio from '../services/usuario.service.js';
import { enviarOk, envolverControlador } from '../utils/response.js';

/** GET /api/usuarios */
export const listar = envolverControlador(async (req, res) => {
  const usuarios = await servicio.listar();
  return enviarOk(res, usuarios);
});

/** GET /api/usuarios/:id */
export const obtener = envolverControlador(async (req, res) => {
  const usuario = await servicio.obtener(Number(req.params.id));
  return enviarOk(res, usuario);
});

/** POST /api/usuarios */
export const crear = envolverControlador(async (req, res) => {
  const usuario = await servicio.crear(req.body, req.usuario.id_usuario);
  return enviarOk(res, usuario, 201);
});

/** PUT /api/usuarios/:id — despacha a la operación concreta según los campos.
 *  `rol` y `estado` solo pasan por cambiarRol/cambiarEstado (protección
 *  FR-014 del último administrador); el resto va a modificación general. */
export const modificar = envolverControlador(async (req, res) => {
  const id = Number(req.params.id);
  const campos = req.body || {};
  const claves = Object.keys(campos);

  let usuario;
  if (claves.length > 0 && claves.every((c) => c === 'rol')) {
    usuario = await servicio.cambiarRol(id, campos.rol, req.usuario.id_usuario);
  } else if (claves.length > 0 && claves.every((c) => c === 'estado')) {
    usuario = await servicio.cambiarEstado(id, campos.estado, req.usuario.id_usuario);
  } else {
    usuario = await servicio.modificar(id, campos, req.usuario.id_usuario);
  }

  return enviarOk(res, usuario);
});
