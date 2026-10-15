// services/acceso.service.js
// Lógica del control de acceso del kiosco (FR-014 a FR-018).
// Orden estricto: identificar el rostro ANTES de validar la membresía
// (FR-014). Autoriza solo con membresía activa y vigente sin tolerancia
// (FR-005, FR-015); rechaza con el motivo del catálogo (FR-016, FR-017) y
// registra TODOS los intentos en `accesos` (FR-018) y en auditoría (FR-021).
// ES Modules.

import * as accesoModelo from '../models/acceso.model.js';
import * as membresiaModelo from '../models/membresia.model.js';
import * as rostroServicio from './rostro.service.js';
import * as auditoria from './auditoria.service.js';
import { MOTIVOS_RECHAZO } from '../utils/catalogos.js';
import { hoy } from '../utils/fechas.js';

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
  // 'activa' pero con fecha_fin anterior a hoy = vencida (sin tolerancia, FR-005).
  if (ultima.estado !== 'activa' || ultima.fecha_fin < hoy()) {
    return { resultado: 'rechazado', motivo: MOTIVOS_RECHAZO.MEMBRESIA_VENCIDA, membresia: ultima };
  }
  return { resultado: 'autorizado', motivo: null, membresia: ultima };
}

/** Ejecuta un intento de acceso completo y devuelve la decisión. */
export async function intentarAcceso(descriptor) {
  // 1. Identificación facial (previa a todo, FR-014).
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
    // 2. Validar la membresía (FR-015); usa la más reciente para dar el motivo exacto.
    const ultima = await membresiaModelo.obtenerUltima(identificado.id_cliente);
    decision = evaluarMembresia(ultima);
  }

  // 3. Registrar SIEMPRE el intento en `accesos` (FR-018).
  await accesoModelo.registrar({
    idCliente: cliente ? cliente.id_cliente : null,
    fecha: hoy(),
    hora: horaAhora(),
    resultado: decision.resultado,
    motivoRechazo: decision.motivo,
  });

  // 4. Auditoría del intento (FR-021); id_usuario nulo: acción del sistema.
  await auditoria.registrarAccion({
    idUsuario: null,
    accion: 'intento_acceso',
    modulo: 'accesos',
    resultado: decision.resultado === 'autorizado' ? 'exitoso' : 'rechazado',
    descripcion: decision.motivo || 'Acceso autorizado',
  });

  return construirRespuesta(decision, cliente);
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
