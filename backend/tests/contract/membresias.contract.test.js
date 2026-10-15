// Pruebas de contrato: POST /api/membresias (administrador y recepcionista)
// y GET /api/membresias (administrador, recepcionista, entrenador).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { obtenerPool } from '../../src/config/db.js';
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

/** Crea un tipo de membresía de prueba directamente en la base de datos. */
async function crearTipoPrueba({ nombre = 'Tipo Contrato', duracion = 30, precio = 500 } = {}) {
  const [resultado] = await obtenerPool().execute(
    'INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado) VALUES (?, ?, ?, ?, ?)',
    [nombre, 'Tipo para pruebas de contrato', duracion, precio, 'activo']
  );
  return resultado.insertId;
}

describe('Contrato de asignación de membresías', () => {
  let tokenAdmin;
  let tokenRecep;
  let tokenEntrenador;
  let tokenCliente;
  let idCliente;
  let idTipo;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Admin', correo: 'admin-mem@prueba.com', rol: 'administrador' });
    await insertarUsuario({ nombre: 'Recep', correo: 'recep-mem@prueba.com', rol: 'recepcionista' });
    await insertarUsuario({ nombre: 'Entrenador', correo: 'ent-mem@prueba.com', rol: 'entrenador' });
    await insertarUsuario({ nombre: 'Cliente', correo: 'cli-mem@prueba.com', rol: 'cliente' });
    tokenAdmin = await tokenDe('admin-mem@prueba.com');
    tokenRecep = await tokenDe('recep-mem@prueba.com');
    tokenEntrenador = await tokenDe('ent-mem@prueba.com');
    tokenCliente = await tokenDe('cli-mem@prueba.com');
    idCliente = await insertarCliente({ correo: 'cliente-mem@prueba.com' });
    idTipo = await crearTipoPrueba();
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('POST como recepcionista devuelve 201', async () => {
    const respuesta = await request(app)
      .post('/api/membresias')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ id_cliente: idCliente, id_tipo_membresia: idTipo });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.ok).toBe(true);
    expect(respuesta.body.data.estado).toBe('activa');
  });

  it('POST como administrador devuelve 201', async () => {
    const idOtro = await insertarCliente({ correo: 'otro-mem@prueba.com' });
    const respuesta = await request(app)
      .post('/api/membresias')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_cliente: idOtro, id_tipo_membresia: idTipo });

    expect(respuesta.status).toBe(201);
  });

  it('POST sin token devuelve 401', async () => {
    const respuesta = await request(app)
      .post('/api/membresias')
      .send({ id_cliente: idCliente, id_tipo_membresia: idTipo });

    expect(respuesta.status).toBe(401);
  });

  it('POST como entrenador devuelve 403', async () => {
    const respuesta = await request(app)
      .post('/api/membresias')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ id_cliente: idCliente, id_tipo_membresia: idTipo });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.message).toContain('permisos');
  });

  it('POST como cliente devuelve 403', async () => {
    const respuesta = await request(app)
      .post('/api/membresias')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ id_cliente: idCliente, id_tipo_membresia: idTipo });

    expect(respuesta.status).toBe(403);
  });

  it('POST con cliente inexistente devuelve 404', async () => {
    const respuesta = await request(app)
      .post('/api/membresias')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ id_cliente: 999999, id_tipo_membresia: idTipo });

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.message).toContain('Cliente');
  });

  it('POST con tipo de membresía inexistente devuelve 404', async () => {
    const respuesta = await request(app)
      .post('/api/membresias')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ id_cliente: idCliente, id_tipo_membresia: 999999 });

    expect(respuesta.status).toBe(404);
  });

  it('POST sin id_cliente devuelve 400', async () => {
    const respuesta = await request(app)
      .post('/api/membresias')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ id_tipo_membresia: idTipo });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.ok).toBe(false);
  });

  it('GET como entrenador devuelve 200', async () => {
    const respuesta = await request(app)
      .get('/api/membresias')
      .set('Authorization', `Bearer ${tokenEntrenador}`);

    expect(respuesta.status).toBe(200);
    expect(Array.isArray(respuesta.body.data)).toBe(true);
  });

  it('GET como cliente devuelve 403', async () => {
    const respuesta = await request(app)
      .get('/api/membresias')
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(respuesta.status).toBe(403);
  });
});
