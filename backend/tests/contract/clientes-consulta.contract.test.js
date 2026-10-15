// Pruebas de contrato: GET /api/clientes y GET /api/clientes/:id.
// Verifica permisos por rol, proyección de campos del entrenador,
// búsqueda por fragmento y la ausencia de paginación (FR-029).

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

describe('Contrato de consulta de clientes', () => {
  let tokenAdmin;
  let tokenRecep;
  let tokenEntrenador;
  let tokenCliente;
  let idBuscado;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Admin', correo: 'admin-consulta@prueba.com', rol: 'administrador' });
    await insertarUsuario({ nombre: 'Recep', correo: 'recep-consulta@prueba.com', rol: 'recepcionista' });
    await insertarUsuario({ nombre: 'Entrenador', correo: 'ent-consulta@prueba.com', rol: 'entrenador' });
    await insertarUsuario({ nombre: 'Cliente', correo: 'cli-consulta@prueba.com', rol: 'cliente' });
    tokenAdmin = await tokenDe('admin-consulta@prueba.com');
    tokenRecep = await tokenDe('recep-consulta@prueba.com');
    tokenEntrenador = await tokenDe('ent-consulta@prueba.com');
    tokenCliente = await tokenDe('cli-consulta@prueba.com');

    await insertarCliente({ nombre: 'Lucía', apellido: 'Herrera', correo: 'lucia@prueba.com', telefono: '555-3001' });
    idBuscado = await insertarCliente({ nombre: 'Marcos', apellido: 'Zúñiga', correo: 'marcos@prueba.com' });
    await insertarCliente({ nombre: 'Ana', apellido: 'Herrera', correo: 'ana@prueba.com' });
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('devuelve 200 para administrador, recepcionista y entrenador', async () => {
    for (const token of [tokenAdmin, tokenRecep, tokenEntrenador]) {
      const respuesta = await request(app)
        .get('/api/clientes')
        .set('Authorization', `Bearer ${token}`);
      expect(respuesta.status).toBe(200);
      expect(Array.isArray(respuesta.body.data)).toBe(true);
    }
  });

  it('responde 401 sin token', async () => {
    const respuesta = await request(app).get('/api/clientes');
    expect(respuesta.status).toBe(401);
  });

  it('responde 403 para el rol cliente', async () => {
    const respuesta = await request(app)
      .get('/api/clientes')
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(respuesta.status).toBe(403);
  });

  it('el entrenador recibe solo campos básicos (sin correo ni dirección)', async () => {
    const respuesta = await request(app)
      .get('/api/clientes')
      .set('Authorization', `Bearer ${tokenEntrenador}`);

    expect(respuesta.status).toBe(200);
    for (const cliente of respuesta.body.data) {
      expect(Object.keys(cliente).sort()).toEqual(
        ['apellido', 'estado', 'id_cliente', 'nombre', 'telefono'].sort()
      );
      expect(cliente.correo).toBeUndefined();
      expect(cliente.direccion).toBeUndefined();
    }
  });

  it('el administrador recibe todos los campos', async () => {
    const respuesta = await request(app)
      .get('/api/clientes')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    const primero = respuesta.body.data[0];
    expect(primero.correo).toBeDefined();
    expect(primero.direccion !== undefined).toBe(true);
    expect(primero.fecha_registro).toBeDefined();
  });

  it('el parámetro ?buscar= filtra por fragmento de nombre o apellido', async () => {
    const respuesta = await request(app)
      .get('/api/clientes?buscar=herrera')
      .set('Authorization', `Bearer ${tokenRecep}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data).toHaveLength(2);
    for (const cliente of respuesta.body.data) {
      expect(cliente.apellido).toBe('Herrera');
    }
  });

  it('la búsqueda sin resultados devuelve lista vacía (sin paginación)', async () => {
    const respuesta = await request(app)
      .get('/api/clientes?buscar=zzzznoexiste')
      .set('Authorization', `Bearer ${tokenRecep}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data).toEqual([]);
  });

  it('GET /api/clientes/:id devuelve el cliente a los roles autorizados', async () => {
    const respuesta = await request(app)
      .get(`/api/clientes/${idBuscado}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.id_cliente).toBe(idBuscado);
    expect(respuesta.body.data.correo).toBe('marcos@prueba.com');
  });

  it('GET /api/clientes/:id devuelve 403 al rol cliente', async () => {
    const respuesta = await request(app)
      .get(`/api/clientes/${idBuscado}`)
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(respuesta.status).toBe(403);
  });

  it('GET /api/clientes/:id inexistente devuelve 404', async () => {
    const respuesta = await request(app)
      .get('/api/clientes/999999')
      .set('Authorization', `Bearer ${tokenRecep}`);

    expect(respuesta.status).toBe(404);
  });

  it('el entrenador recibe solo campos básicos en GET /api/clientes/:id (A16)', async () => {
    const respuesta = await request(app)
      .get(`/api/clientes/${idBuscado}`)
      .set('Authorization', `Bearer ${tokenEntrenador}`);

    expect(respuesta.status).toBe(200);
    expect(Object.keys(respuesta.body.data).sort()).toEqual(
      ['apellido', 'estado', 'id_cliente', 'nombre', 'telefono'].sort()
    );
    expect(respuesta.body.data.correo).toBeUndefined();
    expect(respuesta.body.data.direccion).toBeUndefined();
    expect(respuesta.body.data.fecha_registro).toBeUndefined();
  });
});
