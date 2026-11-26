// Pruebas de integración: catálogo de ejercicios (US-S3-08, FR-013, SC-004).
// Crear y modificar quedan en `auditoria` con actor, acción, fecha/hora,
// entidad (modulo) y resultado. La desactivación deja el ejercicio `inactivo`
// SIN borrarlo: el registro se conserva para las rutinas existentes.

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

describe('Integración de ejercicios', () => {
  let tokenAdmin;
  let idAdmin;
  let idEjercicio;

  beforeAll(async () => {
    await vaciarTablas();
    idAdmin = await insertarUsuario({ nombre: 'Admin Integracion', correo: 'admin-eje-int@prueba.com', rol: 'administrador' });
    tokenAdmin = await tokenDe('admin-eje-int@prueba.com');
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('crear, modificar y desactivar responden correctamente', async () => {
    const alta = await request(app)
      .post('/api/ejercicios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Remo con barra', descripcion: 'Tirón hacia el torso con barra', grupo_muscular: 'Espalda' });
    expect(alta.status).toBe(201);
    idEjercicio = alta.body.data.id_ejercicio;

    const modificacion = await request(app)
      .put(`/api/ejercicios/${idEjercicio}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ descripcion: 'Tirón hacia el torso con barra prona' });
    expect(modificacion.status).toBe(200);
    expect(modificacion.body.data.descripcion).toBe('Tirón hacia el torso con barra prona');

    const cambio = await request(app)
      .put(`/api/ejercicios/${idEjercicio}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'inactivo' });
    expect(cambio.status).toBe(200);
    expect(cambio.body.data.estado).toBe('inactivo');
  });

  it('la desactivación deja el ejercicio inactivo SIN borrarlo (SC-004)', async () => {
    const [filas] = await obtenerPool().execute(
      'SELECT nombre, estado FROM ejercicios WHERE id_ejercicio = ?',
      [idEjercicio]
    );

    expect(filas.length).toBe(1);
    expect(filas[0].nombre).toBe('Remo con barra');
    expect(filas[0].estado).toBe('inactivo');
  });

  it('crear, modificar y cambiar estado quedan en auditoría con actor, acción, fecha, entidad y resultado (SC-005, FR-013)', async () => {
    const [registros] = await obtenerPool().execute(
      `SELECT a.accion, a.modulo, a.fecha, a.resultado, a.id_usuario
       FROM auditoria a
       WHERE a.modulo = 'ejercicios' AND a.id_usuario = ?
       ORDER BY a.id_auditoria`,
      [idAdmin]
    );

    const acciones = registros.map((r) => r.accion);
    expect(acciones).toContain('crear_ejercicio');
    expect(acciones).toContain('modificar_ejercicio');
    expect(acciones).toContain('cambiar_estado_ejercicio');

    for (const registro of registros) {
      expect(registro.id_usuario).toBe(idAdmin);
      expect(registro.modulo).toBe('ejercicios');
      expect(registro.resultado).toBe('exitoso');
      expect(registro.fecha).toBeTruthy();
    }
  });
});
