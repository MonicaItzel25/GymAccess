// services/usuario.service.js
// Lógica de negocio de la gestión de usuarios: creación con contraseña
// hasheada, unicidad de correo y consultas. Exclusiva del administrador.
// ES Modules.

import bcrypt from 'bcrypt';
import * as modelo from '../models/usuario.model.js';
import { ErrorServicio } from '../utils/errorServicio.js';

const RONDAS_HASH = 10;

/** Devuelve todos los usuarios. */
export async function listar() {
  return modelo.listar();
}

/** Devuelve un usuario por identificador o lanza 404. */
export async function obtener(id) {
  const usuario = await modelo.obtenerPorId(id);
  if (!usuario) {
    throw new ErrorServicio('Usuario no encontrado', 404);
  }
  return usuario;
}

/** Registra un usuario con contraseña protegida con bcrypt. */
export async function crear({ nombre, correo, password, rol, estado = 'activo' }) {
  if (await modelo.correoExiste(correo)) {
    throw new ErrorServicio('El correo ya está registrado', 409);
  }

  const hash = await bcrypt.hash(password, RONDAS_HASH);
  const id = await modelo.crear({ nombre, correo, password: hash, rol, estado });

  return modelo.obtenerPorId(id);
}

/** Actualiza los campos permitidos de un usuario. */
export async function modificar(id, campos) {
  const existente = await modelo.obtenerPorId(id);
  if (!existente) {
    throw new ErrorServicio('Usuario no encontrado', 404);
  }

  if (campos.correo && (await modelo.correoExisteEnOtro(campos.correo, id))) {
    throw new ErrorServicio('El correo ya está registrado', 409);
  }

  const aActualizar = {};
  if (campos.nombre !== undefined) aActualizar.nombre = campos.nombre;
  if (campos.correo !== undefined) aActualizar.correo = campos.correo;
  if (campos.rol !== undefined) aActualizar.rol = campos.rol;
  if (campos.estado !== undefined) aActualizar.estado = campos.estado;
  if (campos.password !== undefined) {
    aActualizar.password = await bcrypt.hash(campos.password, RONDAS_HASH);
  }

  await modelo.modificar(id, aActualizar);
  return modelo.obtenerPorId(id);
}

/** Asigna un rol del catálogo a un usuario (FR-007). */
export async function cambiarRol(id, rol) {
  const existente = await modelo.obtenerPorId(id);
  if (!existente) {
    throw new ErrorServicio('Usuario no encontrado', 404);
  }
  await modelo.modificar(id, { rol });
  return modelo.obtenerPorId(id);
}

/** Activa o desactiva una cuenta; la baja es lógica, sin eliminación (FR-008). */
export async function cambiarEstado(id, estado) {
  const existente = await modelo.obtenerPorId(id);
  if (!existente) {
    throw new ErrorServicio('Usuario no encontrado', 404);
  }
  await modelo.modificar(id, { estado });
  return modelo.obtenerPorId(id);
}
