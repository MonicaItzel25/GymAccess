// Pruebas de contrato: PUT /api/usuarios/:id (asignación de roles y estado).

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

describe('Contrato de asignación de roles', () => {
  let tokenAdmin;
  let idObjetivo;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({
      nombre: 'Admin Roles',
      correo: 'admin-roles@prueba.com',
      rol: 'administrador',
    });
    idObjetivo = await insertarUsuario({
      nombre: 'Empleado',
      correo: 'empleado@prueba.com',
      rol: 'recepcionista',
    });
    tokenAdmin = await tokenDe('admin-roles@prueba.com');
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('PUT con administrador cambia el rol y devuelve 200', async () => {
    const respuesta = await request(app)
      .put(`/api/usuarios/${idObjetivo}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ rol: 'entrenador' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.rol).toBe('entrenador');
  });

  it('PUT con rol no administrador devuelve 403', async () => {
    const tokenEmpleado = await tokenDe('empleado@prueba.com');
    const respuesta = await request(app)
      .put(`/api/usuarios/${idObjetivo}`)
      .set('Authorization', `Bearer ${tokenEmpleado}`)
      .send({ rol: 'administrador' });

    expect(respuesta.status).toBe(403);
  });

  it('PUT con rol fuera del catálogo devuelve 400', async () => {
    const respuesta = await request(app)
      .put(`/api/usuarios/${idObjetivo}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ rol: 'superadmin' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toContain('rol');
  });

  it('PUT con identificador inexistente devuelve 404', async () => {
    const respuesta = await request(app)
      .put('/api/usuarios/999999')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ rol: 'cliente' });

    expect(respuesta.status).toBe(404);
  });

  it('PUT con estado válido activa o desactiva la cuenta', async () => {
    const respuesta = await request(app)
      .put(`/api/usuarios/${idObjetivo}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'inactivo' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.estado).toBe('inactivo');
  });
});
