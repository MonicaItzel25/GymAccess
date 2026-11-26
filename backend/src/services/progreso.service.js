// services/progreso.service.js
// Lógica de negocio del progreso de los clientes (Sprint 3, US-S3-04).
// El contenido es seguimiento deportivo y nunca un diagnóstico médico (FR-020,
// RN-013). Reglas: entrenador activo con asignación vigente (FR-003, RN-005);
// al menos un valor o un avance (FR-020); el objetivo asociado existe, es del
// mismo cliente y está activo; el historial solo admite alta y consulta
// (FR-021). Las correcciones vinculadas (`id_progreso_corregido`) se rechazan
// mientras no exista una columna donde guardar la referencia. Las altas y sus
// rechazos de negocio quedan en auditoría (FR-022); las consultas no.
//
// Limitaciones de concurrencia aceptadas (sin bloqueos ni transacciones): un
// objetivo puede cerrarse, o la asignación finalizar, entre la comprobación y
// el alta; en ese caso la entrada queda registrada. ES Modules.

import * as modelo from '../models/progreso.model.js';
import * as objetivoModelo from '../models/objetivo.model.js';
import * as auditoria from './auditoria.service.js';
import { exigirPerfilActivo, exigirAsignacionVigente } from './accesoEntrenamiento.service.js';
import { ErrorServicio } from '../utils/errorServicio.js';

const ACCION_ALTA = 'registrar progreso';

/** Registra en auditoría una operación sobre progresos (contrato §6). */
async function registrar(resultado, descripcion, usuario) {
  await auditoria.registrarAccion({
    idUsuario: usuario.id_usuario,
    accion: ACCION_ALTA,
    modulo: 'progresos',
    resultado,
    descripcion,
  });
}

/** Un valor numérico 0 cuenta como medición. */
function presente(valor) {
  return valor !== undefined && valor !== null && valor !== '';
}

/** El objetivo asociado debe existir, ser del mismo cliente y estar activo. */
async function exigirObjetivoDisponible(idObjetivo, idCliente) {
  const objetivo = await objetivoModelo.obtenerPorId(idObjetivo);
  if (!objetivo) {
    throw new ErrorServicio('Objetivo no encontrado', 404);
  }
  if (objetivo.id_cliente !== idCliente) {
    throw new ErrorServicio('El objetivo no pertenece a este cliente', 400);
  }
  if (objetivo.estado !== 'activo') {
    throw new ErrorServicio(
      'El objetivo ya está alcanzado o cerrado; no admite nuevos progresos',
      400
    );
  }
}

/** Historial de un cliente asignado, en orden ascendente y por periodo. */
export async function listar({ idCliente, desde = null, hasta = null, usuario }) {
  const perfil = await exigirPerfilActivo(usuario);
  await exigirAsignacionVigente(perfil, idCliente);
  return modelo.listar({ idCliente, desde, hasta });
}

/** Registra una entrada nueva de progreso (FR-020). */
export async function crear(
  {
    idCliente,
    idObjetivo = null,
    idProgresoCorregido = null,
    fecha,
    valorNumerico = null,
    avance = null,
    comentario = null,
  },
  usuario
) {
  try {
    const perfil = await exigirPerfilActivo(usuario);
    await exigirAsignacionVigente(perfil, idCliente);

    // Se rechaza antes de escribir: aceptar la referencia implicaría perderla.
    if (idProgresoCorregido !== null) {
      throw new ErrorServicio(
        'Todavía no es posible vincular correcciones: id_progreso_corregido no puede guardarse. No se registró ninguna entrada',
        400
      );
    }
    if (!presente(valorNumerico) && !presente(avance)) {
      throw new ErrorServicio('Indica un valor o un avance medido', 400);
    }
    if (idObjetivo !== null) {
      await exigirObjetivoDisponible(idObjetivo, idCliente);
    }

    const id = await modelo.crear({
      idCliente,
      idObjetivo,
      fecha,
      valorNumerico,
      avance,
      comentario,
    });
    await registrar('exitoso', `Progreso #${id} registrado para cliente #${idCliente}`, usuario);
    return modelo.obtenerPorId(id);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      await registrar('rechazado', `Alta rechazada para cliente #${idCliente}: ${error.message}`, usuario);
    }
    throw error;
  }
}
