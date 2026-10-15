// services/usuario.service.js
// Lógica de negocio de la gestión de usuarios: creación con contraseña
// hasheada, unicidad de correo y consultas. Exclusiva del administrador.
// ES Modules.

import bcrypt from 'bcrypt';
import * as modelo from '../models/usuario.model.js';
import * as modeloCliente from '../models/cliente.model.js';
import * as auditoria from './auditoria.service.js';
import { obtenerPool } from '../config/db.js';
import { ErrorServicio } from '../utils/errorServicio.js';

const RONDAS_HASH = 10;

/**
 * Ejecuta la operación y registra la acción en `auditoria` (A11, FR-021,
 * constitución X.1): `exitoso` al completarse, `rechazado` ante un
 * ErrorServicio de negocio y `error` ante un fallo inesperado. La descripción
 * NUNCA incluye contraseñas ni hashes (regla X.3). `registrarAccion` nunca
 * lanza: un fallo al auditar no interrumpe la operación principal.
 */
async function conAuditoria({ idUsuario = null, accion, descripcion, operacion }) {
  try {
    const datos = await operacion();
    await auditoria.registrarAccion({
      idUsuario,
      accion,
      modulo: 'usuarios',
      resultado: 'exitoso',
      descripcion,
    });
    return datos;
  } catch (error) {
    const resultado = error instanceof ErrorServicio ? 'rechazado' : 'error';
    const detalle = `${descripcion} — ${resultado}: ${error.message}`.slice(0, 255);
    await auditoria.registrarAccion({
      idUsuario,
      accion,
      modulo: 'usuarios',
      resultado,
      descripcion: detalle,
    });
    throw error;
  }
}

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

/** Registra un usuario con contraseña protegida con bcrypt (audita creación,
 *  rechazo de correo duplicado y fallos; jamás describe la contraseña). */
export async function crear(
  { nombre, correo, password, rol, estado = 'activo' },
  idUsuario = null
) {
  return conAuditoria({
    idUsuario,
    accion: 'crear_usuario',
    descripcion: `Usuario "${correo}" creado con rol ${rol}`,
    operacion: async () => {
      if (await modelo.correoExiste(correo)) {
        throw new ErrorServicio('El correo ya está registrado', 409);
      }

      // A15 / FR-023: una cuenta con rol `cliente` exige una ficha de
      // `clientes` con el mismo correo (el validador lo normaliza; la collation
      // `utf8mb4_unicode_ci` lo hace insensible a mayúsculas). Un cliente sin
      // correo no puede recibir cuenta y, si el correo ya tiene otra cuenta,
      // el 409 de unicidad (FR-015) responde antes.
      if (rol === 'cliente' && !(await modeloCliente.obtenerPorCorreo(correo))) {
        throw new ErrorServicio(
          'el correo no coincide con ningún cliente registrado',
          400
        );
      }

      const hash = await bcrypt.hash(password, RONDAS_HASH);
      const id = await modelo.crear({ nombre, correo, password: hash, rol, estado });

      return modelo.obtenerPorId(id);
    },
  });
}

/** Actualiza los campos permitidos de un usuario (la descripción de auditoría
 *  lista únicamente nombres de campo, jamás valores de contraseña). */
export async function modificar(id, campos, idUsuario = null) {
  const camposModificados = ['nombre', 'correo', 'password']
    .filter((c) => campos[c] !== undefined)
    .map((c) => (c === 'password' ? 'contraseña' : c));
  const detalle = camposModificados.join(', ') || 'ninguno';

  return conAuditoria({
    idUsuario,
    accion: 'modificar_usuario',
    descripcion: `Usuario #${id} modificado (campos: ${detalle})`,
    operacion: async () => {
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
      // `rol` y `estado` se modifican SOLO por cambiarRol/cambiarEstado, que es
      // el despacho del contrato (api.md) y quien aplica la protección del
      // último administrador activo (FR-014 / regla R4). Aquí se ignoran a
      // propósito: un cuerpo mixto (p. ej. `{ nombre, rol }`) no debe eludir
      // esa guarda.
      if (campos.password !== undefined) {
        aActualizar.password = await bcrypt.hash(campos.password, RONDAS_HASH);
      }

      await modelo.modificar(id, aActualizar);
      return modelo.obtenerPorId(id);
    },
  });
}

/**
 * Aplica un cambio de `rol` o `estado` dentro de una transacción con
 * `SELECT ... FOR UPDATE` que cuenta los administradores activos (FR-014,
 * SC-002, A10): si la operación dejaría el sistema sin administradores
 * activos, se revierte la transacción y se lanza 409 con el mensaje del
 * contrato. El bloqueo serializa verificaciones concurrentes.
 */
async function aplicarCambioBloqueado(id, campos) {
  const conexion = await obtenerPool().getConnection();
  try {
    await conexion.beginTransaction();

    const objetivo = await modelo.obtenerConBloqueo(id, conexion);
    if (!objetivo) {
      throw new ErrorServicio('Usuario no encontrado', 404);
    }

    const esAdminActivo =
      objetivo.rol === 'administrador' && objetivo.estado === 'activo';
    const dejaSinAdministradores =
      (campos.rol !== undefined && campos.rol !== 'administrador') ||
      (campos.estado !== undefined && campos.estado === 'inactivo');

    if (esAdminActivo && dejaSinAdministradores) {
      const total = await modelo.contarAdministradoresActivos(conexion);
      if (total <= 1) {
        throw new ErrorServicio(
          'no se puede modificar al único administrador activo',
          409
        );
      }
    }

    const aplicado = await modelo.modificar(id, campos, conexion);
    await conexion.commit();
    return aplicado;
  } catch (error) {
    await conexion.rollback().catch(() => {});
    throw error;
  } finally {
    conexion.release();
  }
}

/** Asigna un rol del catálogo a un usuario (FR-007). La degradación pasa por
 *  la transacción con la guarda del último administrador activo (FR-014). */
export async function cambiarRol(id, rol, idUsuario = null) {
  return conAuditoria({
    idUsuario,
    accion: 'cambiar_rol_usuario',
    descripcion: `Rol de usuario #${id} cambiado a ${rol}`,
    operacion: async () => {
      const existente = await modelo.obtenerPorId(id);
      if (!existente) {
        throw new ErrorServicio('Usuario no encontrado', 404);
      }
      if (rol !== 'administrador') {
        await aplicarCambioBloqueado(id, { rol });
      } else {
        await modelo.modificar(id, { rol });
      }
      return modelo.obtenerPorId(id);
    },
  });
}

/** Activa o desactiva una cuenta; la baja es lógica, sin eliminación (FR-008).
 *  La desactivación pasa por la transacción con la guarda del último
 *  administrador activo (FR-014). */
export async function cambiarEstado(id, estado, idUsuario = null) {
  return conAuditoria({
    idUsuario,
    accion: 'cambiar_estado_usuario',
    descripcion: `Estado de usuario #${id} cambiado a ${estado}`,
    operacion: async () => {
      const existente = await modelo.obtenerPorId(id);
      if (!existente) {
        throw new ErrorServicio('Usuario no encontrado', 404);
      }
      if (estado === 'inactivo') {
        await aplicarCambioBloqueado(id, { estado });
      } else {
        await modelo.modificar(id, { estado });
      }
      return modelo.obtenerPorId(id);
    },
  });
}
