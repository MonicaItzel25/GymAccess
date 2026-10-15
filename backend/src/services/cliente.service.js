// services/cliente.service.js
// Lógica de negocio de los clientes: registro, consulta y modificación con
// las reglas de validación del data-model.md. ES Modules.

import * as modelo from '../models/cliente.model.js';
import { ErrorServicio } from '../utils/errorServicio.js';

/** Lista los clientes; si `basicos` es true devuelve solo campos básicos. */
export async function listar({ buscar = '', basicos = false } = {}) {
  if (basicos) return modelo.listarBasicos();
  return modelo.listar(buscar);
}

/** Devuelve un cliente por identificador o lanza 404.
 *  Con `basico: true` solo devuelve los campos del rol entrenador (FR-011). */
export async function obtener(id, { basico = false } = {}) {
  const cliente = await modelo.obtenerPorId(id);
  if (!cliente) {
    throw new ErrorServicio('Cliente no encontrado', 404);
  }
  if (basico) {
    const { id_cliente, nombre, apellido, telefono, estado } = cliente;
    return { id_cliente, nombre, apellido, telefono, estado };
  }
  return cliente;
}

/** Registra un cliente; el correo no puede duplicarse (FR-014). */
export async function crear({ nombre, apellido, correo, telefono, direccion, estado = 'activo' }) {
  const correoLimpio = correo ? correo.trim() : null;
  if (correoLimpio && (await modelo.correoExisteEnOtro(correoLimpio))) {
    throw new ErrorServicio('El correo ya está registrado', 409);
  }

  const id = await modelo.crear({
    nombre,
    apellido,
    correo: correoLimpio || null,
    telefono: telefono || null,
    direccion: direccion || null,
    estado,
  });

  return modelo.obtenerPorId(id);
}

/** Indica si un correo ya pertenece a otro cliente (unicidad, FR-014). */
export async function existeCorreoDeOtroCliente(correo, idCliente) {
  return modelo.correoExisteEnOtro(correo, idCliente);
}

/** Actualiza un cliente; valida unicidad de correo y existencia (FR-010). */
export async function actualizar(id, campos) {
  await obtener(id); // 404 si no existe

  if (campos.correo) {
    const correoLimpio = campos.correo.trim();
    if (await existeCorreoDeOtroCliente(correoLimpio, id)) {
      throw new ErrorServicio('El correo ya está registrado', 409);
    }
    campos = { ...campos, correo: correoLimpio };
  }

  await modelo.actualizar(id, campos);
  return modelo.obtenerPorId(id);
}

/** Devuelve la información propia de un cliente a partir de su correo.
 *  Relación usuario↔cliente por coincidencia de correo (data-model.md). */
export async function obtenerPorCorreoUsuario(correoUsuario) {
  const cliente = await modelo.obtenerPorCorreo(correoUsuario);
  if (!cliente) {
    throw new ErrorServicio('No existe un cliente asociado a esta cuenta', 404);
  }
  return cliente;
}
