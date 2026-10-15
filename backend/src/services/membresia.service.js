// services/membresia.service.js
// Lógica de negocio de las membresías: asignación, consulta y estado vigente.
// Reglas clave: cliente y tipo deben existir y estar activos (FR-004); la
// fecha_fin se calcula con la duración del tipo (FR-003); solo una membresía
// vigente por cliente dentro de una transacción (FR-025). ES Modules.

import * as modelo from '../models/membresia.model.js';
import * as tipoModelo from '../models/tipoMembresia.model.js';
import * as clienteModelo from '../models/cliente.model.js';
import * as auditoria from './auditoria.service.js';
import { ErrorServicio } from '../utils/errorServicio.js';

/** Suma los días de la duración a una fecha ISO y devuelve 'YYYY-MM-DD'. */
function sumarDias(fechaIso, dias) {
  const fecha = new Date(`${fechaIso}T00:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

/** Fecha actual en formato 'YYYY-MM-DD'. */
function fechaHoy() {
  return new Date().toISOString().slice(0, 10);
}

/** Lista membresías; filtro opcional por cliente (devuelve adeudo calculado). */
export async function listar({ idCliente = null } = {}) {
  const membresias = await modelo.listar(idCliente);
  return Promise.all(membresias.map(computarAdeudo));
};

/** Calcula el adeudo (precio del tipo − suma de pagos) de una membresía. */
async function computarAdeudo(membresia) {
  const totalPagado = await import('../models/pago.model.js').then((m) =>
    m.sumarPagosPorMembresia(membresia.id_membresia)
  );
  const precio = Number(membresia.precio);
  const adeudo = Math.max(0, precio - Number(totalPagado));
  return { ...membresia, adeudo };
}

/** Devuelve una membresía por identificador o lanza 404. */
export async function obtener(id) {
  const membresia = await modelo.obtenerPorId(id);
  if (!membresia) {
    throw new ErrorServicio('Membresía no encontrada', 404);
  }
  return membresia;
}

/** Asigna una membresía a un cliente con todas las reglas (FR-003, FR-004, FR-025). */
export async function asignarMembresia({ idCliente, idTipoMembresia, fechaInicio = null, idUsuario = null }) {
  // 1. El cliente debe existir (FR-004)
  const cliente = await clienteModelo.obtenerPorId(idCliente);
  if (!cliente) {
    throw new ErrorServicio('Cliente no encontrado', 404);
  }

  // 2. El tipo de membresía debe existir y estar activo (FR-004)
  const tipo = await tipoModelo.obtenerPorId(idTipoMembresia);
  if (!tipo) {
    throw new ErrorServicio('Tipo de membresía no encontrado', 404);
  }
  if (tipo.estado !== 'activo') {
    throw new ErrorServicio('El tipo de membresía está inactivo', 409);
  }

  const fechaInicioFinal = fechaInicio || fechaHoy();
  const fechaFin = sumarDias(fechaInicioFinal, Number(tipo.duracion));

  // 3. Una sola membresía vigente por cliente, dentro de una transacción (FR-025)
  const conexion = await modelo.iniciarTransaccion();
  try {
    const vigente = await modelo.bloquearVigente(idCliente, conexion);
    if (vigente) {
      await modelo.cerrarVigente(vigente.id_membresia, conexion);
    }
    const id = await modelo.crear(
      {
        idCliente,
        idTipoMembresia,
        fechaInicio: fechaInicioFinal,
        fechaFin,
      },
      conexion
    );
    await modelo.confirmarTransaccion(conexion);

    await auditoria.registrarAccion({
      idUsuario,
      accion: 'asignar_membresia',
      modulo: 'membresias',
      resultado: 'exitoso',
      descripcion: `Membresía #${id} asignada al cliente #${idCliente}`,
    });

    return modelo.obtenerPorId(id);
  } catch (error) {
    await modelo.revertirTransaccion(conexion);
    throw error;
  }
}

/** Renueva una membresía: cierra la vigente y crea el nuevo periodo
 *  (FR-006, FR-025). Administrador y recepcionista. */
export async function renovarMembresia(id, { fechaInicio = null, idTipoMembresia = null } = {}, idUsuario = null) {
  const actual = await obtener(id);

  // El tipo para el nuevo periodo: el indicado o el de la membresía actual.
  const idTipo = idTipoMembresia || actual.id_tipo_membresia;
  const tipo = await tipoModelo.obtenerPorId(idTipo);
  if (!tipo) {
    throw new ErrorServicio('Tipo de membresía no encontrado', 404);
  }
  if (tipo.estado !== 'activo') {
    throw new ErrorServicio('El tipo de membresía está inactivo', 409);
  }

  // La renovación inicia al día siguiente del fin de la actual, salvo indicación.
  const fechaInicioFinal = fechaInicio || sumarDias(actual.fecha_fin, 1);
  const fechaFin = sumarDias(fechaInicioFinal, Number(tipo.duracion));

  const conexion = await modelo.iniciarTransaccion();
  try {
    // Cierra la membresía que se está renovando.
    await modelo.cambiarEstadoEnConexion(id, 'vencida', conexion);
    const idNueva = await modelo.crear(
      {
        idCliente: actual.id_cliente,
        idTipoMembresia: idTipo,
        fechaInicio: fechaInicioFinal,
        fechaFin,
      },
      conexion
    );
    await modelo.confirmarTransaccion(conexion);

    await auditoria.registrarAccion({
      idUsuario,
      accion: 'renovar_membresia',
      modulo: 'membresias',
      resultado: 'exitoso',
      descripcion: `Membresía #${id} renovada como #${idNueva}`,
    });

    return modelo.obtenerPorId(idNueva);
  } catch (error) {
    await modelo.revertirTransaccion(conexion);
    throw error;
  }
}

/** Suspende una membresía (solo administrador, FR-026). */
export async function suspenderMembresia(id, idUsuario = null) {
  const actual = await obtener(id);
  if (actual.estado !== 'activa') {
    throw new ErrorServicio('Solo se puede suspender una membresía activa', 400);
  }
  await modelo.cambiarEstado(id, 'suspendida');

  await auditoria.registrarAccion({
    idUsuario,
    accion: 'suspender_membresia',
    modulo: 'membresias',
    resultado: 'exitoso',
    descripcion: `Membresía #${id} suspendida`,
  });

  return modelo.obtenerPorId(id);
}

/** Reactiva una membresía suspendida (solo administrador, FR-026). */
export async function reactivarMembresia(id, idUsuario = null) {
  const actual = await obtener(id);
  if (actual.estado !== 'suspendida') {
    throw new ErrorServicio('Solo se puede reactivar una membresía suspendida', 400);
  }
  await modelo.cambiarEstado(id, 'activa');

  await auditoria.registrarAccion({
    idUsuario,
    accion: 'reactivar_membresia',
    modulo: 'membresias',
    resultado: 'exitoso',
    descripcion: `Membresía #${id} reactivada`,
  });

  return modelo.obtenerPorId(id);
}

/** Cancela una membresía (solo administrador, FR-026). */
export async function cancelarMembresia(id, idUsuario = null) {
  const actual = await obtener(id);
  if (actual.estado === 'cancelada') {
    throw new ErrorServicio('La membresía ya está cancelada', 400);
  }
  await modelo.cambiarEstado(id, 'cancelada');

  await auditoria.registrarAccion({
    idUsuario,
    accion: 'cancelar_membresia',
    modulo: 'membresias',
    resultado: 'exitoso',
    descripcion: `Membresía #${id} cancelada`,
  });

  return modelo.obtenerPorId(id);
}
