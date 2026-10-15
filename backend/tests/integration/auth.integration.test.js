// Pruebas de integración: flujo de inicio de sesión completo
// Cubre credenciales válidas/inválidas, usuario inactivo y el bloqueo
// de 5 intentos fallidos consecutivos durante 15 minutos (FR-030).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import {
  vaciarTablas,
  insertarUsuario,
  cerrarPool,
} from '../helpers/baseDatos.js';

const app = crearApp();

describe('Integración de login', () => {
  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({
      nombre: 'Activo',
      correo: 'activo@prueba.com',
      rol: 'recepcionista',
    });
    await insertarUsuario({
      nombre: 'Inactivo',
      correo: 'inactivo@prueba.com',
      rol: 'recepcionista',
      estado: 'inactivo',
    });
    await insertarUsuario({
      nombre: 'Reset',
      correo: 'reset@prueba.com',
      rol: 'entrenador',
    });
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('acepta credenciales correctas y devuelve el rol', async () => {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'activo@prueba.com', password: 'Prueba1234' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.usuario.rol).toBe('recepcionista');
  });

  it('normaliza el correo con espacios y mayúsculas en el login (FR-007)', async () => {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({ correo: '  ACTIVO@PRUEBA.COM  ', password: 'Prueba1234' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.usuario.correo).toBe('activo@prueba.com');
  });

  it('rechaza la contraseña incorrecta con mensaje genérico', async () => {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'activo@prueba.com', password: 'Incorrecta9' });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.message).toBe('correo o contraseña incorrectos');
  });

  it('rechaza al usuario inactivo con el mismo mensaje genérico', async () => {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'inactivo@prueba.com', password: 'Prueba1234' });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.message).toBe('correo o contraseña incorrectos');
  });

  it('bloquea la cuenta tras 5 intentos fallidos consecutivos', async () => {
    // Los 5 fallos responden 401 (credenciales incorrectas); el quinto es el
    // que deja la cuenta bloqueada, según el contrato de Sprint 1: 401 =
    // credenciales incorrectas y 409 = cuenta ya bloqueada (FR-030).
    for (let intento = 1; intento <= 5; intento += 1) {
      const respuesta = await request(app)
        .post('/api/auth/login')
        .send({ correo: 'bloqueo@prueba.com', password: 'Incorrecta9' });

      expect(respuesta.status).toBe(401);
      expect(respuesta.body.message).toBe('correo o contraseña incorrectos');
    }

    // A partir del sexto intento la cuenta está bloqueada: responde 409 incluso
    // con la contraseña correcta.
    const conCorrecta = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'bloqueo@prueba.com', password: 'Prueba1234' });

    expect(conCorrecta.status).toBe(409);
    expect(conCorrecta.body.message).toContain('bloqueada');
  });

  it('restablece el contador de intentos tras un login exitoso', async () => {
    // 4 fallos consecutivos en una cuenta limpia
    for (let intento = 1; intento <= 4; intento += 1) {
      const fallo = await request(app)
        .post('/api/auth/login')
        .send({ correo: 'reset@prueba.com', password: 'Incorrecta9' });
      expect(fallo.status).toBe(401);
    }

    // 1 éxito: restablece el contador
    const exito = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'reset@prueba.com', password: 'Prueba1234' });
    expect(exito.status).toBe(200);

    // Un fallo tras el éxito no debe llegar al bloqueo
    const fallo = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'reset@prueba.com', password: 'Incorrecta9' });
    expect(fallo.status).toBe(401);
    expect(fallo.body.message).toBe('correo o contraseña incorrectos');
  });
});
