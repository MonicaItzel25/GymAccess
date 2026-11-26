// services/asignacion.service.js
// Lógica de negocio de las asignaciones entrenador–cliente (Sprint 3, US-S3-02).
// Reglas: cliente y entrenador deben existir y estar activos (FR-006); una
// única asignación vigente por cliente (FR-006, SC-003, reforzada por el
// UNIQUE de la migración 007); la finalización rellena `fecha_fin` y conserva
// el historial sin borrados (FR-007, FR-008). Alta y finalización quedan en
// auditoría (FR-009). El entrenador autenticado siempre recibe solo SUS
// asignaciones (contrato §2). ES Modules.

import * as modelo from '../models/asignacion.model.js';
import * as clienteModelo from '../models/cliente.model.js';
import * as entrenadorModelo from '../models/entrenador.model.js';
import * as auditoria from './auditoria.service.js';
import { ErrorServicio } from '../utils/errorServicio.js';
import { hoy } from '../utils/fechas.js';

/**
 * Lista asignaciones aplicando la semántica del contrato §2:
 *   - administrador/recepcionista: filtros opcionales `entrenador` y `vigentes=true`;
 *   - entrenador: SIEMPRE solo las suyas (ignora `entrenador` de terceros); sin
 *     parámetro `vigentes` recibe solo las vigentes y con `vigentes=false`
 *     también su histórico finalizado.
 */
export async function listar({ idEntrenador = null, vigentes = undefined, usuario }) {
  if (usuario.rol === 'entrenador') {
    const perfil = await entrenadorModelo.obtenerPorIdUsuario(usuario.id_usuario);
    // Sin perfil de entrenador no tiene asignados: respuesta vacía, no error.
    if (!perfil) return [];
    const soloVigentes = vigentes !== false;
    return modelo.listar({ idEntrenador: perfil.id_entrenador, soloVigentes });
  }
  return modelo.listar({ idEntrenador, soloVigentes: vigentes === true });
}

/**
 * Crea la asignación (FR-005). Valida la relación en servidor y ejecuta el
 * INSERT dentro de una transacción con bloqueo; el índice único
 * (id_cliente, esta_vigente) impide incluso ante concurrencia una segunda
 * vigente del mismo cliente (research R-03). Cada rechazo queda registrado en
 * auditoría con resultado `rechazado` (contrato §1/§2).
 */
export async function crear({ idCliente, idEntrenador, fechaInicio = null }, idUsuarioAccion = null) {
  // 1. El cliente debe existir (404) y estar activo (400).
  const cliente = await clienteModelo.obtenerPorId(idCliente);
  if (!cliente) {
    throw new ErrorServicio('Cliente no encontrado', 404);
  }
  if (cliente.estado !== 'activo') {
    throw new ErrorServicio('El cliente está inactivo; no puede recibir una asignación', 400);
  }

  // 2. El entrenador debe estar registrado (404) y activo (400; FR-003).
  const entrenador = await entrenadorModelo.obtenerPorId(idEntrenador);
  if (!entrenador) {
    throw new ErrorServicio('Entrenador no encontrado', 404);
  }
  if (entrenador.estado !== 'activo') {
    throw new ErrorServicio('El entrenador está inactivo; no puede recibir nuevas asignaciones', 400);
  }

  const rechazar = async (mensaje) => {
    await auditoria.registrarAccion({
      idUsuario: idUsuarioAccion,
      accion: 'asignar_entrenador',
      modulo: 'asignaciones',
      resultado: 'rechazado',
      descripcion: `Alta rechazada: cliente #${idCliente} → entrenador #${idEntrenador}: ${mensaje}`,
    });
    throw new ErrorServicio(mensaje, 400);
  };

  const inicio = fechaInicio || hoy();
  const conexion = await modelo.iniciarTransaccion();
  try {
    const vigente = await modelo.bloquearVigentePorCliente(idCliente, conexion);
    if (vigente) {
      await modelo.revertirTransaccion(conexion);
      await rechazar('El cliente ya tiene un entrenador asignado vigente');
    }
    const id = await modelo.crear({ idCliente, idEntrenador, fechaInicio: inicio }, conexion);
    await modelo.confirmarTransaccion(conexion);

    await auditoria.registrarAccion({
      idUsuario: idUsuarioAccion,
      accion: 'asignar_entrenador',
      modulo: 'asignaciones',
      resultado: 'exitoso',
      descripcion: `Asignación #${id}: cliente #${idCliente} → entrenador #${idEntrenador}`,
    });

    return modelo.obtenerPorId(id);
  } catch (error) {
    await modelo.revertirTransaccion(conexion).catch(() => {});
    // Refuerzo del UNIQUE (id_cliente, esta_vigente) ante altas concurrentes.
    if (error.code === 'ER_DUP_ENTRY') {
      await rechazar('El cliente ya tiene un entrenador asignado vigente');
    }
    throw error;
  }
}

/** Finaliza una asignación vigente (FR-007); conserva el historial (FR-008). */
export async function finalizar(id, { fechaFin = null } = {}, idUsuarioAccion = null) {
  const asignacion = await modelo.obtenerPorId(id);
  if (!asignacion) {
    throw new ErrorServicio('Asignación no encontrada', 404);
  }
  if (asignacion.estado !== 'vigente') {
    throw new ErrorServicio('La asignación ya está finalizada', 400);
  }

  const fin = fechaFin || hoy();
  await modelo.finalizar(id, fin);

  await auditoria.registrarAccion({
    idUsuario: idUsuarioAccion,
    accion: 'finalizar_asignacion',
    modulo: 'asignaciones',
    resultado: 'exitoso',
    descripcion: `Asignación #${id} finalizada el ${fin}`,
  });

  return modelo.obtenerPorId(id);
}
