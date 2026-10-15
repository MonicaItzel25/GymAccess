// services/cliente.service.js
// Lógica de negocio de los clientes: registro, consulta y modificación con
// las reglas de validación del data-model.md. ES Modules.

import * as modelo from '../models/cliente.model.js';
import * as auditoria from './auditoria.service.js';
import { ErrorServicio } from '../utils/errorServicio.js';

/**
 * Ejecuta la operación y registra la acción en `auditoria` (A11, FR-021,
 * constitución X.1): `exitoso`, `rechazado` (ErrorServicio) o `error`
 * (fallo inesperado). La descripción NUNCA incluye credenciales (X.3).
 * `registrarAccion` nunca lanza: un fallo al auditar no interrumpe la
 * operación principal. (Misma pauta que usuario.service.js.)
 */
async function conAuditoria({ idUsuario = null, accion, descripcion, operacion }) {
  try {
    const datos = await operacion();
    await auditoria.registrarAccion({
      idUsuario,
      accion,
      modulo: 'clientes',
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
      modulo: 'clientes',
      resultado,
      descripcion: detalle,
    });
    throw error;
  }
}

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

/** Registra un cliente; el correo no puede duplicarse (FR-014).
 *  Audita creación, rechazos y fallos con el actor indicado (A11). */
export async function crear(
  { nombre, apellido, correo, telefono, direccion, estado = 'activo' },
  idUsuario = null
) {
  return conAuditoria({
    idUsuario,
    accion: 'crear_cliente',
    descripcion: `Cliente "${nombre} ${apellido}" creado`,
    operacion: async () => {
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
    },
  });
}

/** Indica si un correo ya pertenece a otro cliente (unicidad, FR-014). */
export async function existeCorreoDeOtroCliente(correo, idCliente) {
  return modelo.correoExisteEnOtro(correo, idCliente);
}

/** Actualiza un cliente; valida unicidad de correo y existencia (FR-010).
 *  Audita la modificación con el actor indicado (A11). */
export async function actualizar(id, campos, idUsuario = null) {
  const camposModificados = Object.keys(campos).filter((c) =>
    ['nombre', 'apellido', 'correo', 'telefono', 'direccion', 'estado'].includes(c)
  );
  const detalle = camposModificados.join(', ') || 'ninguno';

  return conAuditoria({
    idUsuario,
    accion: 'modificar_cliente',
    descripcion: `Cliente #${id} modificado (campos: ${detalle})`,
    operacion: async () => {
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
    },
  });
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
