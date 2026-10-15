// Pruebas de contrato: tipos de membresía.
// POST/PUT: solo administrador (el recepcionista recibe 403, FR-001).
// GET: administrador y recepcionista.

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

describe('Contrato de tipos de membresía', () => {
  let tokenAdmin;
  let tokenRecep;
  let tokenEntrenador;
  let tokenCliente;
  let idTipo;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Admin', correo: 'admin-tipo@prueba.com', rol: 'administrador' });
    await insertarUsuario({ nombre: 'Recep', correo: 'recep-tipo@prueba.com', rol: 'recepcionista' });
    await insertarUsuario({ nombre: 'Entrenador', correo: 'ent-tipo@prueba.com', rol: 'entrenador' });
    await insertarUsuario({ nombre: 'Cliente', correo: 'cli-tipo@prueba.com', rol: 'cliente' });
    tokenAdmin = await tokenDe('admin-tipo@prueba.com');
    tokenRecep = await tokenDe('recep-tipo@prueba.com');
    tokenEntrenador = await tokenDe('ent-tipo@prueba.com');
    tokenCliente = await tokenDe('cli-tipo@prueba.com');
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('POST como administrador devuelve 201', async () => {
    const respuesta = await request(app)
      .post('/api/tipos-membresia')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Mensual', descripcion: '30 días', duracion: 30, precio: 500 });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.data.nombre).toBe('Mensual');
    idTipo = respuesta.body.data.id_tipo_membresia;
  });

  it('POST como recepcionista devuelve 403 (FR-001)', async () => {
    const respuesta = await request(app)
      .post('/api/tipos-membresia')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ nombre: 'Semestral', duracion: 180, precio: 2500 });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.message).toContain('permisos');
  });

  it('POST sin token devuelve 401', async () => {
    const respuesta = await request(app)
      .post('/api/tipos-membresia')
      .send({ nombre: 'Anual', duracion: 365, precio: 5000 });

    expect(respuesta.status).toBe(401);
  });

  it('POST con precio no positivo devuelve 400', async () => {
    const respuesta = await request(app)
      .post('/api/tipos-membresia')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Inválido', duracion: 30, precio: 0 });

    expect(respuesta.status).toBe(400);
  });

  it('POST con duración no positiva devuelve 400', async () => {
    const respuesta = await request(app)
      .post('/api/tipos-membresia')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Inválido', duracion: -5, precio: 100 });

    expect(respuesta.status).toBe(400);
  });

  it('POST sin nombre devuelve 400', async () => {
    const respuesta = await request(app)
      .post('/api/tipos-membresia')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ duracion: 30, precio: 100 });

    expect(respuesta.status).toBe(400);
  });

  it('PUT como administrador modifica el tipo (200)', async () => {
    const respuesta = await request(app)
      .put(`/api/tipos-membresia/${idTipo}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ precio: 550 });

    expect(respuesta.status).toBe(200);
    expect(Number(respuesta.body.data.precio)).toBe(550);
  });

  it('PUT como recepcionista devuelve 403', async () => {
    const respuesta = await request(app)
      .put(`/api/tipos-membresia/${idTipo}`)
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ precio: 600 });

    expect(respuesta.status).toBe(403);
  });

  it('PUT a un tipo inexistente devuelve 404', async () => {
    const respuesta = await request(app)
      .put('/api/tipos-membresia/999999')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ precio: 700 });

    expect(respuesta.status).toBe(404);
  });

  it('GET como administrador devuelve 200', async () => {
    const respuesta = await request(app)
      .get('/api/tipos-membresia')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(Array.isArray(respuesta.body.data)).toBe(true);
  });

  it('GET como recepcionista devuelve 200', async () => {
    const respuesta = await request(app)
      .get('/api/tipos-membresia')
      .set('Authorization', `Bearer ${tokenRecep}`);

    expect(respuesta.status).toBe(200);
  });

  it('GET como entrenador devuelve 403', async () => {
    const respuesta = await request(app)
      .get('/api/tipos-membresia')
      .set('Authorization', `Bearer ${tokenEntrenador}`);

    expect(respuesta.status).toBe(403);
  });

  it('GET como cliente devuelve 403', async () => {
    const respuesta = await request(app)
      .get('/api/tipos-membresia')
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(respuesta.status).toBe(403);
  });
});
