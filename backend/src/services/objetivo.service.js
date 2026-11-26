// services/objetivo.service.js
// Lógica de negocio de los objetivos de entrenamiento (Sprint 3, US-S3-04).
// Reglas: entrenador activo con asignación vigente para consultar, registrar o
// modificar (FR-003, RN-005); edición parcial que conserva los campos no
// enviados; solo un objetivo `activo` admite cambios y `alcanzado`/`cerrado`
// son terminales (data-model §5); sin borrado físico (FR-021). Las escrituras
// exitosas y los rechazos de negocio quedan en auditoría (FR-022); las
// consultas no se auditan.
//
// Limitaciones de concurrencia aceptadas (sin bloqueos ni transacciones):
//   - dos ediciones simultáneas del mismo objetivo pueden pisarse, porque los
//     campos no enviados se completan con la última lectura;
//   - la asignación vigente se comprueba antes de escribir y podría finalizar
//     entre ambas operaciones.
// El cierre simultáneo sí está protegido: el modelo solo cambia filas activas.
// ES Modules.

import * as modelo from '../models/objetivo.model.js';
import * as auditoria from './auditoria.service.js';
import { exigirPerfilActivo, exigirAsignacionVigente } from './accesoEntrenamiento.service.js';
import { ErrorServicio } from '../utils/errorServicio.js';

const MODULO = 'objetivos';
const MENSAJE_NO_ACTIVO = 'El objetivo ya está alcanzado o cerrado; no admite cambios';

/** Registra en auditoría una operación sobre objetivos (contrato §5). */
async function registrar(accion, resultado, descripcion, usuario) {
  await auditoria.registrarAccion({
    idUsuario: usuario.id_usuario,
    accion,
    modulo: MODULO,
    resultado,
    descripcion,
  });
}

/**
 * Ejecuta una escritura y, si se rechaza por permisos o reglas de negocio, la
 * audita con la misma acción y resultado `rechazado`. Los fallos técnicos no
 * son rechazos y se propagan sin registrarse como tales.
 */
async function auditarRechazo(accion, contexto, usuario, operacion) {
  try {
    return await operacion();
  } catch (error) {
    if (error instanceof ErrorServicio) {
      await registrar(accion, 'rechazado', `${contexto}: ${error.message}`, usuario);
    }
    throw error;
  }
}

/** Devuelve el objetivo si existe y el entrenador puede gestionarlo. */
async function obtenerGestionable(id, usuario) {
  const perfil = await exigirPerfilActivo(usuario);
  const objetivo = await modelo.obtenerPorId(id);
  if (!objetivo) {
    throw new ErrorServicio('Objetivo no encontrado', 404);
  }
  await exigirAsignacionVigente(perfil, objetivo.id_cliente);
  return objetivo;
}

/** Historial de objetivos de un cliente asignado. */
export async function listar({ idCliente, usuario }) {
  const perfil = await exigirPerfilActivo(usuario);
  await exigirAsignacionVigente(perfil, idCliente);
  return modelo.listar({ idCliente });
}

/** Registra un objetivo para un cliente asignado (FR-019). */
export async function crear({ idCliente, meta, unidad = null, fechaObjetivo }, usuario) {
  const accion = 'crear objetivo';
  return auditarRechazo(accion, `Alta rechazada para cliente #${idCliente}`, usuario, async () => {
    const perfil = await exigirPerfilActivo(usuario);
    await exigirAsignacionVigente(perfil, idCliente);

    const id = await modelo.crear({ idCliente, meta, unidad, fechaObjetivo });
    await registrar(accion, 'exitoso', `Objetivo #${id} creado para cliente #${idCliente}`, usuario);
    return modelo.obtenerPorId(id);
  });
}

/**
 * Modifica meta, unidad y/o fecha objetivo. Un campo `undefined` se conserva;
 * `unidad: null` quita la unidad. Una edición sin campos se rechaza (400).
 */
export async function modificar(id, { meta, unidad, fechaObjetivo }, usuario) {
  const accion = 'modificar objetivo';
  return auditarRechazo(accion, `Modificación rechazada del objetivo #${id}`, usuario, async () => {
    const objetivo = await obtenerGestionable(id, usuario);

    if (meta === undefined && unidad === undefined && fechaObjetivo === undefined) {
      throw new ErrorServicio(
        'Envía al menos un campo para modificar: meta, unidad o fecha_objetivo',
        400
      );
    }
    if (objetivo.estado !== 'activo') {
      throw new ErrorServicio(MENSAJE_NO_ACTIVO, 400);
    }

    const actualizado = await modelo.actualizar(id, {
      meta: meta === undefined ? objetivo.meta : meta,
      unidad: unidad === undefined ? objetivo.unidad : unidad,
      fechaObjetivo: fechaObjetivo === undefined ? objetivo.fecha_objetivo : fechaObjetivo,
    });
    if (!actualizado) {
      throw new ErrorServicio(MENSAJE_NO_ACTIVO, 400);
    }

    await registrar(accion, 'exitoso', `Objetivo #${id} modificado`, usuario);
    return modelo.obtenerPorId(id);
  });
}

/** Marca un objetivo activo como `alcanzado` o `cerrado` (transición terminal). */
export async function cambiarEstado(id, estado, usuario) {
  const accion = 'cambiar estado objetivo';
  return auditarRechazo(accion, `Cambio de estado rechazado del objetivo #${id}`, usuario, async () => {
    const objetivo = await obtenerGestionable(id, usuario);

    if (estado !== 'alcanzado' && estado !== 'cerrado') {
      throw new ErrorServicio("El estado debe ser 'alcanzado' o 'cerrado'", 400);
    }
    if (objetivo.estado !== 'activo' || !(await modelo.cambiarEstado(id, estado))) {
      throw new ErrorServicio(MENSAJE_NO_ACTIVO, 400);
    }

    await registrar(accion, 'exitoso', `Objetivo #${id} ahora '${estado}'`, usuario);
    return modelo.obtenerPorId(id);
  });
}
