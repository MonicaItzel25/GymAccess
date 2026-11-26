// Pruebas de contrato: rutinas de entrenamiento (US-S3-03, Sprint 3).
// Recurso EXCLUSIVO del entrenador (contrato §4): recepcionista, cliente y
// administrador → 403. Requiere asignación vigente con el cliente (FR-014,
// RN-005), aunque la rutina la haya creado otro entrenador (Q1/FR-017);
// entrenador desactivado → 403 (FR-003). Ejercicio inactivo no entra en
// rutinas nuevas (RN-008, US-S3-03.3). Parámetros por fila validados
// (research R-10). Una sola rutina activa por cliente (Q5).

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

/** Fila de ejercicio válida para el cuerpo de POST/PUT de rutinas. */
function filaEjercicio(overrides = {}) {
  return {
    id_ejercicio: 1,
    orden: 1,
    series: 4,
    repeticiones: 8,
    peso_recomendado: 60,
    descanso_segundos: 90,
    instrucciones: 'Bajar controlado hasta el pecho',
    ...overrides,
  };
}

describe('Contrato de rutinas de entrenamiento', () => {
  let tokenAdmin;
  let tokenRecep;
  let tokenEntrenador;
  let tokenEntrenador2;
  let tokenCliente;
  let idCliente;
  let idClienteSinAsignar;
  let idEntrenador;
  let idEntrenador2;
  let idCuentaEntrenador;
  let idPress;
  let idSentadilla;
  let idRutina;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Admin Rutinas', correo: 'admin-rut@prueba.com', rol: 'administrador' });
    await insertarUsuario({ nombre: 'Recep Rutinas', correo: 'recep-rut@prueba.com', rol: 'recepcionista' });
    idCuentaEntrenador = await insertarUsuario({ nombre: 'Entrenador Uno', correo: 'ent-rut@prueba.com', rol: 'entrenador' });
    const idCuentaEntrenador2 = await insertarUsuario({ nombre: 'Entrenador Dos', correo: 'ent2-rut@prueba.com', rol: 'entrenador' });
    await insertarUsuario({ nombre: 'Cliente Rutinas', correo: 'cli-rut@prueba.com', rol: 'cliente' });

    idCliente = await insertarCliente({ nombre: 'Ana', apellido: 'Rutina', correo: 'ana-rut@prueba.com' });
    idClienteSinAsignar = await insertarCliente({ nombre: 'Bruno', apellido: 'SinAsignar', correo: 'bruno-rut@prueba.com' });

    tokenAdmin = await tokenDe('admin-rut@prueba.com');
    tokenRecep = await tokenDe('recep-rut@prueba.com');
    tokenEntrenador = await tokenDe('ent-rut@prueba.com');
    tokenEntrenador2 = await tokenDe('ent2-rut@prueba.com');
    tokenCliente = await tokenDe('cli-rut@prueba.com');

    // Perfiles de entrenador creados por la API (Historia 1).
    const perfil1 = await request(app)
      .post('/api/entrenadores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_usuario: idCuentaEntrenador });
    idEntrenador = perfil1.body.data.id_entrenador;
    const perfil2 = await request(app)
      .post('/api/entrenadores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_usuario: idCuentaEntrenador2 });
    idEntrenador2 = perfil2.body.data.id_entrenador;

    // Asignación vigente entrenador 1 → Ana (Historia 2).
    await request(app)
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_cliente: idCliente, id_entrenador: idEntrenador });

    // Ejercicios del catálogo (Historia 3).
    const press = await request(app)
      .post('/api/ejercicios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Press de banca', descripcion: 'Empuje horizontal', grupo_muscular: 'Pecho' });
    idPress = press.body.data.id_ejercicio;
    const sentadilla = await request(app)
      .post('/api/ejercicios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Sentadilla', descripcion: 'Empuje inferior', grupo_muscular: 'Pierna' });
    idSentadilla = sentadilla.body.data.id_ejercicio;
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('POST con asignación vigente crea la rutina (201) en estado inactiva con sus ejercicios', async () => {
    const respuesta = await request(app)
      .post('/api/rutinas')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({
        id_cliente: idCliente,
        nombre: 'Semana 1 - Empuje',
        ejercicios: [filaEjercicio({ id_ejercicio: idPress })],
      });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.data.id_rutina).toBeTruthy();
    expect(respuesta.body.data.id_cliente).toBe(idCliente);
    expect(respuesta.body.data.id_entrenador).toBe(idEntrenador);
    expect(respuesta.body.data.nombre).toBe('Semana 1 - Empuje');
    expect(respuesta.body.data.estado).toBe('inactiva');
    expect(respuesta.body.data.fecha_creacion).toBeTruthy();
    expect(respuesta.body.data.ejercicios).toHaveLength(1);
    expect(respuesta.body.data.ejercicios[0].id_ejercicio).toBe(idPress);
    expect(respuesta.body.data.ejercicios[0].orden).toBe(1);
    expect(respuesta.body.data.ejercicios[0].series).toBe(4);
    expect(respuesta.body.data.ejercicios[0].repeticiones).toBe(8);
    idRutina = respuesta.body.data.id_rutina;
  });

  it('POST sin asignación vigente devuelve 403 con mensaje claro (US-S3-03.2)', async () => {
    const respuesta = await request(app)
      .post('/api/rutinas')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({
        id_cliente: idClienteSinAsignar,
        nombre: 'No autorizada',
        ejercicios: [filaEjercicio({ id_ejercicio: idPress })],
      });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.message).toContain('asignación vigente');
  });

  it('POST de un entrenador desactivado con asignación vigente devuelve 403 (FR-003)', async () => {
    await request(app)
      .put(`/api/entrenadores/${idEntrenador}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'inactivo' });

    const respuesta = await request(app)
      .post('/api/rutinas')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({
        id_cliente: idCliente,
        nombre: 'De entrenador inactivo',
        ejercicios: [filaEjercicio({ id_ejercicio: idPress })],
      });

    // Se reactiva el perfil para el resto de la suite.
    await request(app)
      .put(`/api/entrenadores/${idEntrenador}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'activo' });

    expect(respuesta.status).toBe(403);
  });

  it('POST con ejercicio inactivo devuelve 400 (US-S3-03.3, RN-008)', async () => {
    await request(app)
      .put(`/api/ejercicios/${idPress}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'inactivo' });

    const respuesta = await request(app)
      .post('/api/rutinas')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({
        id_cliente: idCliente,
        nombre: 'Con ejercicio desactivado',
        ejercicios: [filaEjercicio({ id_ejercicio: idPress })],
      });

    // Se reactiva el ejercicio para el resto de la suite.
    await request(app)
      .put(`/api/ejercicios/${idPress}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'activo' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toContain('desactivado');
  });

  it('POST con id_ejercicio inexistente devuelve 404', async () => {
    const respuesta = await request(app)
      .post('/api/rutinas')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({
        id_cliente: idCliente,
        nombre: 'Ejercicio fantasma',
        ejercicios: [filaEjercicio({ id_ejercicio: 999999 })],
      });

    expect(respuesta.status).toBe(404);
  });

  it('POST con parámetros inválidos devuelve 400 (FR-016, research R-10)', async () => {
    const cuerpo = {
      id_cliente: idCliente,
      nombre: 'Parámetros inválidos',
      ejercicios: [filaEjercicio({ id_ejercicio: idPress })],
    };
    const casos = [
      { ...cuerpo, ejercicios: [filaEjercicio({ id_ejercicio: idPress, series: 0 })] },
      { ...cuerpo, ejercicios: [filaEjercicio({ id_ejercicio: idPress, repeticiones: 0 })] },
      { ...cuerpo, ejercicios: [filaEjercicio({ id_ejercicio: idPress, peso_recomendado: -1 })] },
      { ...cuerpo, ejercicios: [filaEjercicio({ id_ejercicio: idPress, descanso_segundos: -1 })] },
      { ...cuerpo, ejercicios: [filaEjercicio({ id_ejercicio: idPress, instrucciones: '' })] },
      { ...cuerpo, nombre: '' },
      { ...cuerpo, ejercicios: [] },
    ];

    for (const cuerpoCaso of casos) {
      const respuesta = await request(app)
        .post('/api/rutinas')
        .set('Authorization', `Bearer ${tokenEntrenador}`)
        .send(cuerpoCaso);
      expect(respuesta.status).toBe(400);
    }
  });

  it('POST como recepcionista, cliente o administrador devuelve 403 (US-S3-03.5)', async () => {
    const cuerpo = {
      id_cliente: idCliente,
      nombre: 'Sin permiso',
      ejercicios: [filaEjercicio({ id_ejercicio: idPress })],
    };
    for (const token of [tokenRecep, tokenCliente, tokenAdmin]) {
      const respuesta = await request(app)
        .post('/api/rutinas')
        .set('Authorization', `Bearer ${token}`)
        .send(cuerpo);
      expect(respuesta.status).toBe(403);
    }
  });

  it('GET lista las rutinas de los clientes con asignación vigente; el otro entrenador recibe vacío (FR-017)', async () => {
    const delEntrenador = await request(app)
      .get('/api/rutinas')
      .set('Authorization', `Bearer ${tokenEntrenador}`);
    const delEntrenador2 = await request(app)
      .get('/api/rutinas')
      .set('Authorization', `Bearer ${tokenEntrenador2}`);
    const filtrada = await request(app)
      .get(`/api/rutinas?cliente=${idCliente}`)
      .set('Authorization', `Bearer ${tokenEntrenador}`);
    const deClienteSinAsignar = await request(app)
      .get(`/api/rutinas?cliente=${idClienteSinAsignar}`)
      .set('Authorization', `Bearer ${tokenEntrenador}`);

    expect(delEntrenador.status).toBe(200);
    expect(delEntrenador.body.data.map((r) => r.id_rutina)).toContain(idRutina);
    expect(delEntrenador2.status).toBe(200);
    expect(delEntrenador2.body.data).toHaveLength(0);
    expect(filtrada.body.data.map((r) => r.id_rutina)).toContain(idRutina);
    expect(deClienteSinAsignar.body.data).toHaveLength(0);
  });

  it('GET /:id devuelve el detalle con ejercicios; sin asignación vigente devuelve 403', async () => {
    const detalle = await request(app)
      .get(`/api/rutinas/${idRutina}`)
      .set('Authorization', `Bearer ${tokenEntrenador}`);
    const ajeno = await request(app)
      .get(`/api/rutinas/${idRutina}`)
      .set('Authorization', `Bearer ${tokenEntrenador2}`);
    const inexistente = await request(app)
      .get('/api/rutinas/999999')
      .set('Authorization', `Bearer ${tokenEntrenador}`);

    expect(detalle.status).toBe(200);
    expect(detalle.body.data.nombre).toBe('Semana 1 - Empuje');
    expect(detalle.body.data.ejercicios).toHaveLength(1);
    expect(detalle.body.data.ejercicios[0].instrucciones).toBe('Bajar controlado hasta el pecho');
    expect(ajeno.status).toBe(403);
    expect(inexistente.status).toBe(404);
  });

  it('PUT modifica nombre y lista de ejercicios (FR-017); con parámetros inválidos responde 400', async () => {
    const modificacion = await request(app)
      .put(`/api/rutinas/${idRutina}`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({
        nombre: 'Semana 2 - Pierna',
        ejercicios: [filaEjercicio({ id_ejercicio: idSentadilla, series: 3, repeticiones: 10, instrucciones: 'Descender hasta paralelo' })],
      });

    expect(modificacion.status).toBe(200);
    expect(modificacion.body.data.nombre).toBe('Semana 2 - Pierna');
    expect(modificacion.body.data.ejercicios).toHaveLength(1);
    expect(modificacion.body.data.ejercicios[0].id_ejercicio).toBe(idSentadilla);

    const invalida = await request(app)
      .put(`/api/rutinas/${idRutina}`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({
        ejercicios: [filaEjercicio({ id_ejercicio: idSentadilla, series: 0 })],
      });
    expect(invalida.status).toBe(400);

    const ajena = await request(app)
      .put(`/api/rutinas/${idRutina}`)
      .set('Authorization', `Bearer ${tokenEntrenador2}`)
      .send({ nombre: 'Intento ajeno' });
    expect(ajena.status).toBe(403);
  });

  it('PATCH /:id/estado activa y desactiva la rutina (200, FR-015)', async () => {
    const activar = await request(app)
      .patch(`/api/rutinas/${idRutina}/estado`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ estado: 'activa' });
    const desactivar = await request(app)
      .patch(`/api/rutinas/${idRutina}/estado`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ estado: 'inactiva' });
    const sinAsignacion = await request(app)
      .patch(`/api/rutinas/${idRutina}/estado`)
      .set('Authorization', `Bearer ${tokenEntrenador2}`)
      .send({ estado: 'activa' });

    expect(activar.status).toBe(200);
    expect(activar.body.data.estado).toBe('activa');
    expect(desactivar.status).toBe(200);
    expect(desactivar.body.data.estado).toBe('inactiva');
    expect(sinAsignacion.status).toBe(403);
  });

  it('GET y escrituras como recepcionista o cliente devuelven 403 (matriz §10)', async () => {
    const getRecep = await request(app)
      .get('/api/rutinas')
      .set('Authorization', `Bearer ${tokenRecep}`);
    const getCliente = await request(app)
      .get(`/api/rutinas/${idRutina}`)
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(getRecep.status).toBe(403);
    expect(getCliente.status).toBe(403);
  });
});
