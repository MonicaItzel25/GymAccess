// Pruebas de contrato: dashboard administrativo (US-S3-06, contrato §8).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { cerrarPool } from '../helpers/baseDatos.js';
import { sembrarDashboard, PERIODO } from '../helpers/dashboard.js';
import { hoy } from '../../src/utils/fechas.js';

const app = crearApp();

describe('Contrato del dashboard', () => {
  const tokens = {};
  const consultar = (query = {}, rol = 'administrador') => {
    const peticion = request(app).get('/api/dashboard').query(query);
    return rol ? peticion.set('Authorization', `Bearer ${tokens[rol]}`) : peticion;
  };

  beforeAll(async () => {
    await sembrarDashboard();
    for (const rol of ['administrador', 'recepcionista', 'entrenador', 'cliente']) {
      const r = await request(app)
        .post('/api/auth/login')
        .send({ correo: `${rol}-dash@prueba.com`, password: 'Prueba1234' });
      expect(r.status, rol).toBe(200);
      tokens[rol] = r.body.data.token;
    }
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('test_responde_200_con_los_grupos_del_contrato', async () => {
    const r = await consultar(PERIODO);

    expect(r.status).toBe(200);
    expect(Object.keys(r.body.data)).toEqual(['periodo', 'clientes', 'membresias', 'pagos', 'accesos', 'entrenamiento']);
    expect(r.body.data.periodo).toEqual(PERIODO);
    expect(Object.keys(r.body.data.clientes)).toEqual(['totales', 'activos', 'nuevos']);
    expect(Object.keys(r.body.data.membresias)).toEqual(['vigentes', 'porVencer', 'vencidas']);
    expect(Object.keys(r.body.data.pagos)).toEqual(['cantidad', 'ingresos', 'adeudosPendientes']);
    expect(Object.keys(r.body.data.accesos)).toEqual(['intentos', 'autorizados', 'rechazados']);
    expect(Object.keys(r.body.data.entrenamiento)).toEqual([
      'entrenadoresActivos', 'rutinasActivas', 'clientesSinRutinaActiva',
      'objetivosActivos', 'progresosEnPeriodo', 'cargaPorEntrenador',
    ]);
  });

  it('test_sin_parametros_usa_el_mes_en_curso_completo', async () => {
    const r = await consultar();
    const mes = hoy().slice(0, 7);
    const [anio, numero] = mes.split('-').map(Number);
    const ultimo = new Date(anio, numero, 0).getDate();

    expect(r.status).toBe(200);
    expect(r.body.data.periodo).toEqual({ desde: `${mes}-01`, hasta: `${mes}-${ultimo}` });
  });

  it('test_acepta_un_periodo_de_un_solo_dia', async () => {
    const r = await consultar({ desde: '2020-03-01', hasta: '2020-03-01' });

    expect(r.status).toBe(200);
    expect(r.body.data.pagos.cantidad).toBe(1);
  });

  it.each([
    ['invertido', { desde: '2020-03-31', hasta: '2020-03-01' }],
    ['con_formato_incorrecto', { desde: '01/03/2020', hasta: '2020-03-31' }],
    ['con_fecha_inexistente', { desde: '2020-02-30', hasta: '2020-03-31' }],
    ['con_lista', { desde: ['2020-03-01', '2020-03-02'] }],
    ['posterior_al_mes_en_curso', { desde: '2999-01-01' }],
  ])('test_rechaza_con_400_un_periodo_%s', async (_caso, query) => {
    const r = await consultar(query);

    expect(r.status).toBe(400);
    expect(r.body.message).toBe('El periodo de fechas es inválido');
    expect(r.body.data).toBeUndefined();
  });

  it.each(['recepcionista', 'entrenador', 'cliente'])(
    'test_el_rol_%s_recibe_403',
    async (rol) => {
      const r = await consultar({}, rol);

      expect(r.status).toBe(403);
      expect(r.body.data).toBeUndefined();
    }
  );

  it('test_sin_sesion_responde_401', async () => {
    expect((await consultar({}, null)).status).toBe(401);
  });
});
