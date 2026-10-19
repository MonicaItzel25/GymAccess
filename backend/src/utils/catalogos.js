// utils/catalogos.js
// Catálogos constantes del Sprint 2. Se validan en el backend; la base de
// datos conserva los campos como VARCHAR/ENUM sin alterar la migración 002
// (research.md §7). ES Modules.

/** Métodos de pago aceptados (FR-015). */
export const METODOS_PAGO = ['efectivo', 'transferencia', 'tarjeta'];

/** Motivos de rechazo de acceso (FR-028, FR-029). */
export const MOTIVOS_RECHAZO = {
  MEMBRESIA_VENCIDA: 'membresia vencida',
  MEMBRESIA_SUSPENDIDA: 'membresia suspendida',
  MEMBRESIA_CANCELADA: 'membresia cancelada',
  SIN_MEMBRESIA_VIGENTE: 'sin membresia vigente',
  ROSTRO_NO_IDENTIFICADO: 'rostro no identificado',
};

/** Motivos de rechazo del acceso manual en recepción (FR-030, RN-017).
 *  Todos caben en `motivo_rechazo VARCHAR(100)`. */
export const MOTIVOS_RECHAZO_MANUAL = {
  IDENTIDAD_NO_VERIFICABLE: 'identidad no verificable',
  MEMBRESIA_NO_VIGENTE: 'membresia no vigente',
};

/** Valida que un método de pago pertenezca al catálogo. */
export function esMetodoPagoValido(metodo) {
  return METODOS_PAGO.includes(metodo);
}

/** Valida que un motivo pertenezca al catálogo de motivos de rechazo. */
export function esMotivoRechazoValido(motivo) {
  return Object.values(MOTIVOS_RECHAZO).includes(motivo);
}
