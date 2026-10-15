// middlewares/auth.js
// Autenticación por JWT (principio III y V de la constitución).
// Valida el encabezado Authorization: Bearer <token> y adjunta el usuario
// decodificado a la petición. ES Modules.

import jwt from 'jsonwebtoken';

/** Middleware de autenticación: 401 si el token falta, es inválido o expiró. */
export function autenticar(req, res, next) {
  const encabezado = req.headers.authorization || '';
  const [esquema, token] = encabezado.split(' ');

  if (esquema !== 'Bearer' || !token) {
    return res.status(401).json({
      ok: false,
      message: 'Autenticación requerida',
    });
  }

  try {
    const secreto = process.env.JWT_SECRET;
    if (!secreto) {
      throw new Error('JWT_SECRET no configurado');
    }
    const payload = jwt.verify(secreto ? token : '', secreto);
    req.usuario = {
      id_usuario: payload.id_usuario,
      nombre: payload.nombre,
      correo: payload.correo,
      rol: payload.rol,
    };
    return next();
  } catch (error) {
    const expirado = error.name === 'TokenExpiredError';
    return res.status(401).json({
      ok: false,
      message: expirado ? 'Sesión expirada' : 'Token inválido',
    });
  }
}
