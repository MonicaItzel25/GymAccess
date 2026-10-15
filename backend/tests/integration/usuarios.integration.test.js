// Pruebas de integración: gestión de usuarios del administrador.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { crearApp } from '../../src/app.js';
import { consultar } from '../../src/config/db.js';
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

describe('Integración de gestión de usuarios', () => {
  let tokenAdmin;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({
      nombre: 'Admin Integración',
      correo: 'admin-int@prueba.com',
      rol: 'administrador',
    });
    tokenAdmin = await tokenDe('admin-int@prueba.com');
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('el usuario creado puede iniciar sesión con su contraseña', async () => {
    const creacion = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Nuevo Ingreso',
        correo: 'ingreso@prueba.com',
        password: 'IngresoClave1',
        rol: 'entrenador',
      });

    expect(creacion.status).toBe(201);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'ingreso@prueba.com', password: 'IngresoClave1' });

    expect(login.status).toBe(200);
    expect(login.body.data.usuario.rol).toBe('entrenador');
  });

  it('almacena la contraseña como hash y nunca en texto plano', async () => {
    const filas = await consultar(
      'SELECT password FROM usuarios WHERE correo = ?',
      ['ingreso@prueba.com']
    );

    expect(filas).toHaveLength(1);
    const guardado = filas[0].password;
    expect(guardado).not.toBe('IngresoClave1');
    expect(guardado.startsWith('$2')).toBe(true);

    const coincide = await bcrypt.compare('IngresoClave1', guardado);
    expect(coincide).toBe(true);
  });

  it('el listado de usuarios no incluye contraseñas', async () => {
    const respuesta = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    for (const usuario of respuesta.body.data) {
      expect(usuario.password).toBeUndefined();
    }
  });

  it('responde 404 al consultar un usuario inexistente', async () => {
    const respuesta = await request(app)
      .get('/api/usuarios/999999')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(404);
  });

  it('normaliza el correo con espacios al crear y modificar usuarios (FR-007)', async () => {
    const creacion = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Correo Espacios',
        correo: '  ESPACIOS@PRUEBA.COM  ',
        password: 'EspaciosClave1',
        rol: 'recepcionista',
      });

    expect(creacion.status).toBe(201);

    const guardado = await consultar(
      'SELECT id_usuario, correo FROM usuarios ORDER BY id_usuario DESC LIMIT 1'
    );
    expect(guardado[0].correo).toBe('espacios@prueba.com');

    const modificacion = await request(app)
      .put(`/api/usuarios/${guardado[0].id_usuario}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ correo: '  MODIFICA@PRUEBA.COM  ' });

    expect(modificacion.status).toBe(200);

    const trasModificacion = await consultar(
      'SELECT correo FROM usuarios WHERE id_usuario = ?',
      [guardado[0].id_usuario]
    );
    expect(trasModificacion[0].correo).toBe('modifica@prueba.com');
  });
});
