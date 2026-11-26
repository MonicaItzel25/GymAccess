// services/accesoEntrenamiento.service.js
// Comprobación de acceso compartida por los módulos de seguimiento (Sprint 3,
// US-S3-04): solo un entrenador con perfil activo (FR-003) y con asignación
// vigente con el cliente (RN-005) puede consultar o registrar sus datos.
// El rol se comprueba antes, en las rutas. ES Modules.

import * as entrenadorModelo from '../models/entrenador.model.js';
import { existeAsignacionVigente } from '../models/rutina.model.js';
import { ErrorServicio } from '../utils/errorServicio.js';

/** Devuelve el perfil de entrenador activo del usuario o lanza 403. */
export async function exigirPerfilActivo(usuario) {
  const perfil = await entrenadorModelo.obtenerPorIdUsuario(usuario.id_usuario);
  if (!perfil) {
    throw new ErrorServicio('No tienes un perfil de entrenador activo', 403);
  }
  if (perfil.estado !== 'activo') {
    throw new ErrorServicio(
      'El entrenador está inactivo; no puede consultar ni registrar el seguimiento',
      403
    );
  }
  return perfil;
}

/** Exige una asignación vigente del entrenador con el cliente o lanza 403. */
export async function exigirAsignacionVigente(perfil, idCliente) {
  const vigente = await existeAsignacionVigente(perfil.id_entrenador, idCliente);
  if (!vigente) {
    throw new ErrorServicio('No tienes una asignación vigente con este cliente', 403);
  }
}
