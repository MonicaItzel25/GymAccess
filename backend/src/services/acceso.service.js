// services/acceso.service.js
// Lógica del control de acceso del kiosco (FR-027 a FR-034).
// Orden estricto: identificar el rostro ANTES de validar la membresía
// (FR-027). Autoriza solo con membresía activa y vigente sin tolerancia
// (FR-028, FR-029); rechaza con el motivo del catálogo (RN-007) y
// registra TODOS los intentos en `accesos` (FR-034, RN-008) y en auditoría (FR-037).
// ES Modules.

import * as accesoModelo from '../models/acceso.model.js';
import * as membresiaModelo from '../models/membresia.model.js';
import * as clienteModelo from '../models/cliente.model.js';
import * as rostroServicio from './rostro.service.js';
import * as auditoria from './auditoria.service.js';
import { MOTIVOS_RECHAZO } from '../utils/catalogos.js';
import { hoy } from '../utils/fechas.js';
import { ErrorServicio } from '../utils/errorServicio.js';

/** Devuelve la hora actual en formato 'HH:MM:SS'. */
function horaAhora() {
  return new Date().toTimeString().slice(0, 8);
}

/** Determina la decisión a partir de la membresía más reciente del cliente. */
function evaluarMembresia(ultima) {
  if (!ultima) {
    return { resultado: 'rechazado', motivo: MOTIVOS_RECHAZO.SIN_MEMBRESIA_VIGENTE, membresia: null };
  }
  if (ultima.estado === 'suspendida') {
    return { resultado: 'rechazado', motivo: MOTIVOS_RECHAZO.MEMBRESIA_SUSPENDIDA, membresia: ultima };
  }
  if (ultima.estado === 'cancelada') {
    return { resultado: 'rechazado', motivo: MOTIVOS_RECHAZO.MEMBRESIA_CANCELADA, membresia: ultima };
  }
  // 'activa' pero con fecha_fin anterior a hoy = vencida (sin tolerancia, FR-010).
  if (ultima.estado !== 'activa' || ultima.fecha_fin < hoy()) {
    return { resultado: 'rechazado', motivo: MOTIVOS_RECHAZO.MEMBRESIA_VENCIDA, membresia: ultima };
  }
  return { resultado: 'autorizado', motivo: null, membresia: ultima };
}

/** Ejecuta un intento de acceso completo y devuelve la decisión. */
export async function intentarAcceso(descriptor) {
  // 1. Identificación facial (previa a todo, FR-027).
  const identificado = await rostroServicio.identificarCliente(descriptor);

  let decision;
  let cliente = null;

  if (!identificado) {
    decision = {
      resultado: 'rechazado',
      motivo: MOTIVOS_RECHAZO.ROSTRO_NO_IDENTIFICADO,
      membresia: null,
    };
  } else {
    cliente = { id_cliente: identificado.id_cliente, nombre: identificado.nombre, apellido: identificado.apellido };
    // 2. Validar la membresía (FR-028, FR-029); usa la más reciente para dar el motivo exacto.
    const ultima = await membresiaModelo.obtenerUltima(identificado.id_cliente);
    decision = evaluarMembresia(ultima);
  }

  // 3. Registrar SIEMPRE el intento en `accesos` (FR-034).
  await accesoModelo.registrar({
    idCliente: cliente ? cliente.id_cliente : null,
    fecha: hoy(),
    hora: horaAhora(),
    resultado: decision.resultado,
    motivoRechazo: decision.motivo,
  });

  // 4. Auditoría del intento (FR-037); id_usuario nulo: acción del sistema.
  await auditoria.registrarAccion({
    idUsuario: null,
    accion: 'intento_acceso',
    modulo: 'accesos',
    resultado: decision.resultado === 'autorizado' ? 'exitoso' : 'rechazado',
    descripcion: decision.motivo || 'Acceso autorizado',
  });

  return construirRespuesta(decision, cliente);
}

/** Autoriza o rechaza el ingreso de forma manual en recepción (FR-030, RN-017).
 *  El backend decide: si se autoriza, la membresía debe estar vigente con las
 *  MISMAS reglas del kiosco; si no, responde 409 sin crear registro autorizado.
 *  El registro queda con origen='manual' e id_usuario = personal de la sesión.
 *  Un fallo de auditoría no interrumpe la operación (FR-040). */
export async function autorizarAccesoManual({ idCliente, resultado, motivo = null }, idUsuario) {
  // 1. El cliente debe existir (404).
  const cliente = await clienteModelo.obtenerPorId(idCliente);
  if (!cliente) {
    throw new ErrorServicio('Cliente no encontrado', 404);
  }

  let motivoFinal = null;

  // 2. Al autorizar, la membresía vigente decide (409 si no lo está).
  if (resultado === 'autorizado') {
    const ultima = await membresiaModelo.obtenerUltima(idCliente);
    const decision = evaluarMembresia(ultima);
    if (decision.resultado !== 'autorizado') {
      throw new ErrorServicio('La membresía no está vigente; no se autoriza el ingreso', 409);
    }
  } else {
    motivoFinal = motivo;
  }

  // 3. Registrar SIEMPRE el intento manual (FR-034), con origen e id_usuario.
  const fecha = hoy();
  const hora = horaAhora();
  const idAcceso = await accesoModelo.registrar({
    idCliente,
    fecha,
    hora,
    resultado,
    motivoRechazo: motivoFinal,
    idUsuario,
    origen: 'manual',
  });

  // 4. Auditoría con actor; un fallo aquí no interrumpe (FR-040).
  try {
    await auditoria.registrarAccion({
      idUsuario,
      accion: 'autorizacion_manual',
      modulo: 'accesos',
      resultado: resultado === 'autorizado' ? 'exitoso' : 'rechazado',
      descripcion: `Acceso manual #${idAcceso} del cliente #${idCliente}: ${resultado}${motivoFinal ? ` (${motivoFinal})` : ''}`,
    });
  } catch {
    // FR-040: se continúa aunque la auditoría falle.
  }

  return {
    id_acceso: idAcceso,
    id_cliente: idCliente,
    resultado,
    motivo_rechazo: motivoFinal,
    origen: 'manual',
    id_usuario: idUsuario,
    fecha,
    hora,
  };
}

/** Da forma a la respuesta según el contrato del kiosco. */
function construirRespuesta(decision, cliente) {
  if (decision.resultado === 'autorizado') {
    return {
      resultado: 'autorizado',
      mensaje: 'Acceso autorizado',
      cliente,
      membresia: {
        estado: decision.membresia.estado,
        fecha_fin: decision.membresia.fecha_fin,
      },
    };
  }
  return {
    resultado: 'rechazado',
    mensaje:
      decision.motivo === MOTIVOS_RECHAZO.ROSTRO_NO_IDENTIFICADO
        ? 'No se pudo identificar su rostro, acuda a recepción'
        : `Acceso rechazado: ${decision.motivo}`,
    motivo: decision.motivo,
    cliente: decision.motivo === MOTIVOS_RECHAZO.ROSTRO_NO_IDENTIFICADO ? null : cliente,
  };
}
