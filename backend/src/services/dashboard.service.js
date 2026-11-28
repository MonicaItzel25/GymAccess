// services/dashboard.service.js
// Indicadores consolidados del administrador (Sprint 3, US-S3-06, FR-025 a
// FR-029). Solo lectura. El periodo por defecto es el mes en curso completo.
// Las membresías, los adeudos y los estados actuales son una fotografía de hoy;
// altas, pagos, accesos y progresos se acotan al periodo. ES Modules.

import * as modelo from '../models/dashboard.model.js';
import { ErrorServicio } from '../utils/errorServicio.js';
import { aFechaLocal, hoy } from '../utils/fechas.js';

/** Umbral de «por vencer» (Clarification Q3). */
const DIAS_POR_VENCER = 7;

/** Primer y último día del mes de la fecha indicada ('YYYY-MM-DD'). */
function mesCompleto(fecha) {
  const [anio, mes] = fecha.split('-').map(Number);
  return {
    desde: aFechaLocal(new Date(anio, mes - 1, 1)),
    hasta: aFechaLocal(new Date(anio, mes, 0)),
  };
}

/** Suma días a una fecha 'YYYY-MM-DD' con aritmética local. */
function sumarDias(fecha, dias) {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return aFechaLocal(new Date(anio, mes - 1, dia + dias));
}

/** Devuelve los indicadores del periodo (contrato §8). */
export async function obtener({ desde = null, hasta = null } = {}) {
  const fechaActual = hoy();
  const porDefecto = mesCompleto(fechaActual);
  const periodo = { desde: desde || porDefecto.desde, hasta: hasta || porDefecto.hasta };
  if (periodo.desde > periodo.hasta) {
    throw new ErrorServicio('El periodo de fechas es inválido', 400);
  }

  const parametros = {
    ...periodo,
    hoy: fechaActual,
    limite: sumarDias(fechaActual, DIAS_POR_VENCER),
  };
  const [clientes, membresias, pagos, accesos, entrenamiento, carga] = await Promise.all([
    modelo.contarClientes(parametros),
    modelo.contarMembresias(parametros),
    modelo.resumirPagos(parametros),
    modelo.contarAccesos(parametros),
    modelo.contarEntrenamiento(parametros),
    modelo.cargaPorEntrenador(),
  ]);

  return {
    periodo,
    clientes,
    membresias,
    pagos,
    accesos,
    entrenamiento: { ...entrenamiento, cargaPorEntrenador: carga },
  };
}
