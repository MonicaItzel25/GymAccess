// controllers/dashboard.controller.js
// Endpoint del dashboard administrativo (Sprint 3, US-S3-06). ES Modules.

import * as servicio from '../services/dashboard.service.js';
import { enviarOk, envolverControlador } from '../utils/response.js';

/** GET /api/dashboard?desde=&hasta= */
export const obtener = envolverControlador(async (req, res) =>
  enviarOk(res, await servicio.obtener({ desde: req.query.desde, hasta: req.query.hasta }))
);
