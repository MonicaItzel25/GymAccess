// controllers/miEntrenamiento.controller.js
// Endpoints de consulta propia del cliente (Sprint 3, US-S3-05). Solo se
// utiliza la identidad de la sesión (`req.usuario`). ES Modules.

import * as servicio from '../services/miEntrenamiento.service.js';
import { enviarOk, envolverControlador } from '../utils/response.js';

/** GET /api/mi-entrenamiento/rutina */
export const rutina = envolverControlador(async (req, res) =>
  enviarOk(res, await servicio.obtenerRutina(req.usuario))
);

/** GET /api/mi-entrenamiento/objetivos */
export const objetivos = envolverControlador(async (req, res) =>
  enviarOk(res, await servicio.listarObjetivos(req.usuario))
);

/** GET /api/mi-entrenamiento/progresos */
export const progresos = envolverControlador(async (req, res) =>
  enviarOk(res, await servicio.listarProgresos(req.usuario))
);
