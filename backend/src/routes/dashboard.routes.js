// routes/dashboard.routes.js
// Dashboard administrativo (Sprint 3, US-S3-06, contrato §8): solo lectura y
// exclusivo del administrador (FR-028). ES Modules.

import { Router } from 'express';
import { autenticar } from '../middlewares/auth.js';
import { autorizar } from '../middlewares/authorize.js';
import { validar } from '../validators/validar.js';
import { reglasPeriodo } from '../validators/dashboard.validators.js';
import { obtener } from '../controllers/dashboard.controller.js';

const router = Router();

router.use(autenticar);

router.get('/', autorizar('administrador'), reglasPeriodo, validar, obtener);

export default router;
