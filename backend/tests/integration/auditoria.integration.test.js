// Pruebas de integración: auditoría de los flujos del Sprint 2 (FR-021, SC-009).
// Ejecuta los flujos de las historias y verifica que cada acción generó su
// registro con usuario, acción, módulo, fecha y resultado, incluidos los
// intentos de acceso del kiosco con `id_usuario` nulo.

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

function descriptorDe(semilla) {
  return Array.from({ length: 128 }, (_, i) => Math.cos(semilla * (i + 1)));
}

describe('Integración de auditoría de acciones (FR-021)', () => {
  let tokenAdmin;
  let idUsuario;
  let idCliente;
  let idTipo;
  let idMembresia;

  beforeAll(async () => {
    await vaciarTablas();
    const usuario = await insertarUsuario({
      nombre: 'Admin',
      correo: 'admin-audint@prueba.com',
      rol: 'administrador',
    });
    idUsuario = usuario.id_usuario ?? usuario;
    tokenAdmin = await tokenDe('admin-audint@prueba.com');
    idCliente = await insertarCliente({ correo: 'cliente-audint@prueba.com' });

    // Flujo 1: crear un tipo de membresía.
    const tipo = await request(app)
      .post('/api/tipos-membresia')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Mensual auditoría', descripcion: '30 días', duracion: 30, precio: 500 });
    expect(tipo.status).toBe(201);
    idTipo = tipo.body.data.id_tipo_membresia;

    // Flujo 2: asignar una membresía al cliente.
    const membresia = await request(app)
      .post('/api/membresias')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_cliente: idCliente, id_tipo_membresia: idTipo });
    expect(membresia.status).toBe(201);
    idMembresia = membresia.body.data.id_membresia;

    // Flujo 3: registrar un pago.
    const pago = await request(app)
      .post('/api/pagos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        id_cliente: idCliente,
        id_membresia: idMembresia,
        monto: 250,
        metodo_pago: 'efectivo',
      });
    expect(pago.status).toBe(201);

    // Flujo 4: registrar el rostro del cliente.
    const rostro = await request(app)
      .post(`/api/clientes/${idCliente}/rostro`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ descriptor_facial: descriptorDe(7) });
    expect([200, 201]).toContain(rostro.status);

    // Flujo 5: suspender la membresía (acción exclusiva del administrador).
    const susp = await request(app)
      .put(`/api/membresias/${idMembresia}/suspender`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});
    expect(susp.status).toBe(200);

    // Flujo 6: intento de acceso del kiosco SIN token → id_usuario nulo.
    const intento = await request(app)
      .post('/api/acceso/intento')
      .send({ descriptor_facial: descriptorDe(7) });
    expect(intento.status).toBe(200);
  });

  afterAll(async () => {
    await cerrarPool();
  });

  /** Devuelve todos los registros de una acción concreta. */
  async function registrosDe(accion) {
    return consultar('SELECT * FROM auditoria WHERE accion = ?', [accion]);
  }

  it('crear_tipo_membresia genera registro con usuario, módulo, fecha y resultado', async () => {
    const registros = await registrosDe('crear_tipo_membresia');
    expect(registros.length).toBeGreaterThan(0);
    const registro = registros[0];
    expect(Number(registro.id_usuario)).toBe(Number(idUsuario));
    expect(registro.modulo).toBe('tipos_membresia');
    expect(registro.resultado).toBe('exitoso');
    expect(registro.fecha).toBeTruthy();
    expect(registro.descripcion).toBeTruthy();
  });

  it('asignar_membresia genera registro con usuario y módulo membresias', async () => {
    const registros = await registrosDe('asignar_membresia');
    expect(registros.length).toBeGreaterThan(0);
    expect(Number(registros[0].id_usuario)).toBe(Number(idUsuario));
    expect(registros[0].modulo).toBe('membresias');
    expect(registros[0].resultado).toBe('exitoso');
    expect(registros[0].fecha).toBeTruthy();
  });

  it('registrar_pago genera registro con usuario y módulo pagos', async () => {
    const registros = await registrosDe('registrar_pago');
    expect(registros.length).toBeGreaterThan(0);
    expect(Number(registros[0].id_usuario)).toBe(Number(idUsuario));
    expect(registros[0].modulo).toBe('pagos');
    expect(registros[0].resultado).toBe('exitoso');
    expect(registros[0].fecha).toBeTruthy();
  });

  it('registrar_rostro genera registro con usuario y módulo rostros', async () => {
    const registros = await registrosDe('registrar_rostro');
    expect(registros.length).toBeGreaterThan(0);
    expect(Number(registros[0].id_usuario)).toBe(Number(idUsuario));
    expect(registros[0].modulo).toBe('rostros');
    expect(registros[0].resultado).toBe('exitoso');
    expect(registros[0].fecha).toBeTruthy();
  });

  it('suspender_membresia genera registro con usuario y módulo membresias', async () => {
    const registros = await registrosDe('suspender_membresia');
    expect(registros.length).toBeGreaterThan(0);
    expect(Number(registros[0].id_usuario)).toBe(Number(idUsuario));
    expect(registros[0].modulo).toBe('membresias');
    expect(registros[0].resultado).toBe('exitoso');
  });

  it('intento_acceso genera registro con id_usuario nulo (acción del sistema)', async () => {
    const registros = await registrosDe('intento_acceso');
    expect(registros.length).toBeGreaterThan(0);
    expect(registros[0].id_usuario).toBeNull();
    expect(registros[0].modulo).toBe('accesos');
    expect(['exitoso', 'rechazado']).toContain(registros[0].resultado);
    expect(registros[0].fecha).toBeTruthy();
  });

  it('GET /api/auditoria devuelve los registros con todos los campos (SC-009)', async () => {
    const respuesta = await request(app)
      .get('/api/auditoria')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.length).toBeGreaterThanOrEqual(6);

    for (const registro of respuesta.body.data) {
      expect(registro).toHaveProperty('id_auditoria');
      expect(registro).toHaveProperty('id_usuario');
      expect(registro).toHaveProperty('accion');
      expect(registro).toHaveProperty('modulo');
      expect(registro).toHaveProperty('fecha');
      expect(registro).toHaveProperty('resultado');
    }

    // Los seis flujos del Sprint 2 aparecen en el listado.
    const acciones = respuesta.body.data.map((r) => r.accion);
    for (const accionEsperada of [
      'crear_tipo_membresia',
      'asignar_membresia',
      'registrar_pago',
      'registrar_rostro',
      'suspender_membresia',
      'intento_acceso',
    ]) {
      expect(acciones).toContain(accionEsperada);
    }
  });

  it('el filtro por modulo devuelve solo registros de ese modulo', async () => {
    const respuesta = await request(app)
      .get('/api/auditoria?modulo=pagos')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.length).toBeGreaterThan(0);
    for (const registro of respuesta.body.data) {
      expect(registro.modulo).toBe('pagos');
    }
  });

  it('el filtro de fecha desde/hasta acota los registros', async () => {
    const respuesta = await request(app)
      .get('/api/auditoria?desde=2020-01-01&hasta=2030-12-31')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.length).toBeGreaterThan(0);

    // Un rango futuro no debe devolver nada.
    const futuro = await request(app)
      .get('/api/auditoria?desde=2031-01-01')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(futuro.status).toBe(200);
    expect(futuro.body.data).toHaveLength(0);
  });

  it('no existe ninguna ruta DELETE de auditoría (FR-008, SC-005)', async () => {
    const antes = await consultar('SELECT COUNT(*) AS n FROM auditoria');
    const respuesta = await request(app)
      .delete('/api/auditoria')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect([404, 405]).toContain(respuesta.status);

    const despues = await consultar('SELECT COUNT(*) AS n FROM auditoria');
    expect(Number(despues[0].n)).toBe(Number(antes[0].n));
  });
});
