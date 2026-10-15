// Pruebas de contrato: consulta de auditoría (FR-021).
// GET /api/auditoria → 200 solo para administrador; 401 sin token y
// 403 para recepcionista, entrenador y cliente.
// No existe ruta DELETE (FR-008, SC-005).

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

describe('Contrato de consulta de auditoría', () => {
  let tokenAdmin;
  let tokenRecep;
  let tokenEntrenador;
  let tokenCliente;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Admin', correo: 'admin-aud@prueba.com', rol: 'administrador' });
    await insertarUsuario({ nombre: 'Recep', correo: 'recep-aud@prueba.com', rol: 'recepcionista' });
    await insertarUsuario({ nombre: 'Entrenador', correo: 'ent-aud@prueba.com', rol: 'entrenador' });
    await insertarUsuario({ nombre: 'Cliente', correo: 'cli-aud@prueba.com', rol: 'cliente' });
    tokenAdmin = await tokenDe('admin-aud@prueba.com');
    tokenRecep = await tokenDe('recep-aud@prueba.com');
    tokenEntrenador = await tokenDe('ent-aud@prueba.com');
    tokenCliente = await tokenDe('cli-aud@prueba.com');
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('GET /api/auditoria como administrador devuelve 200 y lista', async () => {
    const respuesta = await request(app)
      .get('/api/auditoria')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(Array.isArray(respuesta.body.data)).toBe(true);
  });

  it('GET /api/auditoria como recepcionista devuelve 403', async () => {
    const respuesta = await request(app)
      .get('/api/auditoria')
      .set('Authorization', `Bearer ${tokenRecep}`);

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.message).toContain('permisos');
  });

  it('GET /api/auditoria como entrenador devuelve 403', async () => {
    const respuesta = await request(app)
      .get('/api/auditoria')
      .set('Authorization', `Bearer ${tokenEntrenador}`);
    expect(respuesta.status).toBe(403);
  });

  it('GET /api/auditoria como cliente devuelve 403', async () => {
    const respuesta = await request(app)
      .get('/api/auditoria')
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(respuesta.status).toBe(403);
  });

  it('GET /api/auditoria sin token devuelve 401', async () => {
    const respuesta = await request(app).get('/api/auditoria');
    expect(respuesta.status).toBe(401);
  });

  it('GET /api/auditoria acepta los filtros desde, hasta y modulo', async () => {
    const respuesta = await request(app)
      .get('/api/auditoria?desde=2020-01-01&hasta=2030-12-31&modulo=membresias')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(Array.isArray(respuesta.body.data)).toBe(true);
    for (const registro of respuesta.body.data) {
      expect(registro.modulo).toBe('membresias');
    }
  });

  it('no existe ninguna ruta DELETE de auditoría (FR-008, SC-005)', async () => {
    const respuesta = await request(app)
      .delete('/api/auditoria')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect([404, 405]).toContain(respuesta.status);
  });
});
