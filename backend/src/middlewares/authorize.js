// middlewares/authorize.js
// Autorización por rol en el backend (FR-045, RN-001).
// Ocultar una opción en la interfaz NO es autorización: este middleware es
// la única fuente de verdad de permisos. ES Modules.

/** Crea un middleware que solo permite los roles indicados. */
export function autorizar(...rolesPermitidos) {
  return function middlewareAutorizacion(req, res, next) {
    if (!req.usuario) {
      return res.status(401).json({
        ok: false,
        message: 'Autenticación requerida',
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        ok: false,
        message: 'No tienes permisos para realizar esta operación',
      });
    }

    return next();
  };
}
