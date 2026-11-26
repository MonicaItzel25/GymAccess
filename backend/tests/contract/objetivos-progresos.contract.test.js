// Pruebas de contrato: objetivos y progresos de clientes (US-S3-04, Sprint 3).
// Solo el entrenador con perfil activo y asignación vigente puede consultar o
// registrar datos de sus clientes. El seguimiento es deportivo, no médico.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
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
  expect(respuesta.status, `Debe iniciar sesión la cuenta ${correo}`).toBe(200);
  expect(respuesta.body.data?.token, `Debe devolverse un token para ${correo}`).toBeTruthy();
  return respuesta.body.data.token;
}

function esperarCreacion(respuesta, entidad) {
  expect(respuesta.status, `Debe crearse ${entidad}`).toBe(201);
  expect(respuesta.body.data?.[`id_${entidad}`], `Debe devolverse el identificador de ${entidad}`).toBeTruthy();
  return respuesta.body.data[`id_${entidad}`];
}

async function crearObjetivo(token, idCliente, cambios = {}) {
  const respuesta = await request(app)
    .post('/api/objetivos')
    .set('Authorization', `Bearer ${token}`)
    .send({
      id_cliente: idCliente,
      meta: 'Mejorar condición física',
      fecha_objetivo: '2026-12-31',
      ...cambios,
    });
  expect(respuesta.status, 'Debe crearse el objetivo de preparación').toBe(201);
  expect(respuesta.body.data?.id_objetivo, 'Debe devolverse el identificador del objetivo').toBeTruthy();
  return respuesta.body.data;
}

async function crearProgreso(token, idCliente, cambios = {}) {
  const respuesta = await request(app)
    .post('/api/progresos')
    .set('Authorization', `Bearer ${token}`)
    .send({
      id_cliente: idCliente,
      fecha: '2026-11-20',
      avance: 'Seguimiento de condición física',
      ...cambios,
    });
  expect(respuesta.status, 'Debe crearse la entrada de progreso de preparación').toBe(201);
  expect(respuesta.body.data?.id_progreso, 'Debe devolverse el identificador del progreso').toBeTruthy();
  return respuesta.body.data;
}

