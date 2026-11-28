// tests/helpers/personalAsignado.js
// Tres entrenadores con distinta carga (dos, cero y una asignación finalizada)
// creados por la API, como en el uso real. ES Modules.

import { expect } from 'vitest';
import request from 'supertest';
import { vaciarTablas, insertarUsuario, insertarCliente } from './baseDatos.js';

export async function prepararPersonal(app) {
  await vaciarTablas();

  const tokens = {};
  const cuentas = {};
  for (const [clave, rol] of [
    ['admin', 'administrador'], ['recepcion', 'recepcionista'], ['cliente', 'cliente'],
    ['conCarga', 'entrenador'], ['sinCarga', 'entrenador'], ['soloHistorial', 'entrenador'],
  ]) {
    const correo = `${clave.toLowerCase()}-us9@prueba.com`;
    cuentas[clave] = await insertarUsuario({ nombre: `Cuenta ${clave}`, correo, rol });
    const sesion = await request(app).post('/api/auth/login').send({ correo, password: 'Prueba1234' });
    expect(sesion.status, clave).toBe(200);
    tokens[clave] = sesion.body.data.token;
  }

  async function enviar(metodo, ruta, cuerpo, estado = 201) {
    const r = await request(app)[metodo](ruta).set('Authorization', `Bearer ${tokens.admin}`).send(cuerpo);
    expect(r.status, `${ruta}: ${r.body.message ?? ''}`).toBe(estado);
    return r.body.data;
  }

  const entrenadores = {};
  for (const clave of ['conCarga', 'sinCarga', 'soloHistorial']) {
    const perfil = await enviar('post', '/api/entrenadores', { id_usuario: cuentas[clave] });
    entrenadores[clave] = perfil.id_entrenador;
  }

  const asignaciones = [];
  for (const [indice, clave] of ['conCarga', 'conCarga', 'soloHistorial'].entries()) {
    const idCliente = await insertarCliente({
      nombre: `Socio${indice + 1}`, apellido: 'US9', correo: `socio${indice + 1}-us9@prueba.com`,
    });
    const asignacion = await enviar('post', '/api/asignaciones', {
      id_cliente: idCliente, id_entrenador: entrenadores[clave],
    });
    asignaciones.push(asignacion.id_asignacion);
  }
  await enviar('put', `/api/asignaciones/${asignaciones[2]}/finalizar`, {}, 200);

  return { tokens, entrenadores, asignaciones, enviar };
}
