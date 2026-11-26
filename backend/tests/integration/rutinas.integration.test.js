// Pruebas de integración: rutinas de entrenamiento (US-S3-03, Sprint 3).
//   - Activar una rutina nueva deja la anterior `inactiva`: una única activa
//     por cliente (Q5/SC-003; reforzada por el UNIQUE (id_cliente, esta_activa)).
//   - Modificar conserva el historial de versiones (FR-015, research R-04):
//     las filas antiguas permanecen sin borrado físico (FR-017).
//   - Tras la reasignación del cliente (Q1/FR-017), el nuevo entrenador
//     consulta y modifica la rutina creada por el anterior; el anterior
//     pierde el acceso (403).
//   - Crear, modificar y cambiar estado quedan en auditoría (FR-018).

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
  return respuesta.body.data.token;
}

describe('Integración de rutinas de entrenamiento', () => {
  let tokenAdmin;
  let tokenEntrenador;
  let tokenEntrenador2;
  let idCuentaEntrenador;
  let idCuentaEntrenador2;
  let idEntrenador;
  let idEntrenador2;
  let idCliente;
  let idAsignacion;
  let idEjercicio;
  let idRutinaA;
  let idRutinaB;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Admin Rutinas Int', correo: 'admin-rut-int@prueba.com', rol: 'administrador' });
    idCuentaEntrenador = await insertarUsuario({ nombre: 'Entrenador Uno Int', correo: 'ent-rut-int@prueba.com', rol: 'entrenador' });
    idCuentaEntrenador2 = await insertarUsuario({ nombre: 'Entrenador Dos Int', correo: 'ent2-rut-int@prueba.com', rol: 'entrenador' });
    idCliente = await insertarCliente({ nombre: 'Ana', apellido: 'Integracion', correo: 'ana-rut-int@prueba.com' });

    tokenAdmin = await tokenDe('admin-rut-int@prueba.com');
    tokenEntrenador = await tokenDe('ent-rut-int@prueba.com');
    tokenEntrenador2 = await tokenDe('ent2-rut-int@prueba.com');

    const perfil1 = await request(app)
      .post('/api/entrenadores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_usuario: idCuentaEntrenador });
    idEntrenador = perfil1.body.data.id_entrenador;
    const perfil2 = await request(app)
      .post('/api/entrenadores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_usuario: idCuentaEntrenador2 });
    idEntrenador2 = perfil2.body.data.id_entrenador;

    const asignacion = await request(app)
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_cliente: idCliente, id_entrenador: idEntrenador });
    idAsignacion = asignacion.body.data.id_asignacion;

    const ejercicio = await request(app)
      .post('/api/ejercicios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Press de banca', descripcion: 'Empuje horizontal', grupo_muscular: 'Pecho' });
    idEjercicio = ejercicio.body.data.id_ejercicio;
  });

  afterAll(async () => {
    await cerrarPool();
  });

  async function crearRutina(nombre) {
    const respuesta = await request(app)
      .post('/api/rutinas')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({
        id_cliente: idCliente,
        nombre,
        ejercicios: [{
          id_ejercicio: idEjercicio,
          orden: 1,
          series: 4,
          repeticiones: 8,
          peso_recomendado: 60,
          descanso_segundos: 90,
          instrucciones: 'Bajar controlado',
        }],
      });
    expect(respuesta.status).toBe(201);
    return respuesta.body.data;
  }

  it('activar una rutina nueva deja la anterior inactiva: una sola activa por cliente (Q5/SC-003)', async () => {
    const rutinaA = await crearRutina('Versión 1 - Empuje');
    idRutinaA = rutinaA.id_rutina;
    const activarA = await request(app)
      .patch(`/api/rutinas/${idRutinaA}/estado`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ estado: 'activa' });
    expect(activarA.status).toBe(200);
    expect(activarA.body.data.estado).toBe('activa');

    const rutinaB = await crearRutina('Versión 2 - Full body');
    idRutinaB = rutinaB.id_rutina;
    const activarB = await request(app)
      .patch(`/api/rutinas/${idRutinaB}/estado`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ estado: 'activa' });
    expect(activarB.status).toBe(200);
    expect(activarB.body.data.estado).toBe('activa');

    // La anterior quedó inactiva en la misma operación.
    const detalleA = await request(app)
      .get(`/api/rutinas/${idRutinaA}`)
      .set('Authorization', `Bearer ${tokenEntrenador}`);
    expect(detalleA.body.data.estado).toBe('inactiva');

    // Verificación a nivel de datos: exactamente una activa para el cliente.
    const [filas] = await obtenerPool().execute(
      "SELECT COUNT(*) AS total FROM rutinas WHERE id_cliente = ? AND estado = 'activa'",
      [idCliente]
    );
    expect(Number(filas[0].total)).toBe(1);
  });

  it('modificar conserva el historial de versiones y actualiza la rutina (FR-015, FR-017)', async () => {
    const modificacion = await request(app)
      .put(`/api/rutinas/${idRutinaB}`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({
        nombre: 'Versión 2 ajustada',
        ejercicios: [{
          id_ejercicio: idEjercicio,
          orden: 1,
          series: 5,
          repeticiones: 6,
          instrucciones: 'Tempo controlado',
        }],
      });
    expect(modificacion.status).toBe(200);
    expect(modificacion.body.data.nombre).toBe('Versión 2 ajustada');
    expect(modificacion.body.data.ejercicios[0].series).toBe(5);

    // Historial: ambas filas persisten sin borrado físico (SC-004).
    const [filas] = await obtenerPool().execute(
      `SELECT id_rutina, nombre, estado, fecha_actualizacion
       FROM rutinas WHERE id_cliente = ? ORDER BY id_rutina`,
      [idCliente]
    );
    expect(filas.length).toBe(2);
    expect(filas.find((f) => f.id_rutina === idRutinaA).nombre).toBe('Versión 1 - Empuje');
    const rutinaB = filas.find((f) => f.id_rutina === idRutinaB);
    expect(rutinaB.nombre).toBe('Versión 2 ajustada');
    expect(rutinaB.fecha_actualizacion).toBeTruthy();
  });

  it('tras la reasignación, el nuevo entrenador consulta y modifica la rutina creada por el anterior (Q1/FR-017)', async () => {
    // El cliente pasa del entrenador 1 al entrenador 2.
    const finalizar = await request(app)
      .put(`/api/asignaciones/${idAsignacion}/finalizar`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});
    expect(finalizar.status).toBe(200);
    const nuevaAsignacion = await request(app)
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_cliente: idCliente, id_entrenador: idEntrenador2 });
    expect(nuevaAsignacion.status).toBe(201);

    // El nuevo entrenador ve las rutinas históricas del cliente (creadas por otro).
    const lista = await request(app)
      .get(`/api/rutinas?cliente=${idCliente}`)
      .set('Authorization', `Bearer ${tokenEntrenador2}`);
    expect(lista.status).toBe(200);
    expect(lista.body.data.map((r) => r.id_rutina)).toContain(idRutinaB);

    const detalle = await request(app)
      .get(`/api/rutinas/${idRutinaB}`)
      .set('Authorization', `Bearer ${tokenEntrenador2}`);
    expect(detalle.status).toBe(200);

    const modificacion = await request(app)
      .put(`/api/rutinas/${idRutinaB}`)
      .set('Authorization', `Bearer ${tokenEntrenador2}`)
      .send({ nombre: 'Versión 2 - Reasignada' });
    expect(modificacion.status).toBe(200);
    expect(modificacion.body.data.nombre).toBe('Versión 2 - Reasignada');

    // El entrenador anterior ya sin asignación pierde el acceso (403).
    const listaAnterior = await request(app)
      .get('/api/rutinas')
      .set('Authorization', `Bearer ${tokenEntrenador}`);
    expect(listaAnterior.status).toBe(200);
    expect(listaAnterior.body.data).toHaveLength(0);
    const detalleAnterior = await request(app)
      .get(`/api/rutinas/${idRutinaB}`)
      .set('Authorization', `Bearer ${tokenEntrenador}`);
    expect(detalleAnterior.status).toBe(403);
  });

  it('crear, modificar y cambiar estado quedan en auditoría con actor, fecha y resultado (FR-018)', async () => {
    const [registros] = await obtenerPool().execute(
      `SELECT a.accion, a.modulo, a.fecha, a.resultado, a.id_usuario
       FROM auditoria a
       WHERE a.modulo = 'rutinas'
       ORDER BY a.id_auditoria`,
      []
    );

    const acciones = registros.map((r) => r.accion);
    expect(acciones).toContain('crear_rutina');
    expect(acciones).toContain('modificar_rutina');
    expect(acciones).toContain('cambiar_estado_rutina');

    for (const registro of registros) {
      expect(registro.modulo).toBe('rutinas');
      expect(registro.resultado).toBe('exitoso');
      expect(registro.fecha).toBeTruthy();
    }

    // Creación y activación por el primer entrenador; modificación por el segundo.
    expect(registros.some((r) => r.accion === 'crear_rutina' && r.id_usuario === idCuentaEntrenador)).toBe(true);
    expect(registros.some((r) => r.accion === 'modificar_rutina' && r.id_usuario === idCuentaEntrenador2)).toBe(true);
  });
});
