// Pruebas de integración: asignaciones de entrenador (US-S3-02, FR-009, SC-005).
// El alta y la finalización quedan en `auditoria` con actor, acción, fecha/hora,
// entidad (modulo) y resultado; el listado devuelve el nombre del cliente,
// también con el filtro `vigentes=true`.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import {
  vaciarTablas,
  insertarUsuario,
  insertarCliente,
  cerrarPool,
} from '../helpers/baseDatos.js';
import { obtenerPool } from '../../src/config/db.js';

const app = crearApp();

async function tokenDe(correo) {
  const respuesta = await request(app)
    .post('/api/auth/login')
    .send({ correo, password: 'Prueba1234' });
  return respuesta.body.data.token;
}

describe('Integración de asignaciones de entrenador', () => {
  let tokenAdmin;
  let idAdmin;
  let idAsignacion;

  beforeAll(async () => {
    await vaciarTablas();
    idAdmin = await insertarUsuario({ nombre: 'Admin Integracion', correo: 'admin-asig-int@prueba.com', rol: 'administrador' });
    const idCuenta = await insertarUsuario({ nombre: 'Entrenador Integracion', correo: 'ent-asig-int@prueba.com', rol: 'entrenador' });
    const idCliente = await insertarCliente({ nombre: 'Ana', apellido: 'Cliente', correo: 'ana-asig-int@prueba.com' });
    tokenAdmin = await tokenDe('admin-asig-int@prueba.com');

    const perfil = await request(app)
      .post('/api/entrenadores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_usuario: idCuenta });

    const alta = await request(app)
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_cliente: idCliente, id_entrenador: perfil.body.data.id_entrenador });
    idAsignacion = alta.body.data.id_asignacion;
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('el GET con vigentes=true devuelve el nombre del cliente asignado', async () => {
    const respuesta = await request(app)
      .get('/api/asignaciones?vigentes=true')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    const propia = respuesta.body.data.find((a) => a.id_asignacion === idAsignacion);
    expect(propia.cliente_nombre).toBe('Ana');
    expect(propia.estado).toBe('vigente');
  });

  it('finalizar la asignación responde 200 con estado finalizada', async () => {
    const respuesta = await request(app)
      .put(`/api/asignaciones/${idAsignacion}/finalizar`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.estado).toBe('finalizada');
  });

  it('alta y finalización quedan en auditoría con actor, acción, fecha, entidad y resultado (SC-005)', async () => {
    const [registros] = await obtenerPool().execute(
      `SELECT a.accion, a.modulo, a.fecha, a.resultado, a.id_usuario
       FROM auditoria a
       WHERE a.modulo = 'asignaciones' AND a.id_usuario = ?
       ORDER BY a.id_auditoria`,
      [idAdmin]
    );

    const acciones = registros.map((r) => r.accion);
    expect(acciones).toContain('asignar_entrenador');
    expect(acciones).toContain('finalizar_asignacion');

    for (const registro of registros) {
      expect(registro.id_usuario).toBe(idAdmin);
      expect(registro.modulo).toBe('asignaciones');
      expect(registro.resultado).toBe('exitoso');
      expect(registro.fecha).toBeTruthy();
    }
  });

  it('tras finalizar, el filtro vigentes=true ya no incluye la asignación', async () => {
    const respuesta = await request(app)
      .get('/api/asignaciones?vigentes=true')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.find((a) => a.id_asignacion === idAsignacion)).toBeUndefined();
  });
});
