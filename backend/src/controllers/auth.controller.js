// controllers/auth.controller.js
// Endpoints de autenticación: login y perfil de la sesión actual.
// Los mensajes de error nunca revelan información interna. ES Modules.

import { intentarLogin, firmarToken } from '../services/auth.service.js';
import { enviarOk, enviarError } from '../utils/response.js';

/** POST /api/auth/login */
export async function login(req, res, next) {
  try {
    const { correo, password } = req.body;
    const usuario = await intentarLogin(correo, password);
    const token = firmarToken(usuario);

    return enviarOk(res, {
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return enviarError(res, error.message, error.statusCode);
    }
    return next(error);
  }
}

/** GET /api/auth/me */
export function yo(req, res) {
  return enviarOk(res, req.usuario);
}
