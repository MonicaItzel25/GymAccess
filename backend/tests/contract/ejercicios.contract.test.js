// Pruebas de contrato: catálogo de ejercicios (US-S3-08, Sprint 3).
// Escritura (POST/PUT): solo administrador (FR-011, Clarification Q2).
// Lectura: administrador y entrenador; el entrenador SIEMPRE recibe solo los
// ejercicios activos (FR-012). Nombre único con mensaje claro (data-model §3).
// Matriz de denegaciones §10.

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

describe('Contrato de ejercicios', () => {
  let tokenAdmin;
  let tokenRecep;
  let tokenEntrenador;
  let tokenCliente;
  let idPress;
  let idSentadilla;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Admin Catalogo', correo: 'admin-eje@prueba.com', rol: 'administrador' });
    await insertarUsuario({ nombre: 'Recep Catalogo', correo: 'recep-eje@prueba.com', rol: 'recepcionista' });
    await insertarUsuario({ nombre: 'Entrenador Catalogo', correo: 'ent-eje@prueba.com', rol: 'entrenador' });
    await insertarUsuario({ nombre: 'Cliente Catalogo', correo: 'cli-eje@prueba.com', rol: 'cliente' });
    tokenAdmin = await tokenDe('admin-eje@prueba.com');
    tokenRecep = await tokenDe('recep-eje@prueba.com');
    tokenEntrenador = await tokenDe('ent-eje@prueba.com');
    tokenCliente = await tokenDe('cli-eje@prueba.com');
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('POST como administrador crea el ejercicio (201) con estado activo', async () => {
    const respuesta = await request(app)
      .post('/api/ejercicios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Press de banca', descripcion: 'Empuje horizontal con barra', grupo_muscular: 'Pecho' });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.data.id_ejercicio).toBeTruthy();
    expect(respuesta.body.data.nombre).toBe('Press de banca');
    expect(respuesta.body.data.descripcion).toBe('Empuje horizontal con barra');
    expect(respuesta.body.data.grupo_muscular).toBe('Pecho');
    expect(respuesta.body.data.estado).toBe('activo');
    idPress = respuesta.body.data.id_ejercicio;
  });

  it('POST con nombre duplicado devuelve 400 con mensaje claro', async () => {
    const respuesta = await request(app)
      .post('/api/ejercicios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Press de banca', descripcion: 'Otra descripción' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toContain('Ya existe un ejercicio con ese nombre');
  });

  it('POST con nombre o descripción vacíos devuelve 400 (validación de campos)', async () => {
    const sinNombre = await request(app)
      .post('/api/ejercicios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: '', descripcion: 'Descripción válida' });
    const sinDescripcion = await request(app)
      .post('/api/ejercicios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Extensiones de pierna', descripcion: '' });

    expect(sinNombre.status).toBe(400);
    expect(sinDescripcion.status).toBe(400);
  });

  it('POST como recepcionista o cliente devuelve 403 (US-S3-08.4)', async () => {
    const comoRecep = await request(app)
      .post('/api/ejercicios')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ nombre: 'Recepción no debe', descripcion: 'Denegado' });
    const comoCliente = await request(app)
      .post('/api/ejercicios')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ nombre: 'Cliente no debe', descripcion: 'Denegado' });

    expect(comoRecep.status).toBe(403);
    expect(comoCliente.status).toBe(403);
  });

  it('POST como entrenador devuelve 403 (US-S3-08.5, Clarification Q2)', async () => {
    const respuesta = await request(app)
      .post('/api/ejercicios')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ nombre: 'Entrenador no debe', descripcion: 'Denegado' });

    expect(respuesta.status).toBe(403);
  });

  it('el entrenador solo recibe ejercicios activos, incluso con ?estado= (FR-012)', async () => {
    // Sentadilla queda activa; Press se desactiva para comprobar el filtro.
    const sentadilla = await request(app)
      .post('/api/ejercicios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Sentadilla', descripcion: 'Empuje inferior con barra', grupo_muscular: 'Pierna' });
    idSentadilla = sentadilla.body.data.id_ejercicio;

    await request(app)
      .put(`/api/ejercicios/${idPress}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'inactivo' });

    const porDefecto = await request(app)
      .get('/api/ejercicios')
      .set('Authorization', `Bearer ${tokenEntrenador}`);
    const conInactivo = await request(app)
      .get('/api/ejercicios?estado=inactivo')
      .set('Authorization', `Bearer ${tokenEntrenador}`);
    const conTodos = await request(app)
      .get('/api/ejercicios?estado=todos')
      .set('Authorization', `Bearer ${tokenEntrenador}`);

    for (const respuesta of [porDefecto, conInactivo, conTodos]) {
      expect(respuesta.status).toBe(200);
      const nombres = respuesta.body.data.map((e) => e.nombre);
      expect(nombres).toContain('Sentadilla');
      expect(nombres).not.toContain('Press de banca');
      for (const ejercicio of respuesta.body.data) {
        expect(ejercicio.estado).toBe('activo');
      }
    }
  });

  it('el entrenador recibe el ejercicio completo (nombre, descripción y grupo muscular)', async () => {
    const respuesta = await request(app)
      .get('/api/ejercicios')
      .set('Authorization', `Bearer ${tokenEntrenador}`);

    const sentadilla = respuesta.body.data.find((e) => e.id_ejercicio === idSentadilla);
    expect(sentadilla.descripcion).toBe('Empuje inferior con barra');
    expect(sentadilla.grupo_muscular).toBe('Pierna');
  });

  it('el administrador lista inactivos con ?estado=inactivo y el catálogo completo con ?estado=todos', async () => {
    const inactivos = await request(app)
      .get('/api/ejercicios?estado=inactivo')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    const todos = await request(app)
      .get('/api/ejercicios?estado=todos')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(inactivos.body.data.map((e) => e.nombre)).toContain('Press de banca');
    expect(todos.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('PUT /:id como administrador modifica los campos (200)', async () => {
    const respuesta = await request(app)
      .put(`/api/ejercicios/${idSentadilla}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ descripcion: 'Empuje inferior con barra alta' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.descripcion).toBe('Empuje inferior con barra alta');
    expect(respuesta.body.data.nombre).toBe('Sentadilla'); // conservado
  });

  it('PUT /:id con nombre duplicado de otro ejercicio devuelve 400', async () => {
    const respuesta = await request(app)
      .put(`/api/ejercicios/${idSentadilla}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Press de banca' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toContain('Ya existe un ejercicio con ese nombre');
  });

  it('PUT /:id/estado reactiva el ejercicio y persiste (FR-011)', async () => {
    const respuesta = await request(app)
      .put(`/api/ejercicios/${idPress}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'activo' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.estado).toBe('activo');

    const lista = await request(app)
      .get('/api/ejercicios')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(lista.body.data.map((e) => e.nombre)).toContain('Press de banca');
  });

  it('PUT /:id con identificador inexistente devuelve 404', async () => {
    const respuesta = await request(app)
      .put('/api/ejercicios/999999')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'No existe' });

    expect(respuesta.status).toBe(404);
  });

  it('PUT y PUT /:id/estado como recepcionista, entrenador o cliente devuelven 403', async () => {
    const putRecep = await request(app)
      .put(`/api/ejercicios/${idPress}`)
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ nombre: 'Rechazado' });
    const estadoEntrenador = await request(app)
      .put(`/api/ejercicios/${idPress}/estado`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ estado: 'inactivo' });
    const putCliente = await request(app)
      .put(`/api/ejercicios/${idPress}`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ nombre: 'Rechazado' });

    expect(putRecep.status).toBe(403);
    expect(estadoEntrenador.status).toBe(403);
    expect(putCliente.status).toBe(403);
  });

  it('GET como recepcionista o cliente devuelve 403 (matriz §10)', async () => {
    const comoRecep = await request(app)
      .get('/api/ejercicios')
      .set('Authorization', `Bearer ${tokenRecep}`);
    const comoCliente = await request(app)
      .get('/api/ejercicios')
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(comoRecep.status).toBe(403);
    expect(comoCliente.status).toBe(403);
  });
});
