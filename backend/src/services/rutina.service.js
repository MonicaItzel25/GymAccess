// services/rutina.service.js
// Lógica de negocio de las rutinas de entrenamiento (Sprint 3, US-S3-03).
// Reglas: recurso exclusivo del entrenador (rutas); el entrenador autenticado
// debe tener asignación VIGENTE con el cliente para consultar, crear o
// modificar, incluso cuando la rutina la creó otro entrenador (FR-014, FR-017,
// RN-005, Clarification Q1); perfil de entrenador activo (FR-003); ejercicios
// `inactivo` no entran en rutinas nuevas (RN-008); una única rutina activa por
// cliente en transacción con bloqueo (Q5, research R-03); historial = filas
// distintas conservadas sin borrado físico (FR-015, R-04); crear, modificar y
// cambiar estado en auditoría (FR-018). ES Modules.

import * as modelo from '../models/rutina.model.js';
import * as ejercicioModelo from '../models/ejercicio.model.js';
import * as entrenadorModelo from '../models/entrenador.model.js';
import * as auditoria from './auditoria.service.js';
import { ErrorServicio } from '../utils/errorServicio.js';

/** Resuelve el perfil de entrenador activo del usuario (FR-003) o lanza 403. */
async function perfilActivo(usuario) {
  const perfil = await entrenadorModelo.obtenerPorIdUsuario(usuario.id_usuario);
  if (!perfil) {
    throw new ErrorServicio('No tienes un perfil de entrenador activo', 403);
  }
  if (perfil.estado !== 'activo') {
    throw new ErrorServicio('El entrenador está inactivo; no puede gestionar rutinas', 403);
  }
  return perfil;
}

/** Exige asignación vigente del perfil con el cliente (FR-014, RN-005, Q1). */
async function exigirAsignacionVigente(perfil, idCliente) {
  const vigente = await modelo.existeAsignacionVigente(perfil.id_entrenador, idCliente);
  if (!vigente) {
    throw new ErrorServicio('No tienes una asignación vigente con este cliente', 403);
  }
}

/** Registra un rechazo de negocio en auditoría (contrato §1/§2). */
async function registrarRechazo(accion, descripcion, idUsuarioAccion) {
  await auditoria.registrarAccion({
    idUsuario: idUsuarioAccion,
    accion,
    modulo: 'rutinas',
    resultado: 'rechazado',
    descripcion,
  });
}

/**
 * Valida las filas de ejercicios contra el catálogo: cada id existe (404) y
 * está `activo` (400, RN-008). Devuelve las filas normalizadas con el orden
 * recibido o, si no viene, la posición (research R-10).
 */
async function validarEjercicios(ejercicios) {
  const filas = [];
  let posicion = 0;
  for (const fila of ejercicios) {
    const ejercicio = await ejercicioModelo.obtenerPorId(fila.id_ejercicio);
    if (!ejercicio) {
      throw new ErrorServicio(`Ejercicio no encontrado: #${fila.id_ejercicio}`, 404);
    }
    if (ejercicio.estado !== 'activo') {
      throw new ErrorServicio('El ejercicio está desactivado y no puede agregarse a rutinas nuevas', 400);
    }
    posicion += 1;
    filas.push({
      id_ejercicio: Number(fila.id_ejercicio),
      orden: fila.orden ? Number(fila.orden) : posicion,
      series: Number(fila.series),
      repeticiones: Number(fila.repeticiones),
      peso_recomendado: fila.peso_recomendado ?? null,
      descanso_segundos: fila.descanso_segundos ?? null,
      instrucciones: fila.instrucciones?.trim() || null,
    });
  }
  return filas;
}

/** Lista las rutinas de los clientes con asignación vigente del entrenador. */
export async function listar({ idCliente = null, usuario }) {
  const perfil = await perfilActivo(usuario);
  return modelo.listar({ idEntrenador: perfil.id_entrenador, idCliente });
}

/** Detalle de una rutina; exige asignación vigente con su cliente (403). */
export async function obtenerPorId(id, usuario) {
  const rutina = await modelo.obtenerPorId(id);
  if (!rutina) {
    throw new ErrorServicio('Rutina no encontrada', 404);
  }
  const perfil = await perfilActivo(usuario);
  await exigirAsignacionVigente(perfil, rutina.id_cliente);
  return rutina;
}

/** Crea una rutina con sus ejercicios (FR-014, FR-016); auditoría (FR-018). */
export async function crear({ idCliente, nombre, ejercicios, usuario }, idUsuarioAccion = null) {
  const perfil = await perfilActivo(usuario);
  try {
    await exigirAsignacionVigente(perfil, idCliente);
  } catch (error) {
    await registrarRechazo('crear_rutina', `Alta rechazada para cliente #${idCliente}: ${error.message}`, idUsuarioAccion);
    throw error;
  }

  let filas;
  try {
    filas = await validarEjercicios(ejercicios);
  } catch (error) {
    await registrarRechazo('crear_rutina', `Alta rechazada para cliente #${idCliente}: ${error.message}`, idUsuarioAccion);
    throw error;
  }

  const conexion = await modelo.iniciarTransaccion();
  try {
    const id = await modelo.crear({ idCliente, idEntrenador: perfil.id_entrenador, nombre }, conexion);
    await modelo.reemplazarEjercicios(id, filas, conexion);
    await modelo.confirmarTransaccion(conexion);

    await auditoria.registrarAccion({
      idUsuario: idUsuarioAccion,
      accion: 'crear_rutina',
      modulo: 'rutinas',
      resultado: 'exitoso',
      descripcion: `Rutina #${id} '${nombre}' creada para cliente #${idCliente} (${filas.length} ejercicio(s))`,
    });

    return modelo.obtenerPorId(id);
  } catch (error) {
    await modelo.revertirTransaccion(conexion).catch(() => {});
    throw error;
  }
}

