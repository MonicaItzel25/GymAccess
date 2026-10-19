// services/auditoria.service.js
// Registro de acciones de auditoría (FR-037, FR-040). Un fallo al auditar NUNCA debe
// interrumpir la operación principal: se registra en el log del servidor y se
// continúa. ES Modules.

import * as modelo from '../models/auditoria.model.js';

/**
 * Registra una acción en `auditoria`. Nunca lanza: si falla, lo deja anotado
 * en el log para no romper la operación de negocio que la originó.
 */
export async function registrarAccion({ idUsuario = null, accion, modulo, resultado, descripcion = null }) {
  try {
    await modelo.crear({ idUsuario, accion, modulo, resultado, descripcion });
  } catch (error) {
    console.error(
      `${new Date().toISOString()} | AUDITORIA | ${accion} (${modulo}) | ${error.message}`
    );
  }
}
