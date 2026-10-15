// Pruebas de contrato: PUT /api/clientes/:id (modificación de clientes).

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

describe('Contrato de modificación de clientes', () => {
  let tokenAdmin;
  let tokenRecep;
  let tokenEntrenador;
  let idCliente;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Admin', correo: 'admin-ed@prueba.com', rol: 'administrador' });
    await insertarUsuario({ nombre: 'Recep', correo: 'recep-ed@prueba.com', rol: 'recepcionista' });
    await insertarUsuario({ nombre: 'Entrenador', correo: 'ent-ed@prueba.com', rol: 'entrenador' });
    tokenAdmin = await tokenDe('admin-ed@prueba.com');
    tokenRecep = await tokenDe('recep-ed@prueba.com');
    tokenEntrenador = await tokenDe('ent-ed@prueba.com');
    idCliente = await insertarCliente({ correo: 'editar@prueba.com' });
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('PUT como recepcionista modifica el teléfono y devuelve 200', async () => {
    const respuesta = await request(app)
      .put(`/api/clientes/${idCliente}`)
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ telefono: '555-9999' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.telefono).toBe('555-9999');
  });

  it('PUT como administrador modifica campos y devuelve 200', async () => {
    const respuesta = await request(app)
      .put(`/api/clientes/${idCliente}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ direccion: 'Nueva dirección 100', estado: 'inactivo' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.direccion).toBe('Nueva dirección 100');
    expect(respuesta.body.data.estado).toBe('inactivo');
  });

  it('PUT como entrenador devuelve 403', async () => {
    const respuesta = await request(app)
      .put(`/api/clientes/${idCliente}`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ telefono: '555-0001' });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.message).toContain('permisos');
  });

  it('PUT con identificador inexistente devuelve 404', async () => {
    const respuesta = await request(app)
      .put('/api/clientes/999999')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ telefono: '555-0002' });

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.message).toContain('no encontrado');
  });

  it('PUT con nombre demasiado corto devuelve 400', async () => {
    const respuesta = await request(app)
      .put(`/api/clientes/${idCliente}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'A' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.ok).toBe(false);
  });

  it('PUT con correo duplicado de otro cliente devuelve 409', async () => {
    await insertarCliente({ correo: 'otro@prueba.com' });

    const respuesta = await request(app)
      .put(`/api/clientes/${idCliente}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ correo: 'otro@prueba.com' });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.message).toContain('registrado');
  });
});
