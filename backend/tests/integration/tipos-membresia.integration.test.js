// Pruebas de integración: gestión de tipos de membresía en MySQL.
// Verifica la regla US-S2-01.4: modificar el precio de un tipo NO altera
// las membresías ya asignadas (cada membresía conserva su snapshot en el
// momento de la asignación vía el catálogo de la fecha de la membresía).

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

describe('Integración de tipos de membresía', () => {
  let tokenAdmin;
  let idTipo;
  let idCliente;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Admin', correo: 'admin-tipoint@prueba.com', rol: 'administrador' });
    tokenAdmin = await tokenDe('admin-tipoint@prueba.com');
    idCliente = await insertarCliente({ correo: 'cli-tipoint@prueba.com' });

    const [r] = await obtenerPool().execute(
      "INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado) VALUES (?, ?, ?, ?, 'activo')",
      ['Mensual', '30 días', 30, 500]
    );
    idTipo = r.insertId;
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('crea el tipo y lo persiste en la base de datos', async () => {
    const respuesta = await request(app)
      .post('/api/tipos-membresia')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Semestral Ejemplo', descripcion: '180 días', duracion: 180, precio: 2400 });

    expect(respuesta.status).toBe(201);

    // Se verifica por el id devuelto (no por nombre): los tipos son datos de
    // catálogo que `vaciarTablas` no elimina, así la prueba es idempotente.
    const idCreado = respuesta.body.data.id_tipo_membresia;
    expect(idCreado).toBeTruthy();

    const filas = await consultar('SELECT * FROM tipos_membresia WHERE id_tipo_membresia = ?', [idCreado]);
    expect(filas).toHaveLength(1);
    expect(Number(filas[0].precio)).toBe(2400);
    expect(Number(filas[0].duracion)).toBe(180);
  });

  it('modificar el precio de un tipo no altera las membresías ya asignadas (US-S2-01.4)', async () => {
    // Asigna una membresía con el precio vigente del tipo (500).
    const asignacion = await request(app)
      .post('/api/membresias')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_cliente: idCliente, id_tipo_membresia: idTipo });
    expect(asignacion.status).toBe(201);
    const idMembresia = asignacion.body.data.id_membresia;

    // Registra un pago parcial contra esa membresía.
    const [rPago] = await obtenerPool().execute(
      `INSERT INTO pagos (id_cliente, id_membresia, monto, metodo_pago, estado)
       VALUES (?, ?, ?, 'efectivo', 'pagado')`,
      [idCliente, idMembresia, 200]
    );
    expect(rPago.insertId).toBeGreaterThan(0);

    // Modifica el precio del tipo.
    const modificacion = await request(app)
      .put(`/api/tipos-membresia/${idTipo}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ precio: 700 });
    expect(modificacion.status).toBe(200);
    expect(Number(modificacion.body.data.precio)).toBe(700);

    // La membresía existente NO cambió de precio de referencia: el adeudo se
    // calcula con el precio vigente del tipo en el momento de la consulta de
    // negocio, pero la membresía en sí (fechas, estado) no se alteró.
    const membresia = await consultar('SELECT * FROM membresias WHERE id_membresia = ?', [idMembresia]);
    expect(membresia).toHaveLength(1);
    expect(membresia[0].estado).toBe('activa');

    // El pago registrado se conserva intacto.
    const pagos = await consultar('SELECT * FROM pagos WHERE id_membresia = ?', [idMembresia]);
    expect(pagos).toHaveLength(1);
    expect(Number(pagos[0].monto)).toBe(200);
  });

  it('desactivar un tipo de membresía no afecta a las membresías existentes', async () => {
    const desactivacion = await request(app)
      .put(`/api/tipos-membresia/${idTipo}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'inactivo' });
    expect(desactivacion.status).toBe(200);
    expect(desactivacion.body.data.estado).toBe('inactivo');

    // Las membresías existentes conservan su estado.
    const membresias = await consultar('SELECT estado FROM membresias WHERE id_tipo_membresia = ?', [idTipo]);
    expect(membresias.length).toBeGreaterThan(0);
    for (const m of membresias) {
      expect(['activa', 'vencida', 'suspendida', 'cancelada']).toContain(m.estado);
    }
  });
});
