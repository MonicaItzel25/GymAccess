// services/auth.service.js
// Lógica de autenticación: verificación con bcrypt, emisión de JWT con
// expiración de 8 horas y bloqueo de cuentas tras 5 intentos fallidos
// consecutivos durante 15 minutos (FR-004, spec Sprint 1). ES Modules.

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { obtenerPorCorreo } from '../models/usuario.model.js';

const MAX_INTENTOS = 5;
const MINUTOS_BLOQUEO = 15;

// Hash real usado solo para comparar cuando la cuenta no existe, de modo
// que el tiempo de respuesta no revele si el correo está registrado.
const HASH_SIMULADO =
  '$2b$10$p6KQHWVyF24vhQdMG5ClL.fC.8OL19t4v1z2ZaS6alPwnJzn1t.QO';

// Registro en memoria de intentos fallidos (instancia única local).
const intentos = new Map();

/** Error de autenticación con código HTTP asociado. */
export class ErrorAutenticacion extends Error {
  constructor(mensaje, statusCode) {
    super(mensaje);
    this.name = 'ErrorAutenticacion';
    this.statusCode = statusCode;
  }
}

/** Devuelve true si la cuenta está bloqueada por intentos fallidos. */
function cuentaBloqueada(registro) {
  return Boolean(registro?.bloqueadoHasta && registro.bloqueadoHasta > Date.now());
}

/** Registra un intento fallido y bloquea la cuenta al llegar al límite. */
function registrarFallo(correo) {
  const registro = intentos.get(correo) || { fallidos: 0, bloqueadoHasta: null };
  if (cuentaBloqueada(registro)) return;

  registro.fallidos += 1;
  if (registro.fallidos >= MAX_INTENTOS) {
    registro.bloqueadoHasta = Date.now() + MINUTOS_BLOQUEO * 60 * 1000;
    registro.fallidos = 0;
    console.warn(
      `${new Date().toISOString()} | LOGIN_BLOQUEADO | ${correo} | ${MINUTOS_BLOQUEO} minutos`
    );
  }
  intentos.set(correo, registro);
}

/** Limpia el contador de intentos tras un inicio de sesión exitoso. */
function reiniciarIntentos(correo) {
  intentos.delete(correo);
}

/**
 * Valida las credenciales y devuelve el usuario activo.
 * Lanza ErrorAutenticacion con 409 si la cuenta está bloqueada o con 401
 * si las credenciales son incorrectas o el usuario está inactivo
 * (mismo mensaje genérico en todos los casos).
 */
export async function intentarLogin(correo, password) {
  const registro = intentos.get(correo);
  if (cuentaBloqueada(registro)) {
    console.warn(
      `${new Date().toISOString()} | LOGIN_BLOQUEADO | ${correo} | intento con cuenta bloqueada`
    );
    throw new ErrorAutenticacion(
      'Cuenta bloqueada temporalmente por intentos fallidos',
      409
    );
  }

  const usuario = await obtenerPorCorreo(correo);
  const hash = usuario ? usuario.password : HASH_SIMULADO;
  const coincide = await bcrypt.compare(password, hash);

  if (!usuario || !coincide || usuario.estado !== 'activo') {
    registrarFallo(correo);
    console.warn(
      `${new Date().toISOString()} | LOGIN_FALLIDO | ${correo} | credenciales incorrectas o cuenta inactiva`
    );
    throw new ErrorAutenticacion('correo o contraseña incorrectos', 401);
  }

  reiniciarIntentos(correo);
  return usuario;
}

/** Emite el token JWT con la expiración configurada (8 horas por defecto). */
export function firmarToken(usuario) {
  const secreto = process.env.JWT_SECRET;
  if (!secreto) {
    throw new Error('JWT_SECRET no configurado en las variables de entorno');
  }
  const horas = process.env.JWT_EXPIRACION_HORAS || '8';
  return jwt.sign(
    {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
    },
    secreto,
    { expiresIn: `${horas}h` }
  );
}
