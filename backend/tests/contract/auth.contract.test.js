// Pruebas de contrato: POST /api/auth/login y GET /api/auth/me
// Verifican códigos HTTP y formato de respuesta (contracts/api.md).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import {
  vaciarTablas,
  insertarUsuario,
  cerrarPool,
} from '../helpers/baseDatos.js';

const app = crearApp();

describe('Contrato de autenticación', () => {
  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({
      nombre: 'Contrato Admin',
      correo: 'contrato-admin@prueba.com',
      rol: 'administrador',
    });
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('POST /api/auth/login devuelve 200 con token y datos del usuario', async () => {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'contrato-admin@prueba.com', password: 'Prueba1234' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.ok).toBe(true);
    expect(respuesta.body.data.token).toBeTruthy();
    expect(respuesta.body.data.usuario.rol).toBe('administrador');
    expect(respuesta.body.data.usuario.password).toBeUndefined();
  });

  it('POST /api/auth/login con campos faltantes devuelve 400', async () => {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.ok).toBe(false);
    expect(respuesta.body.message).toBeTruthy();
  });

  it('POST /api/auth/login con credenciales incorrectas devuelve 401 con el mensaje exacto', async () => {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'contrato-admin@prueba.com', password: 'Incorrecta9' });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.ok).toBe(false);
    expect(respuesta.body.message).toBe('correo o contraseña incorrectos');
  });

  it('GET /api/auth/me sin token devuelve 401', async () => {
    const respuesta = await request(app).get('/api/auth/me');

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.ok).toBe(false);
  });

  it('GET /api/auth/me con token válido devuelve 200 y el rol', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'contrato-admin@prueba.com', password: 'Prueba1234' });

    const respuesta = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.data.token}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.correo).toBe('contrato-admin@prueba.com');
    expect(respuesta.body.data.rol).toBe('administrador');
  });
});
