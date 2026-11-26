// controllers/progreso.controller.js
// Endpoints del progreso de los clientes (Sprint 3, US-S3-04).
// Recurso exclusivo del entrenador (autorizar en rutas, contrato §6), solo de
// alta y consulta; las reglas de negocio se resuelven en el servicio.
// ES Modules.

import * as servicio from '../services/progreso.service.js';
import { enviarOk, envolverControlador } from '../utils/response.js';

/** Convierte a número conservando la ausencia de valor como `null`. */
function aNumeroONulo(valor) {
  return valor === undefined || valor === null ? null : Number(valor);
}

/** GET /api/progresos?cliente=:id&desde=&hasta= */
export const listar = envolverControlador(async (req, res) => {
  const progresos = await servicio.listar({
    idCliente: Number(req.query.cliente),
    desde: req.query.desde || null,
    hasta: req.query.hasta || null,
    usuario: req.usuario,
  });
  return enviarOk(res, progresos);
});

/** POST /api/progresos */
export const crear = envolverControlador(async (req, res) => {
  const progreso = await servicio.crear(
    {
      idCliente: Number(req.body.id_cliente),
      idObjetivo: aNumeroONulo(req.body.id_objetivo),
      // Se entrega al servicio para que lo rechace: aún no puede guardarse.
      idProgresoCorregido: aNumeroONulo(req.body.id_progreso_corregido),
      fecha: req.body.fecha,
      valorNumerico: aNumeroONulo(req.body.valor_numerico),
      avance: req.body.avance,
      comentario: req.body.comentario,
    },
    req.usuario
  );
  return enviarOk(res, progreso, 201);
});
