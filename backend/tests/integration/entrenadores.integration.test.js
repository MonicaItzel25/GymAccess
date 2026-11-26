// Pruebas de integración: gestión de entrenadores (US-S3-01.4, FR-002, FR-004).
// Modificar información y cambiar estado quedan registrados en `auditoria` con
// actor, acción, fecha/hora, entidad (modulo) y resultado (SC-005).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import {
  vaciarTablas,
  insertarUsuario,
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

describe('Integración de entrenadores', () => {
  let tokenAdmin;
  let idAdmin;
  let idPerfil;

  beforeAll(async () => {
    await vaciarTablas();
    const idCuenta = await insertarUsuario({
      nombre: 'Entrenador Integracion',
      correo: 'ent-integracion@prueba.com',
      rol: 'entrenador',
    });
    const idCuentaAdmin = await insertarUsuario({
      nombre: 'Admin Integracion',
      correo: 'admin-integracion@prueba.com',
      rol: 'administrador',
    });
    idAdmin = idCuentaAdmin;
    tokenAdmin = await tokenDe('admin-integracion@prueba.com');

    const alta = await request(app)
      .post('/api/entrenadores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_usuario: idCuenta });
    idPerfil = alta.body.data.id_entrenador;
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('PUT /:id modifica especialidad y teléfono (200)', async () => {
    const respuesta = await request(app)
      .put(`/api/entrenadores/${idPerfil}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ especialidad: 'Movilidad', telefono: '555-9999' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.especialidad).toBe('Movilidad');
    expect(respuesta.body.data.telefono).toBe('555-9999');
  });

  it('PUT /:id/estado cambia a inactivo (200) y el perfil responde con el nuevo estado', async () => {
    const respuesta = await request(app)
      .put(`/api/entrenadores/${idPerfil}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'inactivo' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.estado).toBe('inactivo');

    const consulta = await request(app)
      .get(`/api/entrenadores/${idPerfil}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(consulta.body.data.estado).toBe('inactivo');
  });

  it('las tres acciones quedan en auditoría con actor, acción, fecha, entidad y resultado (SC-005)', async () => {
    const [registros] = await obtenerPool().execute(
      `SELECT a.accion, a.modulo, a.fecha, a.resultado, a.id_usuario
       FROM auditoria a
       WHERE a.modulo = 'entrenadores' AND a.id_usuario = ?
       ORDER BY a.id_auditoria`,
      [idAdmin]
    );

    const acciones = registros.map((r) => r.accion);
    expect(acciones).toContain('crear_entrenador');
    expect(acciones).toContain('modificar_entrenador');
    expect(acciones).toContain('cambiar_estado_entrenador');

    for (const registro of registros) {
      expect(registro.id_usuario).toBe(idAdmin); // actor
      expect(registro.modulo).toBe('entrenadores'); // entidad afectada
      expect(registro.resultado).toBe('exitoso');
      expect(registro.fecha).toBeTruthy(); // fecha/hora
    }
  });

  it('el detalle de la entidad queda en la descripción del registro de auditoría', async () => {
    const [registros] = await obtenerPool().execute(
      `SELECT descripcion FROM auditoria
       WHERE modulo = 'entrenadores' AND accion = 'crear_entrenador'`,
      []
    );
    expect(registros.length).toBeGreaterThan(0);
    expect(registros[0].descripcion).toContain(`#${idPerfil}`);
  });
});