describe('Contrato de objetivos y progresos', () => {
  let tokenAdmin;
  let tokenRecepcionista;
  let tokenEntrenador;
  let tokenEntrenadorInactivo;
  let tokenCliente;
  let idClienteAsignado;
  let idClienteSinAsignar;
  let idClienteDeOtroEntrenador;
  let idObjetivoDeOtroCliente;

  beforeAll(async () => {
    await vaciarTablas();

    const idCuentaAdmin = await insertarUsuario({ nombre: 'Admin US5', correo: 'admin-us5@prueba.com', rol: 'administrador' });
    const idCuentaRecepcionista = await insertarUsuario({ nombre: 'Recepción US5', correo: 'recep-us5@prueba.com', rol: 'recepcionista' });
    const idCuentaEntrenador = await insertarUsuario({
      nombre: 'Entrenadora US5',
      correo: 'ent-us5@prueba.com',
      rol: 'entrenador',
    });
    const idCuentaEntrenadorInactivo = await insertarUsuario({
      nombre: 'Entrenador inactivo US5',
      correo: 'ent-inactivo-us5@prueba.com',
      rol: 'entrenador',
    });
    const idCuentaCliente = await insertarUsuario({ nombre: 'Cliente US5', correo: 'cliente-us5@prueba.com', rol: 'cliente' });

    idClienteAsignado = await insertarCliente({ nombre: 'Ana', apellido: 'Asignada US5', correo: 'ana-us5@prueba.com' });
    idClienteSinAsignar = await insertarCliente({ nombre: 'Bruno', apellido: 'Sin asignar US5', correo: 'bruno-us5@prueba.com' });
    idClienteDeOtroEntrenador = await insertarCliente({ nombre: 'Carla', apellido: 'Otra asignación US5', correo: 'carla-us5@prueba.com' });
    expect(idCuentaAdmin).toBeTruthy();
    expect(idCuentaRecepcionista).toBeTruthy();
    expect(idCuentaEntrenador).toBeTruthy();
    expect(idCuentaEntrenadorInactivo).toBeTruthy();
    expect(idCuentaCliente).toBeTruthy();
    expect(idClienteAsignado).toBeTruthy();
    expect(idClienteSinAsignar).toBeTruthy();
    expect(idClienteDeOtroEntrenador).toBeTruthy();

    tokenAdmin = await tokenDe('admin-us5@prueba.com');
    tokenRecepcionista = await tokenDe('recep-us5@prueba.com');
    tokenEntrenador = await tokenDe('ent-us5@prueba.com');
    tokenEntrenadorInactivo = await tokenDe('ent-inactivo-us5@prueba.com');
    tokenCliente = await tokenDe('cliente-us5@prueba.com');

    const perfil = await request(app)
      .post('/api/entrenadores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_usuario: idCuentaEntrenador });
    expect(perfil.status, 'Debe crearse el perfil del entrenador principal').toBe(201);
    expect(perfil.body.data?.id_entrenador).toBeTruthy();
    const perfilInactivo = await request(app)
      .post('/api/entrenadores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_usuario: idCuentaEntrenadorInactivo });
    expect(perfilInactivo.status, 'Debe crearse el perfil del segundo entrenador').toBe(201);
    expect(perfilInactivo.body.data?.id_entrenador).toBeTruthy();

    const asignacionPrincipal = await request(app)
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_cliente: idClienteAsignado, id_entrenador: perfil.body.data.id_entrenador });
    expect(asignacionPrincipal.status, 'Debe asignarse el cliente al entrenador principal').toBe(201);
    expect(asignacionPrincipal.body.data?.id_asignacion).toBeTruthy();
    const asignacionSecundaria = await request(app)
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_cliente: idClienteDeOtroEntrenador, id_entrenador: perfilInactivo.body.data.id_entrenador });
    expect(asignacionSecundaria.status, 'Debe asignarse el segundo cliente al otro entrenador').toBe(201);
    expect(asignacionSecundaria.body.data?.id_asignacion).toBeTruthy();

    // El objetivo ajeno se crea antes de desactivar el perfil para probar la
    // validación de pertenencia cliente↔objetivo en un progreso posterior.
    const objetivoAjeno = await request(app)
      .post('/api/objetivos')
      .set('Authorization', `Bearer ${tokenEntrenadorInactivo}`)
      .send({
        id_cliente: idClienteDeOtroEntrenador,
        meta: 'Mejorar movilidad',
        fecha_objetivo: '2026-12-31',
      });
    idObjetivoDeOtroCliente = esperarCreacion(objetivoAjeno, 'objetivo');

    const desactivacion = await request(app)
      .put(`/api/entrenadores/${perfilInactivo.body.data.id_entrenador}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'inactivo' });
    expect(desactivacion.status, 'Debe desactivarse el segundo perfil de entrenador').toBe(200);
    expect(desactivacion.body.data?.estado).toBe('inactivo');
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('test_entrenador_asignado_crea_objetivo_con_estado_y_fecha_de_registro', async () => {
    const respuesta = await request(app)
      .post('/api/objetivos')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({
        id_cliente: idClienteAsignado,
        meta: 'Aumentar fuerza',
        unidad: 'kg',
        fecha_objetivo: '2026-12-31',
      });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.data.id_objetivo).toBeTruthy();
    expect(respuesta.body.data.id_cliente).toBe(idClienteAsignado);
    expect(respuesta.body.data.meta).toBe('Aumentar fuerza');
    expect(respuesta.body.data.unidad).toBe('kg');
    expect(respuesta.body.data.estado).toBe('activo');
    expect(respuesta.body.data.fecha_registro).toBeTruthy();
  });

  it('test_rechaza_meta_ausente_vacia_o_fuera_del_limite_de_longitud', async () => {
    const metaAusente = await request(app)
      .post('/api/objetivos')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ id_cliente: idClienteAsignado, fecha_objetivo: '2026-12-31' });
    const metaVacia = await request(app)
      .post('/api/objetivos')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ id_cliente: idClienteAsignado, meta: '   ', fecha_objetivo: '2026-12-31' });
    const metaLarga = await request(app)
      .post('/api/objetivos')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ id_cliente: idClienteAsignado, meta: 'm'.repeat(256), fecha_objetivo: '2026-12-31' });

    expect(metaAusente.status).toBe(400);
    expect(metaVacia.status).toBe(400);
    expect(metaLarga.status).toBe(400);
  });

  it('test_rechaza_unidad_fuera_del_limite_y_acepta_el_limite_del_modelo', async () => {
    const unidadLarga = await request(app)
      .post('/api/objetivos')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ id_cliente: idClienteAsignado, meta: 'Meta válida', unidad: 'u'.repeat(31), fecha_objetivo: '2026-12-31' });

    expect(unidadLarga.status).toBe(400);
    const objetivo = await crearObjetivo(tokenEntrenador, idClienteAsignado, {
      meta: 'm'.repeat(255),
      unidad: 'u'.repeat(30),
    });
    expect(objetivo.meta).toBe('m'.repeat(255));
    expect(objetivo.unidad).toBe('u'.repeat(30));
  });

  it('test_rechaza_fecha_objetivo_ausente_o_invalida', async () => {
    const ausente = await request(app)
      .post('/api/objetivos')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ id_cliente: idClienteAsignado, meta: 'Meta válida' });
    const formatoInvalido = await request(app)
      .post('/api/objetivos')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ id_cliente: idClienteAsignado, meta: 'Meta válida', fecha_objetivo: '31-12-2026' });
    const fechaImposible = await request(app)
      .post('/api/objetivos')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ id_cliente: idClienteAsignado, meta: 'Meta válida', fecha_objetivo: '2026-02-30' });

    expect(ausente.status).toBe(400);
    expect(formatoInvalido.status).toBe(400);
    expect(fechaImposible.status).toBe(400);
  });

  it('test_entrenador_solo_consulta_objetivos_de_clientes_con_asignacion_vigente', async () => {
    const objetivoPropio = await crearObjetivo(tokenEntrenador, idClienteAsignado);
    const propios = await request(app)
      .get(`/api/objetivos?cliente=${idClienteAsignado}`)
      .set('Authorization', `Bearer ${tokenEntrenador}`);
    const ajenos = await request(app)
      .get(`/api/objetivos?cliente=${idClienteDeOtroEntrenador}`)
      .set('Authorization', `Bearer ${tokenEntrenador}`);
    const sinAsignacion = await request(app)
      .get(`/api/objetivos?cliente=${idClienteSinAsignar}`)
      .set('Authorization', `Bearer ${tokenEntrenador}`);

    expect(propios.status).toBe(200);
    expect(propios.body.data.some((objetivo) => objetivo.id_objetivo === objetivoPropio.id_objetivo)).toBe(true);
    expect(propios.body.data.every((objetivo) => objetivo.id_cliente === idClienteAsignado)).toBe(true);
    expect(ajenos.status).toBe(403);
    expect(sinAsignacion.status).toBe(403);
  });

  it('test_entrenador_asignado_registra_progreso_numerico_o_descriptivo', async () => {
    const objetivo = await crearObjetivo(tokenEntrenador, idClienteAsignado);
    const numerico = await crearProgreso(tokenEntrenador, idClienteAsignado, {
      id_objetivo: objetivo.id_objetivo,
      fecha: '2026-11-20',
      valor_numerico: 82.5,
      avance: null,
      comentario: 'Avance deportivo registrado',
    });
    const descriptivo = await crearProgreso(tokenEntrenador, idClienteAsignado, {
      fecha: '2026-11-21',
      valor_numerico: null,
      avance: 'Completó la rutina con mejor técnica',
    });

    expect(numerico.id_cliente).toBe(idClienteAsignado);
    expect(numerico.id_objetivo).toBe(objetivo.id_objetivo);
    // El contrato representa DECIMAL(8,2) como número JSON (ejemplo: 87.4).
    expect(numerico.valor_numerico).toBe(82.5);
    expect(numerico.fecha_registro).toBeTruthy();
    expect(descriptivo.avance).toBe('Completó la rutina con mejor técnica');
  });

  it('test_rechaza_progreso_sin_valor_ni_avance_o_con_valor_negativo', async () => {
    const vacio = await request(app)
      .post('/api/progresos')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ id_cliente: idClienteAsignado, fecha: '2026-11-20', comentario: 'Sin medición' });
    const negativo = await request(app)
      .post('/api/progresos')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ id_cliente: idClienteAsignado, fecha: '2026-11-20', valor_numerico: -1 });

    expect(vacio.status).toBe(400);
    expect(vacio.body.message).toContain('valor o un avance');
    expect(negativo.status).toBe(400);
  });

  it('test_rechaza_fecha_de_progreso_ausente_o_invalida', async () => {
    const ausente = await request(app)
      .post('/api/progresos')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ id_cliente: idClienteAsignado, avance: 'Avance medido' });
    const invalida = await request(app)
      .post('/api/progresos')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ id_cliente: idClienteAsignado, fecha: '2026-02-30', avance: 'Avance medido' });

    expect(ausente.status).toBe(400);
    expect(invalida.status).toBe(400);
  });

  it('test_rechaza_avance_y_comentario_fuera_de_sus_limites_de_longitud', async () => {
    const avanceLargo = await request(app)
      .post('/api/progresos')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ id_cliente: idClienteAsignado, fecha: '2026-11-20', avance: 'a'.repeat(151) });
    const comentarioLargo = await request(app)
      .post('/api/progresos')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({
        id_cliente: idClienteAsignado,
        fecha: '2026-11-20',
        valor_numerico: 10,
        comentario: 'c'.repeat(256),
      });

    expect(avanceLargo.status).toBe(400);
    expect(comentarioLargo.status).toBe(400);

    const limitesValidos = await crearProgreso(tokenEntrenador, idClienteAsignado, {
      fecha: '2026-11-22',
      valor_numerico: 10,
      avance: 'a'.repeat(150),
      comentario: 'c'.repeat(255),
    });
    expect(limitesValidos.avance).toBe('a'.repeat(150));
    expect(limitesValidos.comentario).toBe('c'.repeat(255));
  });

  it('test_rechaza_objetivo_inexistente_o_perteneciente_a_otro_cliente', async () => {
    const inexistente = await request(app)
      .post('/api/progresos')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ id_cliente: idClienteAsignado, id_objetivo: 999999, fecha: '2026-11-20', avance: 'Avance' });
    const ajeno = await request(app)
      .post('/api/progresos')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({
        id_cliente: idClienteAsignado,
        id_objetivo: idObjetivoDeOtroCliente,
        fecha: '2026-11-20',
        avance: 'Avance',
      });

    expect(inexistente.status).toBe(404);
    expect(ajeno.status).toBe(400);
  });

  it('test_actualiza_un_objetivo_activo_y_rechaza_editarlo_una_vez_cerrado', async () => {
    const objetivo = await crearObjetivo(tokenEntrenador, idClienteAsignado);
    const actualizacion = await request(app)
      .put(`/api/objetivos/${objetivo.id_objetivo}`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ meta: 'Meta actualizada', unidad: 'repeticiones', fecha_objetivo: '2027-01-15' });

    expect(actualizacion.status).toBe(200);
    expect(actualizacion.body.data.meta).toBe('Meta actualizada');
    expect(actualizacion.body.data.unidad).toBe('repeticiones');
    expect(actualizacion.body.data.fecha_objetivo).toBe('2027-01-15');

    const cierre = await request(app)
      .patch(`/api/objetivos/${objetivo.id_objetivo}/estado`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ estado: 'cerrado' });
    expect(cierre.status).toBe(200);
    expect(cierre.body.data.estado).toBe('cerrado');
    expect(cierre.body.data.fecha_cierre).toBeTruthy();

    const edicionCerrada = await request(app)
      .put(`/api/objetivos/${objetivo.id_objetivo}`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ meta: 'No debe cambiar', unidad: 'repeticiones', fecha_objetivo: '2027-02-01' });
    expect(edicionCerrada.status).toBe(400);
  });

  it('test_permite_transiciones_terminales_validas_y_rechaza_estados_invalidos_o_reapertura', async () => {
    const objetivoAlcanzado = await crearObjetivo(tokenEntrenador, idClienteAsignado);
    const alcanzado = await request(app)
      .patch(`/api/objetivos/${objetivoAlcanzado.id_objetivo}/estado`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ estado: 'alcanzado' });
    expect(alcanzado.status).toBe(200);
    expect(alcanzado.body.data.estado).toBe('alcanzado');
    expect(alcanzado.body.data.fecha_cierre).toBeTruthy();

    const reapertura = await request(app)
      .patch(`/api/objetivos/${objetivoAlcanzado.id_objetivo}/estado`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ estado: 'activo' });
    expect(reapertura.status).toBe(400);

    const objetivoParaEstadoInvalido = await crearObjetivo(tokenEntrenador, idClienteAsignado);
    const estadoInvalido = await request(app)
      .patch(`/api/objetivos/${objetivoParaEstadoInvalido.id_objetivo}/estado`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ estado: 'en progreso' });
    expect(estadoInvalido.status).toBe(400);
  });

  it('test_filtra_progresos_por_rango_y_devuelve_el_historial_en_orden_ascendente', async () => {
    const objetivo = await crearObjetivo(tokenEntrenador, idClienteAsignado);
    await crearProgreso(tokenEntrenador, idClienteAsignado, {
      id_objetivo: objetivo.id_objetivo,
      fecha: '2026-12-01',
      valor_numerico: 10,
      avance: null,
    });
    await crearProgreso(tokenEntrenador, idClienteAsignado, {
      id_objetivo: objetivo.id_objetivo,
      fecha: '2026-12-02',
      valor_numerico: 11,
      avance: null,
    });
    await crearProgreso(tokenEntrenador, idClienteAsignado, {
      id_objetivo: objetivo.id_objetivo,
      fecha: '2026-12-03',
      valor_numerico: 12,
      avance: null,
    });
    await crearProgreso(tokenEntrenador, idClienteAsignado, {
      id_objetivo: objetivo.id_objetivo,
      fecha: '2026-12-04',
      valor_numerico: 13,
      avance: null,
    });

    const respuesta = await request(app)
      .get(`/api/progresos?cliente=${idClienteAsignado}&desde=2026-12-02&hasta=2026-12-03`)
      .set('Authorization', `Bearer ${tokenEntrenador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.map((progreso) => progreso.fecha)).toEqual(['2026-12-02', '2026-12-03']);
    expect(respuesta.body.data.every((progreso) => progreso.id_cliente === idClienteAsignado)).toBe(true);
  });

  it('test_rechaza_registros_si_el_cliente_no_esta_asignado', async () => {
    const objetivo = await request(app)
      .post('/api/objetivos')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ id_cliente: idClienteSinAsignar, meta: 'Meta sin asignación', fecha_objetivo: '2026-12-31' });
    const progreso = await request(app)
      .post('/api/progresos')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ id_cliente: idClienteSinAsignar, fecha: '2026-11-20', avance: 'Avance sin asignación' });

    expect(objetivo.status).toBe(403);
    expect(progreso.status).toBe(403);
  });

  it('test_entrenador_inactivo_no_puede_registrar_objetivos_ni_progresos', async () => {
    const objetivo = await request(app)
      .post('/api/objetivos')
      .set('Authorization', `Bearer ${tokenEntrenadorInactivo}`)
      .send({ id_cliente: idClienteDeOtroEntrenador, meta: 'Meta bloqueada', fecha_objetivo: '2026-12-31' });
    const progreso = await request(app)
      .post('/api/progresos')
      .set('Authorization', `Bearer ${tokenEntrenadorInactivo}`)
      .send({ id_cliente: idClienteDeOtroEntrenador, fecha: '2026-11-20', avance: 'Avance bloqueado' });

    expect(objetivo.status).toBe(403);
    expect(progreso.status).toBe(403);
  });

  it('test_roles_no_autorizados_no_consultan_ni_registran_datos_individuales', async () => {
    const tokensNoAutorizados = [tokenAdmin, tokenRecepcionista, tokenCliente];

    for (const token of tokensNoAutorizados) {
      const consultaObjetivos = await request(app)
        .get(`/api/objetivos?cliente=${idClienteAsignado}`)
        .set('Authorization', `Bearer ${token}`);
      const altaObjetivo = await request(app)
        .post('/api/objetivos')
        .set('Authorization', `Bearer ${token}`)
        .send({ id_cliente: idClienteAsignado, meta: 'No autorizado', fecha_objetivo: '2026-12-31' });
      const consultaProgresos = await request(app)
        .get(`/api/progresos?cliente=${idClienteAsignado}`)
        .set('Authorization', `Bearer ${token}`);
      const altaProgreso = await request(app)
        .post('/api/progresos')
        .set('Authorization', `Bearer ${token}`)
        .send({ id_cliente: idClienteAsignado, fecha: '2026-11-20', avance: 'No autorizado' });

      expect(consultaObjetivos.status).toBe(403);
      expect(altaObjetivo.status).toBe(403);
      expect(consultaProgresos.status).toBe(403);
      expect(altaProgreso.status).toBe(403);
    }
  });

  it('test_edicion_parcial_conserva_los_campos_no_enviados_y_permite_quitar_la_unidad', async () => {
    const objetivo = await crearObjetivo(tokenEntrenador, idClienteAsignado, {
      meta: 'Meta original',
      unidad: 'kg',
    });
    const editar = (cambios) =>
      request(app)
        .put(`/api/objetivos/${objetivo.id_objetivo}`)
        .set('Authorization', `Bearer ${tokenEntrenador}`)
        .send(cambios);

    const soloMeta = await editar({ meta: 'Meta nueva' });
    expect(soloMeta.status).toBe(200);
    expect(soloMeta.body.data.meta).toBe('Meta nueva');
    expect(soloMeta.body.data.unidad).toBe('kg');
    expect(soloMeta.body.data.fecha_objetivo).toBe('2026-12-31');

    const sinUnidad = await editar({ unidad: null });
    expect(sinUnidad.status).toBe(200);
    expect(sinUnidad.body.data.unidad).toBeNull();
    expect(sinUnidad.body.data.meta).toBe('Meta nueva');

    const mismosDatos = await editar({ meta: 'Meta nueva' });
    expect(mismosDatos.status, 'Repetir el mismo valor no es un error').toBe(200);
  });

  it('test_rechaza_edicion_sin_campos_o_con_campos_obligatorios_vacios', async () => {
    const objetivo = await crearObjetivo(tokenEntrenador, idClienteAsignado);
    for (const cuerpo of [{}, { campo_desconocido: 'x' }, { meta: null }, { meta: '  ' }, { fecha_objetivo: null }]) {
      const respuesta = await request(app)
        .put(`/api/objetivos/${objetivo.id_objetivo}`)
        .set('Authorization', `Bearer ${tokenEntrenador}`)
        .send(cuerpo);
      expect(respuesta.status, `Debe rechazarse ${JSON.stringify(cuerpo)}`).toBe(400);
    }
  });

  it('test_objetivo_cerrado_no_cambia_de_estado_ni_admite_progresos_nuevos', async () => {
    const objetivo = await crearObjetivo(tokenEntrenador, idClienteAsignado);
    const cambiar = (estado) =>
      request(app)
        .patch(`/api/objetivos/${objetivo.id_objetivo}/estado`)
        .set('Authorization', `Bearer ${tokenEntrenador}`)
        .send({ estado });

    expect((await cambiar('cerrado')).status).toBe(200);
    expect((await cambiar('cerrado')).status).toBe(400);
    expect((await cambiar('alcanzado')).status).toBe(400);

    const progreso = await request(app)
      .post('/api/progresos')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({
        id_cliente: idClienteAsignado,
        id_objetivo: objetivo.id_objetivo,
        fecha: '2026-11-20',
        avance: 'Avance posterior al cierre',
      });
    expect(progreso.status).toBe(400);
  });

  it('test_modificar_objetivos_exige_rol_asignacion_perfil_activo_y_existencia', async () => {
    const objetivo = await crearObjetivo(tokenEntrenador, idClienteAsignado);
    const intentos = async (token, idObjetivo) => [
      await request(app)
        .put(`/api/objetivos/${idObjetivo}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ meta: 'Cambio no permitido' }),
      await request(app)
        .patch(`/api/objetivos/${idObjetivo}/estado`)
        .set('Authorization', `Bearer ${token}`)
        .send({ estado: 'cerrado' }),
    ];

    for (const token of [tokenAdmin, tokenRecepcionista, tokenCliente, tokenEntrenadorInactivo]) {
      for (const respuesta of await intentos(token, objetivo.id_objetivo)) {
        expect(respuesta.status).toBe(403);
      }
    }
    for (const respuesta of await intentos(tokenEntrenador, idObjetivoDeOtroCliente)) {
      expect(respuesta.status, 'Un objetivo de un cliente no asignado se deniega').toBe(403);
    }
    for (const respuesta of await intentos(tokenEntrenador, 999999)) {
      expect(respuesta.status).toBe(404);
    }
  });

  it('test_consultas_exigen_cliente_perfil_activo_y_un_periodo_valido', async () => {
    const consultar = (ruta, token = tokenEntrenador) =>
      request(app).get(ruta).set('Authorization', `Bearer ${token}`);

    expect((await consultar('/api/objetivos')).status).toBe(400);
    expect((await consultar('/api/progresos')).status).toBe(400);
    expect((await consultar(`/api/progresos?cliente=${idClienteAsignado}&desde=2026-02-30`)).status).toBe(400);
    const invertido = await consultar(
      `/api/progresos?cliente=${idClienteAsignado}&desde=2026-12-03&hasta=2026-12-02`
    );
    expect(invertido.status).toBe(400);
    expect(invertido.body.message).toContain('periodo');
    for (const recurso of ['objetivos', 'progresos']) {
      const inactivo = await consultar(
        `/api/${recurso}?cliente=${idClienteDeOtroEntrenador}`,
        tokenEntrenadorInactivo
      );
      expect(inactivo.status, `Un entrenador inactivo no consulta ${recurso}`).toBe(403);
    }
  });

  it('test_rechaza_la_referencia_de_correccion_sin_registrar_ninguna_entrada', async () => {
    const original = await crearProgreso(tokenEntrenador, idClienteAsignado);
    const contar = async () =>
      (
        await request(app)
          .get(`/api/progresos?cliente=${idClienteAsignado}`)
          .set('Authorization', `Bearer ${tokenEntrenador}`)
      ).body.data.length;
    const antes = await contar();

    const correccion = await request(app)
      .post('/api/progresos')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({
        id_cliente: idClienteAsignado,
        id_progreso_corregido: original.id_progreso,
        fecha: '2026-11-20',
        avance: 'Corrección',
      });

    expect(correccion.status).toBe(400);
    expect(correccion.body.message).toContain('id_progreso_corregido');
    expect(await contar()).toBe(antes);

    const sinReferencia = await crearProgreso(tokenEntrenador, idClienteAsignado, {
      id_progreso_corregido: null,
    });
    expect(sinReferencia.id_progreso).toBeTruthy();
  });

  it('test_acepta_el_valor_cero_y_fechas_pasadas', async () => {
    const progreso = await crearProgreso(tokenEntrenador, idClienteAsignado, {
      fecha: '2020-01-15',
      valor_numerico: 0,
      avance: null,
    });

    expect(progreso.valor_numerico).toBe(0);
    expect(progreso.fecha).toBe('2020-01-15');
  });

  it('test_sin_token_no_consulta_ni_registra_objetivos_o_progresos', async () => {
    const consulta = await request(app).get(`/api/objetivos?cliente=${idClienteAsignado}`);
    const alta = await request(app)
      .post('/api/progresos')
      .send({ id_cliente: idClienteAsignado, fecha: '2026-11-20', avance: 'Sin sesión' });

    expect(consulta.status).toBe(401);
    expect(alta.status).toBe(401);
  });
});
