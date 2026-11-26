// Pruebas de integración: objetivos y progresos de clientes (US-S3-04).
// Comprueba persistencia histórica, cierre de objetivos y auditoría sin borrar
// ni sobrescribir entradas previas de progreso.

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
  expect(respuesta.status, `Debe iniciar sesión la cuenta ${correo}`).toBe(200);
  expect(respuesta.body.data?.token).toBeTruthy();
  return respuesta.body.data.token;
}

describe('Integración de objetivos y progresos', () => {
  let tokenAdmin;
  let tokenEntrenador;
  let idCuentaEntrenador;
  let idCliente;

  beforeAll(async () => {
    await vaciarTablas();
    const idCuentaAdmin = await insertarUsuario({ nombre: 'Admin integración US5', correo: 'admin-us5-int@prueba.com', rol: 'administrador' });
    idCuentaEntrenador = await insertarUsuario({
      nombre: 'Entrenador integración US5',
      correo: 'ent-us5-int@prueba.com',
      rol: 'entrenador',
    });
    idCliente = await insertarCliente({
      nombre: 'Lucía',
      apellido: 'Integración US5',
      correo: 'lucia-us5-int@prueba.com',
    });
    expect(idCuentaAdmin).toBeTruthy();
    expect(idCuentaEntrenador).toBeTruthy();
    expect(idCliente).toBeTruthy();

    tokenAdmin = await tokenDe('admin-us5-int@prueba.com');
    tokenEntrenador = await tokenDe('ent-us5-int@prueba.com');

    const perfil = await request(app)
      .post('/api/entrenadores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_usuario: idCuentaEntrenador });
    expect(perfil.status, 'Debe crearse el perfil para la integración').toBe(201);
    expect(perfil.body.data?.id_entrenador).toBeTruthy();

    const asignacion = await request(app)
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_cliente: idCliente, id_entrenador: perfil.body.data.id_entrenador });
    expect(asignacion.status, 'Debe existir una asignación vigente para el cliente').toBe(201);
    expect(asignacion.body.data?.id_asignacion).toBeTruthy();
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('test_cierre_de_objetivo_conserva_historial_y_nuevos_progresos_no_alteran_los_anteriores', async () => {
    const altaObjetivo = await request(app)
      .post('/api/objetivos')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({
        id_cliente: idCliente,
        meta: 'Mejorar resistencia',
        unidad: 'minutos',
        fecha_objetivo: '2026-12-31',
      });

    expect(altaObjetivo.status).toBe(201);
    const idObjetivo = altaObjetivo.body.data.id_objetivo;
    expect(idObjetivo).toBeTruthy();

    const primerProgreso = await request(app)
      .post('/api/progresos')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({
        id_cliente: idCliente,
        id_objetivo: idObjetivo,
        fecha: '2026-11-20',
        valor_numerico: 15,
        avance: null,
        comentario: 'Primera medición de seguimiento deportivo',
      });
    expect(primerProgreso.status).toBe(201);
    const idPrimerProgreso = primerProgreso.body.data.id_progreso;
    expect(idPrimerProgreso).toBeTruthy();

    const [historialTrasPrimerRegistro] = await obtenerPool().execute(
      `SELECT id_progreso, id_cliente, id_objetivo, fecha, valor_numerico, avance, comentario, fecha_registro
       FROM progresos
       WHERE id_cliente = ?
       ORDER BY fecha, id_progreso`,
      [idCliente]
    );
    expect(historialTrasPrimerRegistro).toHaveLength(1);
    const primerRegistroOriginal = historialTrasPrimerRegistro[0];

    const segundoProgreso = await request(app)
      .post('/api/progresos')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({
        id_cliente: idCliente,
        id_objetivo: idObjetivo,
        fecha: '2026-11-27',
        valor_numerico: 20,
        avance: null,
        comentario: 'Nueva medición sin reemplazar la anterior',
      });
    expect(segundoProgreso.status).toBe(201);
    expect(segundoProgreso.body.data?.id_progreso).toBeTruthy();

    const [progresosAntesDelCierre] = await obtenerPool().execute(
      `SELECT id_progreso, id_cliente, id_objetivo, fecha, valor_numerico, avance, comentario, fecha_registro
       FROM progresos
       WHERE id_cliente = ?
       ORDER BY fecha, id_progreso`,
      [idCliente]
    );
    expect(progresosAntesDelCierre).toHaveLength(2);
    const primerRegistroAntesDelCierre = progresosAntesDelCierre.find(
      (progreso) => progreso.id_progreso === idPrimerProgreso
    );
    expect(primerRegistroAntesDelCierre).toEqual(primerRegistroOriginal);
    expect(Number(primerRegistroAntesDelCierre.valor_numerico)).toBe(15);
    expect(primerRegistroAntesDelCierre.comentario).toBe('Primera medición de seguimiento deportivo');

    const cierre = await request(app)
      .patch(`/api/objetivos/${idObjetivo}/estado`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ estado: 'cerrado' });
    expect(cierre.status).toBe(200);
    expect(cierre.body.data.estado).toBe('cerrado');
    expect(cierre.body.data.fecha_cierre).toBeTruthy();

    const [objetivosPersistidos] = await obtenerPool().execute(
      `SELECT id_objetivo, id_cliente, estado, fecha_cierre
       FROM objetivos
       WHERE id_objetivo = ?`,
      [idObjetivo]
    );
    const [progresosPersistidos] = await obtenerPool().execute(
      `SELECT id_progreso, id_cliente, id_objetivo, fecha, valor_numerico, avance, comentario, fecha_registro
       FROM progresos
       WHERE id_cliente = ?
       ORDER BY fecha, id_progreso`,
      [idCliente]
    );

    expect(objetivosPersistidos).toHaveLength(1);
    expect(objetivosPersistidos[0].estado).toBe('cerrado');
    expect(objetivosPersistidos[0].fecha_cierre).toBeTruthy();
    expect(progresosPersistidos).toHaveLength(2);
    expect(progresosPersistidos).toEqual(progresosAntesDelCierre);
    const primerRegistroPersistido = progresosPersistidos.find(
      (progreso) => progreso.id_progreso === idPrimerProgreso
    );
    expect(Number(primerRegistroPersistido.valor_numerico)).toBe(15);
    expect(primerRegistroPersistido.comentario).toBe('Primera medición de seguimiento deportivo');

    const [auditoria] = await obtenerPool().execute(
      `SELECT id_usuario, accion, modulo, fecha, resultado, descripcion
       FROM auditoria
       WHERE id_usuario = ? AND modulo IN ('objetivos', 'progresos')
       ORDER BY id_auditoria`,
      [idCuentaEntrenador]
    );
    const registroObjetivo = auditoria.find((registro) => registro.modulo === 'objetivos');
    const registrosProgreso = auditoria.filter((registro) => registro.modulo === 'progresos');

    expect(registroObjetivo).toBeTruthy();
    expect(registroObjetivo.id_usuario).toBe(idCuentaEntrenador);
    expect(registroObjetivo.accion).toBe('crear objetivo');
    expect(registroObjetivo.resultado).toBe('exitoso');
    expect(registroObjetivo.fecha).toBeTruthy();
    expect(registroObjetivo.descripcion).toContain(String(idObjetivo));
    expect(registrosProgreso).toHaveLength(2);
    for (const registro of registrosProgreso) {
      expect(registro.id_usuario).toBe(idCuentaEntrenador);
      expect(registro.accion).toBe('registrar progreso');
      expect(registro.resultado).toBe('exitoso');
      expect(registro.fecha).toBeTruthy();
    }
  });

  it('test_audita_ediciones_cambios_de_estado_y_rechazos_con_la_misma_accion', async () => {
    const autorizado = (peticion) => peticion.set('Authorization', `Bearer ${tokenEntrenador}`);
    const alta = await autorizado(request(app).post('/api/objetivos')).send({
      id_cliente: idCliente,
      meta: 'Meta confidencial de auditoría',
      fecha_objetivo: '2026-12-31',
    });
    expect(alta.status).toBe(201);
    const ruta = `/api/objetivos/${alta.body.data.id_objetivo}`;

    expect((await autorizado(request(app).put(ruta)).send({})).status).toBe(400);
    expect((await autorizado(request(app).put(ruta)).send({ unidad: 'km' })).status).toBe(200);
    expect((await autorizado(request(app).patch(`${ruta}/estado`)).send({ estado: 'alcanzado' })).status).toBe(200);
    expect((await autorizado(request(app).patch(`${ruta}/estado`)).send({ estado: 'cerrado' })).status).toBe(400);
    const rechazado = await autorizado(request(app).post('/api/progresos')).send({
      id_cliente: idCliente,
      id_progreso_corregido: 1,
      fecha: '2026-11-28',
      avance: 'Corrección rechazada',
    });
    expect(rechazado.status).toBe(400);

    const [registros] = await obtenerPool().execute(
      `SELECT accion, modulo, resultado, descripcion
       FROM auditoria
       WHERE id_usuario = ? AND modulo IN ('objetivos', 'progresos')
       ORDER BY id_auditoria`,
      [idCuentaEntrenador]
    );
    const resumen = registros.map((r) => `${r.modulo} | ${r.accion} | ${r.resultado}`);

    for (const esperado of [
      'objetivos | modificar objetivo | rechazado',
      'objetivos | modificar objetivo | exitoso',
      'objetivos | cambiar estado objetivo | exitoso',
      'objetivos | cambiar estado objetivo | rechazado',
      'progresos | registrar progreso | rechazado',
    ]) {
      expect(resumen, `Debe auditarse: ${esperado}`).toContain(esperado);
    }
    expect(registros.some((r) => r.descripcion.includes('confidencial'))).toBe(false);
  });
});
