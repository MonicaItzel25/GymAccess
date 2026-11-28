// tests/helpers/auditoriaFiltros.js
// Registros de auditoría con fechas, módulos y actores conocidos. Se insertan
// directamente para controlar la fecha. ES Modules.

import { expect } from 'vitest';
import request from 'supertest';
import { vaciarTablas, insertarUsuario } from './baseDatos.js';
import { ejecutar } from '../../src/config/db.js';

export async function sembrarAuditoria(app) {
  await vaciarTablas();
  const usuarios = {};
  const tokens = {};
  for (const [clave, nombre, rol] of [
    ['admin', 'Elsa Admin', 'administrador'],
    ['recepcion', 'Rosa Recepcion', 'recepcionista'],
    ['entrenador', 'Carlos Entrena', 'entrenador'],
    ['cliente', 'Ana Cliente', 'cliente'],
    ['rara', 'Cien % Segura', 'recepcionista'],
  ]) {
    const correo = `${clave}-aud3@prueba.com`;
    usuarios[clave] = await insertarUsuario({ nombre, correo, rol });
    const sesion = await request(app).post('/api/auth/login').send({ correo, password: 'Prueba1234' });
    expect(sesion.status, clave).toBe(200);
    tokens[clave] = sesion.body.data.token;
  }

  for (const [usuario, accion, modulo, fecha, resultado] of [
    ['admin', 'crear_usuario', 'usuarios', '2020-03-01 00:00:00', 'exitoso'],
    ['recepcion', 'asignar_entrenador', 'asignaciones', '2020-03-15 12:30:00', 'rechazado'],
    [null, 'intento_acceso', 'accesos', '2020-03-31 23:59:59', 'exitoso'],
    ['admin', 'modificar_cliente', 'clientes', '2020-02-29 23:59:59', 'exitoso'],
    ['rara', 'crear_cliente', 'clientes', '2020-04-01 00:00:00', 'error'],
  ]) {
    await ejecutar(
      `INSERT INTO auditoria (id_usuario, accion, modulo, fecha, resultado, descripcion)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [usuario ? usuarios[usuario] : null, accion, modulo, fecha, resultado, `Detalle de ${accion}`]
    );
  }

  return { usuarios, tokens };
}
