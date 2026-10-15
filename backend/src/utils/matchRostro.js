// utils/matchRostro.js
// Comparación de descriptores faciales. La distancia euclidiana es matemática
// pura (vector de 128 números), por lo que no se necesita el backend nativo de
// TensorFlow en el servidor (research §1, actualización de implementación).
// face-api.js aporta euclideanDistance sin dependencias nativas.
// ES Modules.

import { euclideanDistance } from 'face-api.js';

/** Umbral de coincidencia: menor = más estricto (research §5). */
export function obtenerUmbral() {
  const valor = Number(process.env.FACE_MATCH_THRESHOLD);
  return Number.isFinite(valor) && valor > 0 ? valor : 0.5;
}

/** Distancia euclidiana entre dos descriptores de 128 números. */
export function distancia(a, b) {
  return euclideanDistance(a, b);
}

/** Indica si dos descriptores coinciden dentro del umbral. */
export function coinciden(a, b, umbral = obtenerUmbral()) {
  return distancia(a, b) <= umbral;
}