/**
 * Modifica nombre y/o lista de ejercicios (FR-017). Los cambios quedan en la
 * misma fila con `fecha_actualizacion` y el rastro en auditoría (R-04, FR-018);
 * el historial de versiones no se toca.
 */
export async function modificar(id, { nombre = null, ejercicios = null }, usuario, idUsuarioAccion = null) {
  const rutina = await modelo.obtenerPorId(id);
  if (!rutina) {
    throw new ErrorServicio('Rutina no encontrada', 404);
  }
  const perfil = await perfilActivo(usuario);
  try {
    await exigirAsignacionVigente(perfil, rutina.id_cliente);
  } catch (error) {
    await registrarRechazo('modificar_rutina', `Modificación rechazada de rutina #${id}: ${error.message}`, idUsuarioAccion);
    throw error;
  }

  const nombreFinal = nombre ?? rutina.nombre;
  let filas = null;
  if (ejercicios !== null) {
    try {
      filas = await validarEjercicios(ejercicios);
    } catch (error) {
      await registrarRechazo('modificar_rutina', `Modificación rechazada de rutina #${id}: ${error.message}`, idUsuarioAccion);
      throw error;
    }
  }

  const conexion = await modelo.iniciarTransaccion();
  try {
    await modelo.actualizar(id, { nombre: nombreFinal }, conexion);
    if (filas) {
      await modelo.reemplazarEjercicios(id, filas, conexion);
    }
    await modelo.confirmarTransaccion(conexion);

    await auditoria.registrarAccion({
      idUsuario: idUsuarioAccion,
      accion: 'modificar_rutina',
      modulo: 'rutinas',
      resultado: 'exitoso',
      descripcion: `Rutina #${id} '${nombreFinal}' modificada${filas ? ` (${filas.length} ejercicio(s))` : ''}`,
    });

    return modelo.obtenerPorId(id);
  } catch (error) {
    await modelo.revertirTransaccion(conexion).catch(() => {});
    throw error;
  }
}

/**
 * Activa o desactiva la rutina (FR-015, Q5). Al activar, la rutina activa
 * anterior del cliente pasa a `inactiva` en la misma transacción, con bloqueo
 * FOR UPDATE y el UNIQUE (id_cliente, esta_activa) como refuerzo (R-03).
 */
export async function cambiarEstado(id, estado, usuario, idUsuarioAccion = null) {
  const rutina = await modelo.obtenerPorId(id);
  if (!rutina) {
    throw new ErrorServicio('Rutina no encontrada', 404);
  }
  const perfil = await perfilActivo(usuario);
  try {
    await exigirAsignacionVigente(perfil, rutina.id_cliente);
  } catch (error) {
    await registrarRechazo('cambiar_estado_rutina', `Cambio de estado rechazado de rutina #${id}: ${error.message}`, idUsuarioAccion);
    throw error;
  }

  const rechazarDuplicada = async () => {
    await registrarRechazo('cambiar_estado_rutina', `Cambio rechazado de rutina #${id}: el cliente ya tiene una rutina activa`, idUsuarioAccion);
    throw new ErrorServicio('El cliente ya tiene una rutina activa', 400);
  };

  if (estado === 'activa') {
    const conexion = await modelo.iniciarTransaccion();
    try {
      const activa = await modelo.bloquearActivaPorCliente(rutina.id_cliente, conexion);
      if (activa && activa.id_rutina !== id) {
        await modelo.cambiarEstado(activa.id_rutina, 'inactiva', conexion);
      }
      await modelo.cambiarEstado(id, 'activa', conexion);
      await modelo.confirmarTransaccion(conexion);
    } catch (error) {
      await modelo.revertirTransaccion(conexion).catch(() => {});
      // Refuerzo del UNIQUE (id_cliente, esta_activa) ante activaciones concurrentes.
      if (error.code === 'ER_DUP_ENTRY') {
        await rechazarDuplicada();
      }
      throw error;
    }
  } else {
    await modelo.cambiarEstado(id, 'inactiva');
  }

  await auditoria.registrarAccion({
    idUsuario: idUsuarioAccion,
    accion: 'cambiar_estado_rutina',
    modulo: 'rutinas',
    resultado: 'exitoso',
    descripcion: `Rutina #${id} '${rutina.nombre}' ahora '${estado}'`,
  });

  return modelo.obtenerPorId(id);
}
