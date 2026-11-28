// Pruebas de integración: la consulta sin filtros conserva el comportamiento
// del Sprint 2 y añade el actor (US-S3-09.1).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { consultar } from '../../src/config/db.js';
import { cerrarPool } from '../helpers/baseDatos.js';
import { sembrarAuditoria } from '../helpers/auditoriaFiltros.js';

const app = crearApp();

describe('Integración de auditoría con filtros', () => {
  let datos;
  let registros;

  beforeAll(async () => {
    datos = await sembrarAuditoria(app);
    const r = await request(app)
      .get('/api/auditoria')
      .set('Authorization', `Bearer ${datos.tokens.admin}`);
    expect(r.status).toBe(200);
    registros = r.body.data;
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('test_sin_filtros_devuelve_todos_los_registros_del_mas_reciente_al_mas_antiguo', async () => {
    const [fila] = await consultar('SELECT COUNT(*) AS total FROM auditoria');
    const fechas = registros.map((registro) => new Date(registro.fecha).getTime());

    expect(registros).toHaveLength(fila.total);
    expect(fechas).toEqual([...fechas].sort((a, b) => b - a));
  });

  it('test_cada_registro_incluye_actor_accion_entidad_fecha_y_resultado', () => {
    const registro = registros.find((r) => r.accion === 'asignar_entrenador');

    expect(registro).toMatchObject({
      actor: 'Rosa Recepcion',
      id_usuario: datos.usuarios.recepcion,
      accion: 'asignar_entrenador',
      modulo: 'asignaciones',
      resultado: 'rechazado',
      descripcion: 'Detalle de asignar_entrenador',
    });
    expect(registro.id_auditoria).toBeTruthy();
    expect(registro.fecha).toBeTruthy();
  });

  it('test_las_acciones_sin_sesion_llegan_con_actor_nulo', () => {
    const registro = registros.find((r) => r.accion === 'intento_acceso');

    expect(registro.actor).toBeNull();
    expect(registro.id_usuario).toBeNull();
  });

  it('test_no_expone_datos_sensibles_del_actor', () => {
    expect(JSON.stringify(registros)).not.toMatch(/password|prueba\.com/i);
  });
});
