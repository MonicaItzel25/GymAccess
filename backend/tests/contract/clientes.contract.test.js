// Pruebas de contrato: POST /api/clientes (administrador y recepcionista).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import {
  vaciarTablas,
  insertarUsuario,
  insertarCliente,
  cerrarPool,
} from '../helpers/baseDatos.js';

const app = crearApp();

async function tokenDe(correo) {
  const respuesta = await request(app)
    .post('/api/auth/login')
    .send({ correo, password: 'Prueba1234' });
  return respuesta.body.data.token;
}

describe('Contrato de registro de clientes', () => {
  let tokenAdmin;
  let tokenRecep;
  let tokenEntrenador;
  let tokenCliente;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Admin', correo: 'admin-cli@prueba.com', rol: 'administrador' });
    await insertarUsuario({ nombre: 'Recep', correo: 'recep-cli@prueba.com', rol: 'recepcionista' });
    await insertarUsuario({ nombre: 'Entrenador', correo: 'ent-cli@prueba.com', rol: 'entrenador' });
    await insertarUsuario({ nombre: 'Cliente', correo: 'cli-cli@prueba.com', rol: 'cliente' });
    tokenAdmin = await tokenDe('admin-cli@prueba.com');
    tokenRecep = await tokenDe('recep-cli@prueba.com');
    tokenEntrenador = await tokenDe('ent-cli@prueba.com');
    tokenCliente = await tokenDe('cli-cli@prueba.com');
    await insertarCliente({ correo: 'existente@prueba.com' });
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('POST como recepcionista devuelve 201', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({
        nombre: 'María',
        apellido: 'López',
        correo: 'maria@prueba.com',
        telefono: '555-1111',
      });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.ok).toBe(true);
    expect(respuesta.body.data.apellido).toBe('López');
  });

  it('POST como administrador devuelve 201', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Juan', apellido: 'Pérez', correo: 'juan@prueba.com' });

    expect(respuesta.status).toBe(201);
  });

  it('POST como entrenador devuelve 403', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ nombre: 'Ana', apellido: 'Torres' });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.message).toContain('permisos');
  });

  it('POST como cliente devuelve 403', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ nombre: 'Eva', apellido: 'Ruiz' });

    expect(respuesta.status).toBe(403);
  });

  it('POST sin nombre devuelve 400', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ apellido: 'SinNombre' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.ok).toBe(false);
  });

  it('POST con correo inválido devuelve 400', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ nombre: 'Raro', apellido: 'Correos', correo: 'no-es-correo' });

    expect(respuesta.status).toBe(400);
  });

  it('POST con correo duplicado devuelve 409', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ nombre: 'Duplicado', apellido: 'Correo', correo: 'existente@prueba.com' });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.message).toContain('registrado');
  });
});
