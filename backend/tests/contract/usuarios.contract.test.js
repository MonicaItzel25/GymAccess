// Pruebas de contrato: POST y GET /api/usuarios (exclusivo administrador).

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

describe('Contrato de gestión de usuarios', () => {
  let tokenAdmin;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({
      nombre: 'Admin Contrato',
      correo: 'admin-contrato@prueba.com',
      rol: 'administrador',
    });
    await insertarUsuario({
      nombre: 'Recepcionista',
      correo: 'recepcion-contrato@prueba.com',
      rol: 'recepcionista',
    });
    tokenAdmin = await tokenDe('admin-contrato@prueba.com');
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('POST con administrador y datos válidos devuelve 201', async () => {
    const respuesta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Nuevo Usuario',
        correo: 'nuevo@prueba.com',
        password: 'NuevaClave1',
        rol: 'recepcionista',
      });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.ok).toBe(true);
    expect(respuesta.body.data.rol).toBe('recepcionista');
    expect(respuesta.body.data.password).toBeUndefined();
  });

  it('POST sin token devuelve 401', async () => {
    const respuesta = await request(app)
      .post('/api/usuarios')
      .send({ nombre: 'X', correo: 'x@prueba.com', password: 'X1abcdeff', rol: 'cliente' });

    expect(respuesta.status).toBe(401);
  });

  it('POST con rol no administrador devuelve 403', async () => {
    const tokenRecep = await tokenDe('recepcion-contrato@prueba.com');
    const respuesta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ nombre: 'X', correo: 'x2@prueba.com', password: 'X1abcdeff', rol: 'cliente' });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.message).toContain('permisos');
  });

  it('POST con contraseña débil devuelve 400', async () => {
    const respuesta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Débil', correo: 'debil@prueba.com', password: 'abc123', rol: 'cliente' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.ok).toBe(false);
  });

  it('POST con rol fuera del catálogo devuelve 400', async () => {
    const respuesta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Rol', correo: 'rol@prueba.com', password: 'NuevaClave1', rol: 'superadmin' });

    expect(respuesta.status).toBe(400);
  });

  it('POST con correo duplicado devuelve 409', async () => {
    const respuesta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Duplicado',
        correo: 'nuevo@prueba.com',
        password: 'NuevaClave1',
        rol: 'cliente',
      });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.message).toContain('registrado');
  });

  it('GET con administrador devuelve 200 y el listado sin contraseñas', async () => {
    const respuesta = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(Array.isArray(respuesta.body.data)).toBe(true);
    expect(respuesta.body.data.length).toBeGreaterThanOrEqual(2);
    expect(respuesta.body.data[0].password).toBeUndefined();
  });
});
