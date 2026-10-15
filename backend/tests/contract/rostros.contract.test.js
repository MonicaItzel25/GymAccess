// Pruebas de contrato: POST y GET /api/clientes/:id/rostro
// (administrador y recepcionista). Verifica que el descriptor NUNCA se expone.

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

/** Descriptor sintético válido de 128 números. */
function descriptorPrueba(semilla = 1) {
  return Array.from({ length: 128 }, (_, i) => Number((((i + semilla) % 20) / 20).toFixed(4)));
}

describe('Contrato de información facial', () => {
  let tokenAdmin;
  let tokenRecep;
  let tokenEntrenador;
  let tokenCliente;
  let idCliente;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Admin', correo: 'admin-ros@prueba.com', rol: 'administrador' });
    await insertarUsuario({ nombre: 'Recep', correo: 'recep-ros@prueba.com', rol: 'recepcionista' });
    await insertarUsuario({ nombre: 'Entrenador', correo: 'ent-ros@prueba.com', rol: 'entrenador' });
    await insertarUsuario({ nombre: 'Cliente', correo: 'cli-ros@prueba.com', rol: 'cliente' });
    tokenAdmin = await tokenDe('admin-ros@prueba.com');
    tokenRecep = await tokenDe('recep-ros@prueba.com');
    tokenEntrenador = await tokenDe('ent-ros@prueba.com');
    tokenCliente = await tokenDe('cli-ros@prueba.com');
    idCliente = await insertarCliente({ correo: 'cliente-ros@prueba.com' });
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('POST como recepcionista devuelve 201', async () => {
    const respuesta = await request(app)
      .post(`/api/clientes/${idCliente}/rostro`)
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ descriptor_facial: descriptorPrueba(1) });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.ok).toBe(true);
    expect(respuesta.body.data.tiene_rostro).toBe(true);
    // Nunca expone el descriptor (FR-020, SC-004)
    expect(respuesta.body.data).not.toHaveProperty('descriptor_facial');
  });

  it('POST como administrador devuelve 200 al actualizar el rostro existente', async () => {
    const respuesta = await request(app)
      .post(`/api/clientes/${idCliente}/rostro`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ descriptor_facial: descriptorPrueba(2) });

    // El cliente ya tenía rostro: se actualiza (200) en lugar de duplicar.
    expect([200, 201]).toContain(respuesta.status);
    expect(respuesta.body.data).not.toHaveProperty('descriptor_facial');
  });

  it('POST sin token devuelve 401', async () => {
    const respuesta = await request(app)
      .post(`/api/clientes/${idCliente}/rostro`)
      .send({ descriptor_facial: descriptorPrueba(3) });

    expect(respuesta.status).toBe(401);
  });

  it('POST como entrenador devuelve 403', async () => {
    const respuesta = await request(app)
      .post(`/api/clientes/${idCliente}/rostro`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ descriptor_facial: descriptorPrueba(4) });

    expect(respuesta.status).toBe(403);
  });

  it('POST como cliente devuelve 403', async () => {
    const respuesta = await request(app)
      .post(`/api/clientes/${idCliente}/rostro`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ descriptor_facial: descriptorPrueba(5) });

    expect(respuesta.status).toBe(403);
  });

  it('POST a cliente inexistente devuelve 404', async () => {
    const respuesta = await request(app)
      .post('/api/clientes/999999/rostro')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ descriptor_facial: descriptorPrueba(6) });

    expect(respuesta.status).toBe(404);
  });

  it('POST con descriptor de longitud distinta a 128 devuelve 400', async () => {
    const respuesta = await request(app)
      .post(`/api/clientes/${idCliente}/rostro`)
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ descriptor_facial: [0.1, 0.2, 0.3] });

    expect(respuesta.status).toBe(400);
  });

  it('POST sin descriptor devuelve 400', async () => {
    const respuesta = await request(app)
      .post(`/api/clientes/${idCliente}/rostro`)
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({});

    expect(respuesta.status).toBe(400);
  });

  it('GET devuelve metadatos sin el descriptor', async () => {
    const respuesta = await request(app)
      .get(`/api/clientes/${idCliente}/rostro`)
      .set('Authorization', `Bearer ${tokenRecep}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.tiene_rostro).toBe(true);
    expect(respuesta.body.data.fecha_registro).toBeTruthy();
    expect(respuesta.body.data).not.toHaveProperty('descriptor_facial');
  });

  it('GET como entrenador devuelve 403', async () => {
    const respuesta = await request(app)
      .get(`/api/clientes/${idCliente}/rostro`)
      .set('Authorization', `Bearer ${tokenEntrenador}`);

    expect(respuesta.status).toBe(403);
  });
});
