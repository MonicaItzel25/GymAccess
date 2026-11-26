// services/entrenador.service.js
// Lógica de negocio del perfil de entrenador (Sprint 3, US-S3-01).
// Reglas: la cuenta debe existir, tener rol `entrenador`, estar activa y no
// tener ya un perfil (FR-001, RN-002, data-model §1). Registrar, modificar y
// cambiar estado quedan registrados en auditoría (FR-004) con el detalle de la
// entidad en `descripcion` (contrato §9). ES Modules.

import * as modelo from '../models/entrenador.model.js';
import * as cuentaModelo from '../models/usuario.model.js';
import * as auditoria from './auditoria.service.js';
import { ErrorServicio } from '../utils/errorServicio.js';

/** Lista los perfiles de entrenador. */
export async function listar() {
  return modelo.listar();
}

/** Devuelve un perfil por identificador o lanza 404. */
export async function obtener(id) {
  const perfil = await modelo.obtenerPorId(id);
  if (!perfil) {
    throw new ErrorServicio('Entrenador no encontrado', 404);
  }
  return perfil;
}

/**
 * Crea el perfil vinculado a una cuenta existente con rol `entrenador`
 * (FR-001). Cada rechazo queda registrado en auditoría con resultado
 * `rechazado` (contrato §1).
 */
export async function crearPerfil({ idUsuario, especialidad = null, telefono = null }, idUsuarioAccion = null) {
  const rechazar = async (mensaje, statusCode) => {
    await auditoria.registrarAccion({
      idUsuario: idUsuarioAccion,
      accion: 'crear_entrenador',
      modulo: 'entrenadores',
      resultado: 'rechazado',
      descripcion: `Alta rechazada para la cuenta #${idUsuario}: ${mensaje}`,
    });
    throw new ErrorServicio(mensaje, statusCode);
  };

  // 1. La cuenta debe existir (RN-002).
  const cuenta = await cuentaModelo.obtenerPorId(idUsuario);
  if (!cuenta) {
    await rechazar('Cuenta de usuario no encontrada', 404);
  }

  // 2. La cuenta debe tener el rol entrenador (FR-001, US-S3-01.2).
  if (cuenta.rol !== 'entrenador') {
    await rechazar('La cuenta debe tener el rol entrenador', 400);
  }

  // 3. La cuenta debe estar activa (data-model §1).
  if (cuenta.estado !== 'activo') {
    await rechazar('La cuenta está inactiva', 400);
  }

  // 4. Un perfil por cuenta (UNIQUE, RN-002).
  const previo = await modelo.obtenerPorIdUsuario(idUsuario);
  if (previo) {
    await rechazar('La cuenta ya tiene un perfil de entrenador', 400);
  }

  const id = await modelo.crear({ idUsuario, especialidad, telefono });

  await auditoria.registrarAccion({
    idUsuario: idUsuarioAccion,
    accion: 'crear_entrenador',
    modulo: 'entrenadores',
    resultado: 'exitoso',
    descripcion: `Perfil de entrenador #${id} creado para la cuenta #${idUsuario}`,
  });

  return modelo.obtenerPorId(id);
}

/** Modifica `especialidad` y `telefono` del perfil (FR-002). */
export async function modificarPerfil(id, { especialidad = null, telefono = null }, idUsuarioAccion = null) {
  const perfil = await obtener(id);
  await modelo.actualizar(id, { especialidad, telefono });

  await auditoria.registrarAccion({
    idUsuario: idUsuarioAccion,
    accion: 'modificar_entrenador',
    modulo: 'entrenadores',
    resultado: 'exitoso',
    descripcion: `Perfil de entrenador #${perfil.id_entrenador} modificado`,
  });

  return modelo.obtenerPorId(id);
}

/**
 * Cambia el estado del perfil (FR-002). Con `inactivo` el entrenador no recibe
 * nuevas asignaciones ni escribe en módulos de entrenamiento (FR-003).
 */
export async function cambiarEstadoPerfil(id, estado, idUsuarioAccion = null) {
  const perfil = await obtener(id);
  await modelo.cambiarEstado(id, estado);

  await auditoria.registrarAccion({
    idUsuario: idUsuarioAccion,
    accion: 'cambiar_estado_entrenador',
    modulo: 'entrenadores',
    resultado: 'exitoso',
    descripcion: `Perfil de entrenador #${perfil.id_entrenador} ahora '${estado}'`,
  });

  return modelo.obtenerPorId(id);
}
