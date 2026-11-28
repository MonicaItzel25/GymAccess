// routes/miEntrenamiento.routes.js
// Rutina y progreso propios (Sprint 3, US-S3-05, contrato §7). Recurso de solo
// consulta y EXCLUSIVO del rol cliente. Cualquier parámetro que pretenda
// identificar a un cliente se rechaza con 403 (US-S3-05.4). ES Modules.

import { Router } from 'express';
import { autenticar } from '../middlewares/auth.js';
import { autorizar } from '../middlewares/authorize.js';
import { rutina, objetivos, progresos } from '../controllers/miEntrenamiento.controller.js';

const PARAMETROS_DE_IDENTIFICACION = ['cliente', 'id_cliente', 'id'];

/** Hace visible la denegación ante un intento de consultar a un tercero. */
function rechazarIdentificadores(req, res, next) {
  // `id[]=1` o `id[x]=1` llegan como la clave `id`.
  const intento = Object.keys(req.query).some((nombre) =>
    PARAMETROS_DE_IDENTIFICACION.includes(nombre.toLowerCase())
  );
  if (intento) {
    return res.status(403).json({
      ok: false,
      message: 'Solo puedes consultar tu propia información',
    });
  }
  return next();
}

const router = Router();

router.use(autenticar);

const soloCliente = [autorizar('cliente'), rechazarIdentificadores];

router.get('/rutina', soloCliente, rutina);
router.get('/objetivos', soloCliente, objetivos);
router.get('/progresos', soloCliente, progresos);

export default router;
