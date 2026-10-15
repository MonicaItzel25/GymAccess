// Pruebas de contrato: consulta de registros de acceso (US-S2-09).
// GET /api/accesos → 200 para administrador, recepcionista y entrenador;
// 401 sin token y 403 para cliente.
// GET /api/accesos/mio → 200 solo para cliente.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import {
  vaciarTablas,
  insertarUsuario,
  cerrarPool,
} from '../helpers/baseDatos.js';

const app = crearApp();

async function tokenDe(correo) {
  const respuesta = await request(app)
    .post('/api/auth/login')
    .send({ correo, password: 'Prueba1234' });
  return respuesta.body.data.token;
}

describe('Contrato de consulta de accesos', () => {
  let tokenAdmin;
  let tokenRecep;
  let tokenEntrenador;
  let tokenCliente;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Admin', correo: 'admin-acccon@prueba.com', rol: 'administrador' });
    await insertarUsuario({ nombre: 'Recep', correo: 'recep-acccon@prueba.com', rol: 'recepcionista' });
    await insertarUsuario({ nombre: 'Entrenador', correo: 'ent-acccon@prueba.com', rol: 'entrenador' });
    await insertarUsuario({ nombre: 'Cliente', correo: 'cli-acccon@prueba.com', rol: 'cliente' });
    tokenAdmin = await tokenDe('admin-acccon@prueba.com');
    tokenRecep = await tokenDe('recep-acccon@prueba.com');
    tokenEntrenador = await tokenDe('ent-acccon@prueba.com');
    tokenCliente = await tokenDe('cli-acccon@prueba.com');
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('GET /api/accesos como administrador devuelve 200 y lista', async () => {
    const respuesta = await request(app)
      .get('/api/accesos')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(Array.isArray(respuesta.body.data)).toBe(true);
  });

  it('GET /api/accesos como recepcionista devuelve 200', async () => {
    const respuesta = await request(app)
      .get('/api/accesos')
      .set('Authorization', `Bearer ${tokenRecep}`);
    expect(respuesta.status).toBe(200);
  });

  it('GET /api/accesos como entrenador devuelve 200', async () => {
    const respuesta = await request(app)
      .get('/api/accesos')
      .set('Authorization', `Bearer ${tokenEntrenador}`);
    expect(respuesta.status).toBe(200);
  });

  it('GET /api/accesos sin token devuelve 401', async () => {
    const respuesta = await request(app).get('/api/accesos');
    expect(respuesta.status).toBe(401);
  });

  it('GET /api/accesos como cliente devuelve 403', async () => {
    const respuesta = await request(app)
      .get('/api/accesos')
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(respuesta.status).toBe(403);
    expect(respuesta.body.message).toContain('permisos');
  });

  it('GET /api/accesos/mio como cliente devuelve 200 y lista', async () => {
    const respuesta = await request(app)
      .get('/api/accesos/mio')
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(respuesta.status).toBe(200);
    expect(Array.isArray(respuesta.body.data)).toBe(true);
  });

  it('GET /api/accesos/mio como administrador devuelve 403', async () => {
    const respuesta = await request(app)
      .get('/api/accesos/mio')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(respuesta.status).toBe(403);
  });

  it('GET /api/accesos acepta los filtros de fecha y cliente', async () => {
    const respuesta = await request(app)
      .get('/api/accesos?desde=2026-01-01&hasta=2030-12-31')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(respuesta.status).toBe(200);
    expect(Array.isArray(respuesta.body.data)).toBe(true);
  });
});
