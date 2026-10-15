// controllers/auditoria.controller.js
// Endpoint de consulta de auditoría (FR-021). Solo administrador.
// Filtros: ?desde=, ?hasta= (fecha o fecha y hora) y ?modulo=.
// No existe endpoint de eliminación (FR-008). ES Modules.

import * as servicio from '../services/auditoria.service.js';
import * as modelo from '../models/auditoria.model.js';
import { enviarOk, envolverControlador } from '../utils/response.js';

/**
 * Normaliza un filtro de fecha para comparar contra una columna DATETIME:
 * si llega solo 'YYYY-MM-DD' se completa con 00:00:00 o 23:59:59 para que
 * el día completo quede incluido en el rango.
 */
function normalizarFecha(valor, extremo) {
  if (!valor) return null;
  const texto = String(valor).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return extremo === 'inicio' ? `${texto} 00:00:00` : `${texto} 23:59:59`;
  }
  return texto;
}

/** GET /api/auditoria (solo administrador) */
export const listar = envolverControlador(async (req, res) => {
  const registros = await modelo.listar({
    desde: normalizarFecha(req.query.desde, 'inicio'),
    hasta: normalizarFecha(req.query.hasta, 'fin'),
    modulo: req.query.modulo || null,
  });
  return enviarOk(res, registros);
});

/** Reexporta el servicio por si otra capa lo necesita. */
export { servicio };
