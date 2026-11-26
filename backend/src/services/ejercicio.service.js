// services/ejercicio.service.js
// Lógica de negocio del catálogo de ejercicios (Sprint 3, US-S3-08).
// Reglas: escritura exclusiva del administrador (resuelta en las rutas,
// FR-011/Clarification Q2); nombre único con mensaje claro (data-model §3);
// el entrenador SIEMPRE recibe solo los ejercicios activos (FR-012);
// crear y modificar quedan en auditoría (FR-013). Sin borrado físico:
// la desactivación retira el ejercicio de rutinas nuevas pero lo conserva
// en las existentes (RN-008, SC-004). ES Modules.

import * as modelo from '../models/ejercicio.model.js';
import * as auditoria from './auditoria.service.js';
import { ErrorServicio } from '../utils/errorServicio.js';

/**
 * Lista el catálogo. El entrenador recibe solo `activo` sin importar el
 * filtro recibido (FR-012); el administrador puede pedir `activo`,
 * `inactivo` o `todos` (por defecto `activo`).
 */
export async function listar({ estado = 'activo', usuario }) {
  if (usuario.rol === 'entrenador') {
    return modelo.listar('activo');
  }
  const filtro = ['activo', 'inactivo', 'todos'].includes(estado) ? estado : 'activo';
  return modelo.listar(filtro);
}

/** Crea un ejercicio del catálogo (FR-011); nombre único (data-model §3). */
export async function crear({ nombre, descripcion, grupoMuscular = null }, idUsuarioAccion = null) {
  if (await modelo.nombreExiste(nombre)) {
    await auditoria.registrarAccion({
      idUsuario: idUsuarioAccion,
      accion: 'crear_ejercicio',
      modulo: 'ejercicios',
      resultado: 'rechazado',
      descripcion: `Alta rechazada: ya existe un ejercicio llamado '${nombre}'`,
    });
    throw new ErrorServicio('Ya existe un ejercicio con ese nombre', 400);
  }

  const id = await modelo.crear({ nombre, descripcion, grupoMuscular });

  await auditoria.registrarAccion({
    idUsuario: idUsuarioAccion,
    accion: 'crear_ejercicio',
    modulo: 'ejercicios',
    resultado: 'exitoso',
    descripcion: `Ejercicio #${id} '${nombre}' creado`,
  });

  return modelo.obtenerPorId(id);
}

/** Modifica nombre, descripción y/o grupo muscular (FR-011), conservando los
 *  campos no enviados. Auditoría obligatoria (FR-013). */
export async function modificar(id, { nombre = null, descripcion = null, grupoMuscular = null }, idUsuarioAccion = null) {
  const ejercicio = await modelo.obtenerPorId(id);
  if (!ejercicio) {
    throw new ErrorServicio('Ejercicio no encontrado', 404);
  }

  const nombreFinal = nombre ?? ejercicio.nombre;
  const descripcionFinal = descripcion ?? ejercicio.descripcion;
  const grupoFinal = grupoMuscular !== undefined ? grupoMuscular : ejercicio.grupo_muscular;

  if (await modelo.nombreExiste(nombreFinal, id)) {
    await auditoria.registrarAccion({
      idUsuario: idUsuarioAccion,
      accion: 'modificar_ejercicio',
      modulo: 'ejercicios',
      resultado: 'rechazado',
      descripcion: `Modificación rechazada del ejercicio #${id}: ya existe un ejercicio llamado '${nombreFinal}'`,
    });
    throw new ErrorServicio('Ya existe un ejercicio con ese nombre', 400);
  }

  await modelo.actualizar(id, {
    nombre: nombreFinal,
    descripcion: descripcionFinal,
    grupoMuscular: grupoFinal,
  });

  await auditoria.registrarAccion({
    idUsuario: idUsuarioAccion,
    accion: 'modificar_ejercicio',
    modulo: 'ejercicios',
    resultado: 'exitoso',
    descripcion: `Ejercicio #${id} '${nombreFinal}' modificado`,
  });

  return modelo.obtenerPorId(id);
}

/**
 * Activa o desactiva un ejercicio (FR-011) SIN borrarlo: el inactivo no puede
 * agregarse a rutinas nuevas (RN-008) pero se conserva en las existentes
 * (SC-004).
 */
export async function cambiarEstado(id, estado, idUsuarioAccion = null) {
  const ejercicio = await modelo.obtenerPorId(id);
  if (!ejercicio) {
    throw new ErrorServicio('Ejercicio no encontrado', 404);
  }

  await modelo.cambiarEstado(id, estado);

  await auditoria.registrarAccion({
    idUsuario: idUsuarioAccion,
    accion: 'cambiar_estado_ejercicio',
    modulo: 'ejercicios',
    resultado: 'exitoso',
    descripcion: `Ejercicio #${id} '${ejercicio.nombre}' ahora '${estado}'`,
  });

  return modelo.obtenerPorId(id);
}
