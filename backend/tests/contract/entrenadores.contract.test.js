// Pruebas de contrato: registro de entrenadores (US-S3-01, Sprint 3).
// POST: solo administrador; exige cuenta existente con rol `entrenador` y sin
// perfil previo (FR-001, RN-002). GET: administrador y recepcionista (contrato
// §1). Matriz de denegaciones §10.

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

describe('Contrato de entrenadores', () => {
  let tokenAdmin;
  let tokenRecep;
  let tokenEntrenador;
  let tokenCliente;
  let idCuentaEntrenador;
  let idPerfil;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Admin Gimnasio', correo: 'admin-ent@prueba.com', rol: 'administrador' });
    await insertarUsuario({ nombre: 'Recepcion', correo: 'recep-ent@prueba.com', rol: 'recepcionista' });
    idCuentaEntrenador = await insertarUsuario({
      nombre: 'Carlos Entrenador',
      correo: 'entrenador-ent@prueba.com',
      rol: 'entrenador',
    });
    await insertarUsuario({ nombre: 'Socio Cliente', correo: 'cliente-ent@prueba.com', rol: 'cliente' });
    tokenAdmin = await tokenDe('admin-ent@prueba.com');
    tokenRecep = await tokenDe('recep-ent@prueba.com');
    tokenEntrenador = await tokenDe('entrenador-ent@prueba.com');
    tokenCliente = await tokenDe('cliente-ent@prueba.com');
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('POST como administrador crea el perfil y devuelve 201 con el nombre de la cuenta', async () => {
    const respuesta = await request(app)
      .post('/api/entrenadores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_usuario: idCuentaEntrenador, especialidad: 'Fuerza y acondicionamiento', telefono: '555-1234' });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.data.id_entrenador).toBeTruthy();
    expect(respuesta.body.data.id_usuario).toBe(idCuentaEntrenador);
    expect(respuesta.body.data.nombre).toBe('Carlos Entrenador');
    expect(respuesta.body.data.estado).toBe('activo');
    idPerfil = respuesta.body.data.id_entrenador;
  });

  it('POST con la misma cuenta devuelve 400 «La cuenta ya tiene un perfil de entrenador»', async () => {
    const respuesta = await request(app)
      .post('/api/entrenadores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_usuario: idCuentaEntrenador });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toContain('ya tiene un perfil');
  });

  it('POST con cuenta de otro rol devuelve 400 con mensaje claro (US-S3-01.2)', async () => {
    const idRecep = await insertarUsuario({
      nombre: 'Otro Rol',
      correo: 'otro-rol-ent@prueba.com',
      rol: 'recepcionista',
    });
    const respuesta = await request(app)
      .post('/api/entrenadores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_usuario: idRecep });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toContain('rol entrenador');
  });

  it('POST con id_usuario inexistente devuelve 404', async () => {
    const respuesta = await request(app)
      .post('/api/entrenadores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_usuario: 999999 });

    expect(respuesta.status).toBe(404);
  });

  it('POST con id_usuario no numérico devuelve 400 (validación de campos)', async () => {
    const respuesta = await request(app)
      .post('/api/entrenadores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_usuario: 'abc' });

    expect(respuesta.status).toBe(400);
  });

  it('POST sin token devuelve 401', async () => {
    const respuesta = await request(app)
      .post('/api/entrenadores')
      .send({ id_usuario: idCuentaEntrenador });

    expect(respuesta.status).toBe(401);
  });

  it('POST como recepcionista devuelve 403 (US-S3-01.3)', async () => {
    const respuesta = await request(app)
      .post('/api/entrenadores')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ id_usuario: 999999 });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.message).toContain('permisos');
  });

  it('POST como entrenador devuelve 403 (US-S3-01.3)', async () => {
    const respuesta = await request(app)
      .post('/api/entrenadores')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ id_usuario: 999999 });

    expect(respuesta.status).toBe(403);
  });

  it('POST como cliente devuelve 403 (US-S3-01.3)', async () => {
    const respuesta = await request(app)
      .post('/api/entrenadores')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ id_usuario: 999999 });

    expect(respuesta.status).toBe(403);
  });

  it('GET como administrador lista los perfiles (200)', async () => {
    const respuesta = await request(app)
      .get('/api/entrenadores')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(Array.isArray(respuesta.body.data)).toBe(true);
    expect(respuesta.body.data.some((e) => e.id_entrenador === idPerfil)).toBe(true);
  });

  it('GET como recepcionista lista los perfiles (200)', async () => {
    const respuesta = await request(app)
      .get('/api/entrenadores')
      .set('Authorization', `Bearer ${tokenRecep}`);

    expect(respuesta.status).toBe(200);
  });

  it('GET /:id devuelve el detalle del perfil (200)', async () => {
    const respuesta = await request(app)
      .get(`/api/entrenadores/${idPerfil}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.id_usuario).toBe(idCuentaEntrenador);
  });

  it('GET /:id inexistente devuelve 404', async () => {
    const respuesta = await request(app)
      .get('/api/entrenadores/999999')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(404);
  });

  it('GET como entrenador o cliente devuelve 403 (matriz §10)', async () => {
    const comoEntrenador = await request(app)
      .get('/api/entrenadores')
      .set('Authorization', `Bearer ${tokenEntrenador}`);
    const comoCliente = await request(app)
      .get('/api/entrenadores')
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(comoEntrenador.status).toBe(403);
    expect(comoCliente.status).toBe(403);
  });
});
