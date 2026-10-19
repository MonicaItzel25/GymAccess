// Pruebas de integración: ciclo de vida de membresías (US-S2-03).
// La renovación cierra la vigente y crea el nuevo periodo (FR-006, FR-025);
// reactivar una membresía que no está suspendida responde 400.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { consultar, obtenerPool } from '../../src/config/db.js';
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

async function crearMembresiaActiva(idCliente, fechaInicio = '2026-01-01', fechaFin = '2030-12-31') {
  const pool = obtenerPool();
  const [rTipo] = await pool.execute(
    "INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado) VALUES (?, ?, ?, ?, 'activo')",
    [`Tipo vida ${Date.now()}-${Math.random()}`, 'Para pruebas', 30, 500]
  );
  const [rMem] = await pool.execute(
    'INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado, precio_acordado) VALUES (?, ?, ?, ?, ?, ?)',
    [idCliente, rTipo.insertId, fechaInicio, fechaFin, 'activa', 500]
  );
  return { idMembresia: rMem.insertId, idTipo: rTipo.insertId };
}

describe('Integración de ciclo de vida de membresías', () => {
  let tokenAdmin;
  let idCliente;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Admin', correo: 'admin-vidaint@prueba.com', rol: 'administrador' });
    tokenAdmin = await tokenDe('admin-vidaint@prueba.com');
    idCliente = await insertarCliente({ correo: 'cliente-vidaint@prueba.com' });
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('la renovación cierra la vigente y crea el nuevo periodo (FR-006)', async () => {
    const { idMembresia } = await crearMembresiaActiva(idCliente, '2026-01-01', '2026-03-31');

    const respuesta = await request(app)
      .put(`/api/membresias/${idMembresia}/renovar`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ fecha_inicio: '2026-04-01' });

    expect(respuesta.status).toBe(201);

    // La anterior quedó cerrada (ya no está activa).
    const anterior = await consultar('SELECT * FROM membresias WHERE id_membresia = ?', [idMembresia]);
    expect(anterior).toHaveLength(1);
    expect(anterior[0].estado).not.toBe('activa');

    // Existe una nueva membresía activa para el cliente.
    const vigentes = await consultar(
      "SELECT * FROM membresias WHERE id_cliente = ? AND estado = 'activa'",
      [idCliente]
    );
    expect(vigentes).toHaveLength(1);
    expect(vigentes[0].id_membresia).not.toBe(idMembresia);
  });

  it('suspender y luego reactivar cambia el estado en la base de datos', async () => {
    const { idMembresia } = await crearMembresiaActiva(idCliente);

    const susp = await request(app)
      .put(`/api/membresias/${idMembresia}/suspender`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});
    expect(susp.status).toBe(200);

    let guardada = await consultar('SELECT * FROM membresias WHERE id_membresia = ?', [idMembresia]);
    expect(guardada[0].estado).toBe('suspendida');

    const reac = await request(app)
      .put(`/api/membresias/${idMembresia}/reactivar`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});
    expect(reac.status).toBe(200);

    guardada = await consultar('SELECT * FROM membresias WHERE id_membresia = ?', [idMembresia]);
    expect(guardada[0].estado).toBe('activa');
  });

  it('reactivar una membresía que no está suspendida responde 400', async () => {
    const { idMembresia } = await crearMembresiaActiva(idCliente); // está activa

    const respuesta = await request(app)
      .put(`/api/membresias/${idMembresia}/reactivar`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.ok).toBe(false);
  });

  it('cancelar deja el estado cancelada y no se puede reactivar', async () => {
    const { idMembresia } = await crearMembresiaActiva(idCliente);

    const cancelada = await request(app)
      .put(`/api/membresias/${idMembresia}/cancelar`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});
    expect(cancelada.status).toBe(200);
    expect(cancelada.body.data.estado).toBe('cancelada');

    // Cancelada no es suspendida: reactivar debe fallar con 400.
    const reactivacion = await request(app)
      .put(`/api/membresias/${idMembresia}/reactivar`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});
    expect(reactivacion.status).toBe(400);
  });

  it('registra las acciones de estados en auditoría (FR-021)', async () => {
    const registros = await consultar(
      "SELECT * FROM auditoria WHERE modulo = 'membresias' AND accion IN ('suspender_membresia','reactivar_membresia','cancelar_membresia','renovar_membresia')"
    );
    expect(registros.length).toBeGreaterThan(0);
  });
});
