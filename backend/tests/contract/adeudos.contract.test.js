// Pruebas de contrato: adeudos y pagos propios (US-S2-05).
// GET /api/adeudos → 200 solo administrador; 403 recepcionista, entrenador y cliente.
// GET /api/adeudos/mio y GET /api/pagos/mio → 200 solo cliente.

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

describe('Contrato de consulta de adeudos', () => {
  let tokenAdmin;
  let tokenRecep;
  let tokenEntrenador;
  let tokenCliente;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Admin', correo: 'admin-ade@prueba.com', rol: 'administrador' });
    await insertarUsuario({ nombre: 'Recep', correo: 'recep-ade@prueba.com', rol: 'recepcionista' });
    await insertarUsuario({ nombre: 'Entrenador', correo: 'ent-ade@prueba.com', rol: 'entrenador' });
    await insertarUsuario({ nombre: 'Cliente', correo: 'cli-ade@prueba.com', rol: 'cliente' });
    tokenAdmin = await tokenDe('admin-ade@prueba.com');
    tokenRecep = await tokenDe('recep-ade@prueba.com');
    tokenEntrenador = await tokenDe('ent-ade@prueba.com');
    tokenCliente = await tokenDe('cli-ade@prueba.com');
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('GET /api/adeudos como administrador devuelve 200 y lista', async () => {
    const respuesta = await request(app)
      .get('/api/adeudos')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(Array.isArray(respuesta.body.data)).toBe(true);
  });

  it('GET /api/adeudos como recepcionista devuelve 403 (US-S2-05.3)', async () => {
    const respuesta = await request(app)
      .get('/api/adeudos')
      .set('Authorization', `Bearer ${tokenRecep}`);

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.message).toContain('permisos');
  });

  it('GET /api/adeudos como entrenador devuelve 403', async () => {
    const respuesta = await request(app)
      .get('/api/adeudos')
      .set('Authorization', `Bearer ${tokenEntrenador}`);

    expect(respuesta.status).toBe(403);
  });

  it('GET /api/adeudos como cliente devuelve 403', async () => {
    const respuesta = await request(app)
      .get('/api/adeudos')
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(respuesta.status).toBe(403);
  });

  it('GET /api/adeudos sin token devuelve 401', async () => {
    const respuesta = await request(app).get('/api/adeudos');
    expect(respuesta.status).toBe(401);
  });

  it('GET /api/adeudos/mio como cliente devuelve 200 y lista', async () => {
    const respuesta = await request(app)
      .get('/api/adeudos/mio')
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(respuesta.status).toBe(200);
    expect(Array.isArray(respuesta.body.data)).toBe(true);
  });

  it('GET /api/adeudos/mio como administrador devuelve 403', async () => {
    const respuesta = await request(app)
      .get('/api/adeudos/mio')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(403);
  });

  it('GET /api/pagos/mio como cliente devuelve 200 y lista', async () => {
    const respuesta = await request(app)
      .get('/api/pagos/mio')
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(respuesta.status).toBe(200);
    expect(Array.isArray(respuesta.body.data)).toBe(true);
  });

  it('GET /api/pagos/mio como recepcionista devuelve 403', async () => {
    const respuesta = await request(app)
      .get('/api/pagos/mio')
      .set('Authorization', `Bearer ${tokenRecep}`);

    expect(respuesta.status).toBe(403);
  });
});
