// controllers/cliente.controller.js
// Endpoints de clientes. Las operaciones de escritura son exclusivas de
// administrador y recepcionista; las de consulta dependen del rol.
// ES Modules.

import * as servicio from '../services/cliente.service.js';
import { enviarOk, envolverControlador } from '../utils/response.js';

/** POST /api/clientes */
export const crear = envolverControlador(async (req, res) => {
  const cliente = await servicio.crear(req.body);
  return enviarOk(res, cliente, 201);
});

/** GET /api/clientes */
export const listar = envolverControlador(async (req, res) => {
  const buscar = (req.query.buscar || '').toString().trim();
  // El entrenador solo recibe la información básica de su rol (FR-011).
  const basicos = req.usuario.rol === 'entrenador';
  const clientes = await servicio.listar({ buscar, basicos });
  return enviarOk(res, clientes);
});

/** GET /api/clientes/:id */
export const obtener = envolverControlador(async (req, res) => {
  // El entrenador solo recibe la información básica de su rol (FR-011).
  const basico = req.usuario.rol === 'entrenador';
  const cliente = await servicio.obtener(Number(req.params.id), { basico });
  return enviarOk(res, cliente);
});

/** PUT /api/clientes/:id */
export const actualizar = envolverControlador(async (req, res) => {
  const cliente = await servicio.actualizar(Number(req.params.id), req.body);
  return enviarOk(res, cliente);
});

/** GET /api/clientes/mio */
export const mio = envolverControlador(async (req, res) => {
  const cliente = await servicio.obtenerPorCorreoUsuario(req.usuario.correo);
  return enviarOk(res, cliente);
});
