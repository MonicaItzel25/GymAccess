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
  let idAdmin;
  let idObjetivo;

  beforeAll(async () => {
    await vaciarTablas();
    idAdmin = await insertarUsuario({
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

  // --- Último administrador activo (FR-014, SC-002, A10) — T018 ---

  it('PUT de estado inactivo sobre el único administrador activo devuelve 409', async () => {
    const respuesta = await request(app)
      .put(`/api/usuarios/${idAdmin}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'inactivo' });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.ok).toBe(false);
    expect(respuesta.body.message).toBe(
      'no se puede modificar al único administrador activo'
    );
  });

  it('PUT de rol distinto de administrador sobre el único administrador activo devuelve 409', async () => {
    const respuesta = await request(app)
      .put(`/api/usuarios/${idAdmin}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ rol: 'entrenador' });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.message).toBe(
      'no se puede modificar al único administrador activo'
    );
  });

  it('PUT mixto sobre el único administrador no cambia su rol (barrera FR-014)', async () => {
    const respuesta = await request(app)
      .put(`/api/usuarios/${idAdmin}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Admin Roles Editado', rol: 'entrenador' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.rol).toBe('administrador');
    expect(respuesta.body.data.nombre).toBe('Admin Roles Editado');
  });

  it('con dos administradores activos, desactivar uno devuelve 200 (SC-002)', async () => {
    const idAdmin2 = await insertarUsuario({
      nombre: 'Admin Dos',
      correo: 'admin2-roles@prueba.com',
      rol: 'administrador',
    });
    const respuesta = await request(app)
      .put(`/api/usuarios/${idAdmin2}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'inactivo' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.estado).toBe('inactivo');
  });
});
