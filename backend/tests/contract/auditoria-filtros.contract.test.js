// Pruebas de contrato: auditoría con filtros, solo lectura (US-S3-09,
// contrato §9, FR-030 y FR-031).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { cerrarPool } from '../helpers/baseDatos.js';
import { sembrarAuditoria } from '../helpers/auditoriaFiltros.js';
import { consultar } from '../../src/config/db.js';

const app = crearApp();
const MARZO = { desde: '2020-03-01', hasta: '2020-03-31' };

describe('Contrato de auditoría con filtros', () => {
  let datos;

  const pedir = (query = {}, rol = 'admin') =>
    request(app).get('/api/auditoria').query(query).set('Authorization', `Bearer ${datos.tokens[rol]}`);
  const acciones = (respuesta) => respuesta.body.data.map((fila) => fila.accion);

  beforeAll(async () => {
    datos = await sembrarAuditoria(app);
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('test_el_rango_de_fechas_incluye_ambos_dias_completos', async () => {
    const r = await pedir(MARZO);

    expect(r.status).toBe(200);
    expect(acciones(r)).toEqual(['intento_acceso', 'asignar_entrenador', 'crear_usuario']);
  });

  it('test_filtra_por_modulo', async () => {
    const r = await pedir({ modulo: 'clientes' });

    expect(acciones(r)).toEqual(['crear_cliente', 'modificar_cliente']);
  });

  it('test_filtra_por_identificador_de_actor', async () => {
    const r = await pedir({ actor: String(datos.usuarios.admin) });

    expect(acciones(r)).toEqual(['crear_usuario', 'modificar_cliente']);
  });

  it('test_filtra_por_parte_del_nombre_del_actor', async () => {
    const r = await pedir({ actor: 'recepcion' });

    expect(acciones(r)).toEqual(['asignar_entrenador']);
  });

  it('test_los_comodines_del_nombre_se_tratan_como_texto', async () => {
    expect(acciones(await pedir({ actor: '%' }))).toEqual(['crear_cliente']);
    expect(acciones(await pedir({ actor: '_' }))).toEqual([]);
  });

  it('test_combina_los_filtros', async () => {
    const r = await pedir({ ...MARZO, modulo: 'usuarios', actor: 'Elsa' });

    expect(acciones(r)).toEqual(['crear_usuario']);
  });

  it('test_un_filtro_sin_resultados_responde_una_lista_vacia', async () => {
    const r = await pedir({ desde: '2001-01-01', hasta: '2001-01-31' });

    expect(r.status).toBe(200);
    expect(r.body).toEqual({ ok: true, data: [] });
  });

  it.each([
    ['periodo_invertido', { desde: '2020-03-31', hasta: '2020-03-01' }, 'El periodo de fechas es inválido'],
    ['fecha_mal_formada', { desde: '01/03/2020' }, 'El periodo de fechas es inválido'],
    ['fecha_inexistente', { hasta: '2020-02-30' }, 'El periodo de fechas es inválido'],
    ['fecha_repetida', { desde: ['2020-03-01', '2020-03-02'] }, 'El periodo de fechas es inválido'],
    ['modulo_repetido', { modulo: ['clientes', 'usuarios'] }, 'El filtro de módulo no es válido'],
    ['modulo_demasiado_largo', { modulo: 'x'.repeat(51) }, 'El filtro de módulo no es válido'],
    ['actor_repetido', { actor: ['1', '2'] }, 'El filtro de actor no es válido'],
    ['actor_demasiado_largo', { actor: 'x'.repeat(101) }, 'El filtro de actor no es válido'],
  ])('test_rechaza_con_400_%s', async (_caso, query, mensaje) => {
    const r = await pedir(query);

    expect(r.status).toBe(400);
    expect(r.body.message).toBe(mensaje);
    expect(r.body.data).toBeUndefined();
  });

  it.each(['recepcion', 'entrenador', 'cliente'])('test_%s_recibe_403_con_filtros', async (rol) => {
    const r = await pedir(MARZO, rol);

    expect(r.status).toBe(403);
    expect(r.body.data).toBeUndefined();
  });

  it.each(['post', 'put', 'patch', 'delete'])(
    'test_no_existe_operacion_de_escritura_con_%s',
    async (metodo) => {
      const [antes] = await consultar('SELECT COUNT(*) AS total FROM auditoria');
      for (const ruta of ['/api/auditoria', '/api/auditoria/1']) {
        const r = await request(app)[metodo](ruta)
          .set('Authorization', `Bearer ${datos.tokens.admin}`)
          .send({ accion: 'inventada' });
        expect(r.status, ruta).toBe(404);
      }
      const [despues] = await consultar('SELECT COUNT(*) AS total FROM auditoria');
      expect(despues.total).toBe(antes.total);
    }
  );
});
