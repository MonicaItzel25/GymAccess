// utils/catalogos.js
// Catálogos constantes del Sprint 2. Se validan en el backend; la base de
// datos conserva los campos como VARCHAR/ENUM sin alterar la migración 002
// (research.md §7). ES Modules.

/** Métodos de pago aceptados (FR-007). */
export const METODOS_PAGO = ['efectivo', 'transferencia', 'tarjeta'];

/** Motivos de rechazo de acceso (FR-016, FR-017). */
export const MOTIVOS_RECHAZO = {
  MEMBRESIA_VENCIDA: 'membresia vencida',
  MEMBRESIA_SUSPENDIDA: 'membresia suspendida',
  MEMBRESIA_CANCELADA: 'membresia cancelada',
  SIN_MEMBRESIA_VIGENTE: 'sin membresia vigente',
  ROSTRO_NO_IDENTIFICADO: 'rostro no identificado',
};

/** Valida que un método de pago pertenezca al catálogo. */
export function esMetodoPagoValido(metodo) {
  return METODOS_PAGO.includes(metodo);
}

/** Valida que un motivo pertenezca al catálogo de motivos de rechazo. */
export function esMotivoRechazoValido(motivo) {
  return Object.values(MOTIVOS_RECHAZO).includes(motivo);
}
