// services/tipoMembresia.service.js
// Lógica de negocio de los tipos de membresía (FR-001): nombre, duración > 0
// y precio > 0. Solo el administrador crea o modifica; el recepcionista
// consulta. Todas las acciones quedan registradas en auditoría (FR-021).
// ES Modules.

import * as modelo from '../models/tipoMembresia.model.js';
import * as auditoria from './auditoria.service.js';
import { ErrorServicio } from '../utils/errorServicio.js';

/** Lista todos los tipos de membresía. */
export async function listar() {
  return modelo.listar();
}

/** Devuelve un tipo por identificador o lanza 404. */
export async function obtener(id) {
  const tipo = await modelo.obtenerPorId(id);
  if (!tipo) {
    throw new ErrorServicio('Tipo de membresía no encontrado', 404);
  }
  return tipo;
}

/** Crea un tipo con duración y precio positivos (FR-001). */
export async function crear({ nombre, descripcion, duracion, precio, estado = 'activo' }, idUsuario = null) {
  const nombreLimpio = (nombre || '').trim();
  if (!nombreLimpio) {
    throw new ErrorServicio('El nombre es obligatorio', 400);
  }
  if (!(Number(duracion) > 0)) {
    throw new ErrorServicio('La duración debe ser un número positivo', 400);
  }
  if (!(Number(precio) > 0)) {
    throw new ErrorServicio('El precio debe ser un número positivo', 400);
  }

  const id = await modelo.crear({
    nombre: nombreLimpio,
    descripcion: descripcion || null,
    duracion: Number(duracion),
    precio: Number(precio),
    estado,
  });

  await auditoria.registrarAccion({
    idUsuario,
    accion: 'crear_tipo_membresia',
    modulo: 'tipos_membresia',
    resultado: 'exitoso',
    descripcion: `Tipo de membresía "${nombreLimpio}" creado`,
  });

  return modelo.obtenerPorId(id);
}

/** Modifica los campos indicados de un tipo de membresía. */
export async function actualizar(id, campos, idUsuario = null) {
  const tipo = await obtener(id);

  // Reglas de negocio solo si vienen los campos.
  if (campos.duracion !== undefined && !(Number(campos.duracion) > 0)) {
    throw new ErrorServicio('La duración debe ser un número positivo', 400);
  }
  if (campos.precio !== undefined && !(Number(campos.precio) > 0)) {
    throw new ErrorServicio('El precio debe ser un número positivo', 400);
  }
  if (campos.nombre !== undefined && !String(campos.nombre).trim()) {
    throw new ErrorServicio('El nombre no puede estar vacío', 400);
  }

  const limpio = { ...campos };
  if (limpio.nombre !== undefined) limpio.nombre = String(limpio.nombre).trim();
  if (limpio.duracion !== undefined) limpio.duracion = Number(limpio.duracion);
  if (limpio.precio !== undefined) limpio.precio = Number(limpio.precio);

  const modificados = await modelo.actualizar(id, limpio);
  if (!modificados) {
    // Sin cambios reales: se devuelve el tipo tal cual.
    return tipo;
  }

  await auditoria.registrarAccion({
    idUsuario,
    accion: 'modificar_tipo_membresia',
    modulo: 'tipos_membresia',
    resultado: 'exitoso',
    descripcion: `Tipo de membresía #${id} modificado`,
  });

  return modelo.obtenerPorId(id);
}
