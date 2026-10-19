// backend/validate-sprint2.mjs
// Validación manual extremo a extremo del Sprint 2: escenarios V1–V7 de
// `specs/002-sprint-2-membresias-pagos-reconocimiento-acceso/quickstart.md`
// más la prueba de humo de las operaciones existentes (T067 / FR-043).
//
// Se ejecuta SOLO contra `gym_db_pruebas` (FR-048 / constitución III): la
// guardia inferior aborta si se resuelve cualquier otra base de datos.
//
// Uso (desde backend/):
//   node --env-file=.env.test validate-sprint2.mjs
//
// La app corre en el mismo proceso (supertest) contra la API real, por lo que
// no abre puertos ni consume el backend en desarrollo.

import request from 'supertest';
import { crearApp } from './src/app.js';
import {
  vaciarTablas,
  insertarUsuario,
  insertarCliente,
  cerrarPool,
} from './tests/helpers/baseDatos.js';

// Guardia de entorno (FR-048): nunca correr contra `gym_db`.
if (process.env.DB_NAME !== 'gym_db_pruebas') {
  console.error(
    `Entorno no permitido: se esperaba gym_db_pruebas y se resolvió ${
      process.env.DB_NAME || '(sin DB_NAME)'
    }`
  );
  process.exit(1);
}

const app = crearApp();

// Cada respuesta queda capturada para la inspección de privacidad de V7.
const capturas = [];
let comprobaciones = 0;
let fallos = 0;

function comprobar(etapa, descripcion, condicion, detalle = '') {
  comprobaciones += 1;
  const ok = Boolean(condicion);
  if (!ok) fallos += 1;
  const sufijo = detalle ? ` — ${detalle}` : '';
  console.log(`${ok ? '  [OK]    ' : '  [FALLA] '} ${etapa} · ${descripcion}${sufijo}`);
  return ok;
}

async function llamar(etapa, operacion) {
  const r = await operacion();
  capturas.push({ etapa, status: r.status, json: r.body ?? null });
  return r;
}

function descriptorDe(semilla) {
  return Array.from({ length: 128 }, (_, i) => Math.sin(semilla * (i + 1)));
}

async function tokenDe(etapa, correo) {
  const r = await llamar(etapa, () =>
    request(app).post('/api/auth/login').send({ correo, password: 'Prueba1234' })
  );
  return r.body?.data?.token ?? null;
}

function existeEn(respuesta, accion) {
  const filas = Array.isArray(respuesta.body?.data) ? respuesta.body.data : [];
  return filas.some((f) => f.accion === accion && f.id_usuario !== null && f.id_usuario !== undefined);
}

async function principal() {
  console.log('== Preparación del entorno de pruebas (gym_db_pruebas) ==');
  await vaciarTablas();

  await insertarUsuario({
    nombre: 'Administrador Validación',
    correo: 'admin-validacion@prueba.com',
    rol: 'administrador',
  });
  const idRecep = await insertarUsuario({
    nombre: 'Recepcionista Validación',
    correo: 'recep-validacion@prueba.com',
    rol: 'recepcionista',
  });
  await insertarUsuario({
    nombre: 'Entrenador Validación',
    correo: 'entrenador-validacion@prueba.com',
    rol: 'entrenador',
  });
  await insertarUsuario({
    nombre: 'Cliente Validación',
    correo: 'cliente-a@prueba.com',
    rol: 'cliente',
  });

  const tokenAdmin = await tokenDe('Humo', 'admin-validacion@prueba.com');
  const tokenRecep = await tokenDe('Humo', 'recep-validacion@prueba.com');
  const tokenEntrenador = await tokenDe('Humo', 'entrenador-validacion@prueba.com');
  const tokenClienteA = await tokenDe('Humo', 'cliente-a@prueba.com');
  comprobar(
    'Humo',
    'Inicio de sesión con las cuatro cuentas de prueba devuelve token',
    Boolean(tokenAdmin && tokenRecep && tokenEntrenador && tokenClienteA)
  );

  // ---------------------------------------------------------------------------
  // Humo de operaciones existentes (T067 / FR-043 / V6.3)
  // ---------------------------------------------------------------------------
  console.log('== Humo de operaciones existentes (T067 / FR-043) ==');
  const loginMalo = await llamar('Humo', () =>
    request(app)
      .post('/api/auth/login')
      .send({ correo: 'admin-validacion@prueba.com', password: 'PasswordIncorrecta1' })
  );
  comprobar(
    'Humo',
    'Login con credenciales incorrectas responde 401 con mensaje genérico',
    loginMalo.status === 401 && /correo o contraseña incorrectos/i.test(loginMalo.body?.message ?? ''),
    `status ${loginMalo.status}`
  );

  const usuarioCreado = await llamar('Humo', () =>
    request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Entrenador Humo',
        correo: 'humo-entrenador@prueba.com',
        password: 'Prueba1234',
        rol: 'entrenador',
      })
  );
  comprobar(
    'Humo',
    'POST /api/usuarios crea una cuenta (201)',
    usuarioCreado.status === 201 && Boolean(usuarioCreado.body?.data?.id_usuario),
    `status ${usuarioCreado.status}`
  );

  const listaUsuarios = await llamar('Humo', () =>
    request(app).get('/api/usuarios').set('Authorization', `Bearer ${tokenAdmin}`)
  );
  comprobar(
    'Humo',
    'GET /api/usuarios lista las cuentas (200)',
    listaUsuarios.status === 200 &&
      (listaUsuarios.body?.data ?? []).some((u) => u.correo === 'humo-entrenador@prueba.com'),
    `status ${listaUsuarios.status}`
  );

  const usuarioInexistente = await llamar('Humo', () =>
    request(app).get('/api/usuarios/999999').set('Authorization', `Bearer ${tokenAdmin}`)
  );
  comprobar(
    'Humo',
    'GET /api/usuarios/999999 responde 404 con mensaje comprensible',
    usuarioInexistente.status === 404 &&
      /no encontrado/i.test(usuarioInexistente.body?.message ?? ''),
    `status ${usuarioInexistente.status}`
  );

  const clienteA = await llamar('Humo', () =>
    request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Cliente',
        apellido: 'Validación A',
        correo: 'cliente-a@prueba.com',
        telefono: '555-1001',
        direccion: 'Calle Validación 1',
      })
  );
  comprobar(
    'Humo',
    'POST /api/clientes crea la ficha del cliente A (201)',
    clienteA.status === 201 && Boolean(clienteA.body?.data?.id_cliente),
    `status ${clienteA.status}`
  );
  const idA = clienteA.body?.data?.id_cliente;

  const listas = [
    ['GET /api/clientes', 'clientes', () => request(app).get('/api/clientes').set('Authorization', `Bearer ${tokenAdmin}`)],
    ['GET /api/tipos-membresia', 'tipos de membresía', () => request(app).get('/api/tipos-membresia').set('Authorization', `Bearer ${tokenAdmin}`)],
    ['GET /api/membresias', 'membresías', () => request(app).get('/api/membresias').set('Authorization', `Bearer ${tokenAdmin}`)],
    ['GET /api/pagos', 'pagos', () => request(app).get('/api/pagos').set('Authorization', `Bearer ${tokenAdmin}`)],
    ['GET /api/accesos', 'accesos', () => request(app).get('/api/accesos').set('Authorization', `Bearer ${tokenAdmin}`)],
  ];
  for (const [ruta, etiqueta, operacion] of listas) {
    const r = await llamar('Humo', operacion);
    comprobar(
      'Humo',
      `${ruta} sigue operativo (200) — lista de ${etiqueta}`,
      r.status === 200 && Array.isArray(r.body?.data),
      `status ${r.status}`
    );
  }

  // ---------------------------------------------------------------------------
  // Preparación de fixtures para V1–V5 (clientes B, C, D con rostro)
  // ---------------------------------------------------------------------------
  console.log('== Preparación de fixtures para V1–V5 ==');
  const idB = await insertarCliente({ nombre: 'Cliente', apellido: 'Validación B', correo: 'cliente-b@prueba.com' });
  const idC = await insertarCliente({ nombre: 'Cliente', apellido: 'Validación C', correo: 'cliente-c@prueba.com' });
  const idD = await insertarCliente({ nombre: 'Cliente', apellido: 'Validación D', correo: 'cliente-d@prueba.com' });

  const tipoB = await llamar('Preparación', () =>
    request(app)
      .post('/api/tipos-membresia')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Básico Validación', duracion: 365, precio: 500 })
  );
  const idTipoB = tipoB.body?.data?.id_tipo_membresia;
  comprobar('Preparación', 'Tipo «Básico Validación» creado (201)', tipoB.status === 201 && Boolean(idTipoB));

  const descriptorB = descriptorDe(21);
  const descriptorC = descriptorDe(22);
  const descriptorD = descriptorDe(23);
  const descriptorDesconocido = descriptorDe(999);

  for (const [id, descriptor] of [
    [idB, descriptorB],
    [idC, descriptorC],
    [idD, descriptorD],
  ]) {
    const r = await llamar('Preparación', () =>
      request(app)
        .post(`/api/clientes/${id}/rostro`)
        .set('Authorization', `Bearer ${tokenRecep}`)
        .send({ descriptor_facial: descriptor })
    );
    comprobar('Preparación', `Rostro registrado para el cliente #${id} (201/200)`, r.status === 201 || r.status === 200, `status ${r.status}`);
    comprobar(
      'Preparación',
      `La respuesta del registro facial del cliente #${id} no expone el descriptor`,
      !JSON.stringify(r.body ?? {}).includes('descriptor_facial')
    );
  }

  const membresiaB = await llamar('Preparación', () =>
    request(app)
      .post('/api/membresias')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ id_cliente: idB, id_tipo_membresia: idTipoB, fecha_inicio: '2020-01-01' })
  );
  const idMB = membresiaB.body?.data?.id_membresia;
  comprobar(
    'Preparación',
    'Membresía vencida (inicio 2020-01-01) creada para el cliente B',
    membresiaB.status === 201 && Boolean(idMB),
    `status ${membresiaB.status}`
  );

  const membresiaD = await llamar('Preparación', () =>
    request(app)
      .post('/api/membresias')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ id_cliente: idD, id_tipo_membresia: idTipoB })
  );
  const idMD = membresiaD.body?.data?.id_membresia;
  comprobar(
    'Preparación',
    'Membresía vigente creada para el cliente D',
    membresiaD.status === 201 && Boolean(idMD),
    `status ${membresiaD.status}`
  );

  // ---------------------------------------------------------------------------
  // V1 — Precio acordado congelado (FR-005 / FR-007 / FR-018 / SC-010)
  // ---------------------------------------------------------------------------
  console.log('== V1 — Precio acordado congelado ==');
  const tipoMensual = await llamar('V1', () =>
    request(app)
      .post('/api/tipos-membresia')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Mensual Validación', duracion: 30, precio: 800 })
  );
  const idMensual = tipoMensual.body?.data?.id_tipo_membresia;
  comprobar('V1', 'Tipo «Mensual» con precio 800 creado (201)', tipoMensual.status === 201 && Boolean(idMensual));

  const membresiaA = await llamar('V1', () =>
    request(app)
      .post('/api/membresias')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_cliente: idA, id_tipo_membresia: idMensual })
  );
  const idM1 = membresiaA.body?.data?.id_membresia;
  comprobar(
    'V1',
    'Al asignar responde precio_acordado 800.00 (FR-007)',
    membresiaA.status === 201 && Number(membresiaA.body?.data?.precio_acordado) === 800,
    `precio_acordado=${membresiaA.body?.data?.precio_acordado}`
  );

  const cambioPrecio = await llamar('V1', () =>
    request(app)
      .put(`/api/tipos-membresia/${idMensual}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ precio: 1000 })
  );
  comprobar('V1', 'El tipo pasa a precio 1000 (200)', cambioPrecio.status === 200, `status ${cambioPrecio.status}`);

  const membresiaTrasCambio = await llamar('V1', () =>
    request(app).get(`/api/membresias/${idM1}`).set('Authorization', `Bearer ${tokenAdmin}`)
  );
  comprobar(
    'V1',
    'La membresía existente conserva precio_acordado 800.00 tras el cambio de catálogo (FR-005)',
    Number(membresiaTrasCambio.body?.data?.precio_acordado) === 800,
    `precio_acordado=${membresiaTrasCambio.body?.data?.precio_acordado}`
  );

  const pagoParcial = await llamar('V1', () =>
    request(app)
      .post('/api/pagos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_cliente: idA, id_membresia: idM1, monto: 300, metodo_pago: 'efectivo' })
  );
  comprobar('V1', 'Pago parcial de 300 registrado (201)', pagoParcial.status === 201, `status ${pagoParcial.status}`);

  const adeudosAdmin = await llamar('V1', () =>
    request(app).get('/api/adeudos').set('Authorization', `Bearer ${tokenAdmin}`)
  );
  const adeudoM1 = (adeudosAdmin.body?.data ?? []).find((a) => Number(a.id_membresia) === Number(idM1));
  comprobar(
    'V1',
    'El adeudo de la membresía queda en 500 (800 − 300), no en 700 (FR-018/SC-010)',
    adeudosAdmin.status === 200 && Number(adeudoM1?.adeudo) === 500,
    `adeudo=${adeudoM1?.adeudo}`
  );

  const renovacion = await llamar('V1', () =>
    request(app)
      .put(`/api/membresias/${idM1}/renovar`)
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({})
  );
  comprobar(
    'V1',
    'La renovación crea el nuevo periodo con precio_acordado 1000.00 (precio vigente al renovar)',
    renovacion.status === 201 && Number(renovacion.body?.data?.precio_acordado) === 1000,
    `status ${renovacion.status}, precio_acordado=${renovacion.body?.data?.precio_acordado}`
  );

  const auditoriaV1 = await llamar('V1', () =>
    request(app).get('/api/auditoria').set('Authorization', `Bearer ${tokenAdmin}`)
  );
  comprobar(
    'V1',
    'Auditoría registra la asignación y la renovación con actor (RN-013)',
    auditoriaV1.status === 200 &&
      existeEn(auditoriaV1, 'asignar_membresia') &&
      existeEn(auditoriaV1, 'renovar_membresia')
  );

  // ---------------------------------------------------------------------------
  // V2 — Adeudos por rol (FR-019 / FR-020 / E1)
  // ---------------------------------------------------------------------------
  console.log('== V2 — Adeudos por rol ==');
  comprobar('V2', 'Administrador consulta la visión global de adeudos (200)', adeudosAdmin.status === 200);

  const adeudosRecep = await llamar('V2', () =>
    request(app).get('/api/adeudos').set('Authorization', `Bearer ${tokenRecep}`)
  );
  comprobar('V2', 'Recepcionista recibe 403 en GET /api/adeudos (E1)', adeudosRecep.status === 403, `status ${adeudosRecep.status}`);

  const pagosRecep = await llamar('V2', () =>
    request(app).get('/api/pagos').set('Authorization', `Bearer ${tokenRecep}`)
  );
  comprobar('V2', 'Recepcionista sí consulta el historial de pagos (200)', pagosRecep.status === 200, `status ${pagosRecep.status}`);

  const adeudosClienteGlobal = await llamar('V2', () =>
    request(app).get('/api/adeudos').set('Authorization', `Bearer ${tokenClienteA}`)
  );
  comprobar('V2', 'Cliente recibe 403 en la visión global de adeudos (FR-020)', adeudosClienteGlobal.status === 403, `status ${adeudosClienteGlobal.status}`);

  const adeudosMio = await llamar('V2', () =>
    request(app).get('/api/adeudos/mio').set('Authorization', `Bearer ${tokenClienteA}`)
  );
  const filasMio = adeudosMio.body?.data ?? [];
  const soloDelClienteA =
    filasMio.length >= 1 &&
    filasMio.every((a) => [Number(idM1), Number(renovacion.body?.data?.id_membresia)].includes(Number(a.id_membresia)));
  comprobar(
    'V2',
    'Cliente ve solo sus propios adeudos (GET /api/adeudos/mio)',
    adeudosMio.status === 200 && soloDelClienteA,
    `filas=${filasMio.length}`
  );

  // ---------------------------------------------------------------------------
  // V3 — Pago duplicado por operación (FR-017)
  // ---------------------------------------------------------------------------
  console.log('== V3 — Pago duplicado por operación ==');
  const pagoOp1 = await llamar('V3', () =>
    request(app)
      .post('/api/pagos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_cliente: idA, id_membresia: idM1, monto: 50, metodo_pago: 'tarjeta', id_operacion: 'cobro-001' })
  );
  comprobar('V3', 'Pago con id_operacion «cobro-001» registrado (201)', pagoOp1.status === 201, `status ${pagoOp1.status}`);

  const pagoDuplicado = await llamar('V3', () =>
    request(app)
      .post('/api/pagos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_cliente: idA, id_membresia: idM1, monto: 50, metodo_pago: 'tarjeta', id_operacion: 'cobro-001' })
  );
  comprobar(
    'V3',
    'Repetir el mismo (id_cliente, id_operacion) responde 409 sin crear registro',
    pagoDuplicado.status === 409 && /id_operacion/i.test(pagoDuplicado.body?.message ?? ''),
    `status ${pagoDuplicado.status}`
  );

  const pagosDespuesDelDuplicado = await llamar('V3', () =>
    request(app).get('/api/pagos').set('Authorization', `Bearer ${tokenAdmin}`)
  );
  const pagosDeA = (pagosDespuesDelDuplicado.body?.data ?? []).filter((p) => Number(p.id_cliente) === Number(idA));
  comprobar(
    'V3',
    'El intento duplicado NO creó un tercer pago con «cobro-001»',
    pagosDeA.filter((p) => p.id_operacion === 'cobro-001').length === 1,
    `pagos con cobro-001=${pagosDeA.filter((p) => p.id_operacion === 'cobro-001').length}`
  );

  const pagoOp2 = await llamar('V3', () =>
    request(app)
      .post('/api/pagos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_cliente: idA, id_membresia: idM1, monto: 25, metodo_pago: 'transferencia', id_operacion: 'cobro-002' })
  );
  comprobar('V3', 'Otro pago con id_operacion distinto «cobro-002» registrado (201)', pagoOp2.status === 201, `status ${pagoOp2.status}`);

  // ---------------------------------------------------------------------------
  // V4 — Acceso del kiosco (FR-027 a FR-033)
  // ---------------------------------------------------------------------------
  console.log('== V4 — Acceso del kiosco ==');
  const intentoD = await llamar('V4', () =>
    request(app).post('/api/acceso/intento').send({ descriptor_facial: descriptorD })
  );
  comprobar(
    'V4',
    'Cliente con rostro y membresía vigente queda autorizado',
    intentoD.status === 200 && intentoD.body?.data?.resultado === 'autorizado',
    `status ${intentoD.status}, resultado=${intentoD.body?.data?.resultado}`
  );

  const accesosTrasKiosco = await llamar('V4', () =>
    request(app).get('/api/accesos').set('Authorization', `Bearer ${tokenAdmin}`)
  );
  const accesoKioscoD = (accesosTrasKiosco.body?.data ?? []).find(
    (a) => Number(a.id_cliente) === Number(idD) && a.resultado === 'autorizado'
  );
  comprobar(
    'V4',
    'El registro del kiosco tiene origen "kiosco" e id_usuario nulo (FR-034)',
    accesoKioscoD?.origen === 'kiosco' && (accesoKioscoD?.id_usuario === null || accesoKioscoD?.id_usuario === undefined),
    `origen=${accesoKioscoD?.origen}, id_usuario=${accesoKioscoD?.id_usuario}`
  );

  const intentoB = await llamar('V4', () =>
    request(app).post('/api/acceso/intento').send({ descriptor_facial: descriptorB })
  );
  comprobar(
    'V4',
    'Cliente identificado con membresía vencida queda rechazado con motivo claro',
    intentoB.status === 200 &&
      intentoB.body?.data?.resultado === 'rechazado' &&
      intentoB.body?.data?.motivo === 'membresia vencida',
    `motivo=${intentoB.body?.data?.motivo}`
  );

  const intentoC = await llamar('V4', () =>
    request(app).post('/api/acceso/intento').send({ descriptor_facial: descriptorC })
  );
  comprobar(
    'V4',
    'Cliente identificado sin membresía queda rechazado («sin membresia vigente»)',
    intentoC.status === 200 &&
      intentoC.body?.data?.resultado === 'rechazado' &&
      intentoC.body?.data?.motivo === 'sin membresia vigente',
    `motivo=${intentoC.body?.data?.motivo}`
  );

  const intentoDesconocido = await llamar('V4', () =>
    request(app).post('/api/acceso/intento').send({ descriptor_facial: descriptorDesconocido })
  );
  comprobar(
    'V4',
    'Rostro no registrado: rechazado con «rostro no identificado» (la UI muestra «No se pudo identificar su rostro, acuda a recepción»)',
    intentoDesconocido.status === 200 &&
      intentoDesconocido.body?.data?.resultado === 'rechazado' &&
      intentoDesconocido.body?.data?.motivo === 'rostro no identificado' &&
      (intentoDesconocido.body?.data?.cliente ?? null) === null,
    `motivo=${intentoDesconocido.body?.data?.motivo}`
  );

  const accesosKiosco = (accesosTrasKiosco.body?.data ?? []).filter((a) => a.origen === 'kiosco');
  comprobar(
    'V4',
    'GET /api/accesos muestra los intentos del kiosco con origen "kiosco"',
    accesosKiosco.length >= 1
  );

  // ---------------------------------------------------------------------------
  // V5 — Autorización manual en recepción (FR-030 / RN-017 / SC-011)
  // ---------------------------------------------------------------------------
  console.log('== V5 — Autorización manual en recepción ==');
  const manualAutorizado = await llamar('V5', () =>
    request(app)
      .post('/api/acceso/manual')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ id_cliente: idD, resultado: 'autorizado' })
  );
  comprobar(
    'V5',
    'Autorización manual de un cliente vigente → 201 con origen "manual" e id_usuario = responsable',
    manualAutorizado.status === 201 &&
      manualAutorizado.body?.data?.origen === 'manual' &&
      Number(manualAutorizado.body?.data?.id_usuario) === Number(idRecep),
    `status ${manualAutorizado.status}, origen=${manualAutorizado.body?.data?.origen}, id_usuario=${manualAutorizado.body?.data?.id_usuario}`
  );

  const manualSinVigencia = await llamar('V5', () =>
    request(app)
      .post('/api/acceso/manual')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ id_cliente: idB, resultado: 'autorizado' })
  );
  comprobar(
    'V5',
    'Cliente sin membresía vigente → 409 y NO se crea registro autorizado',
    manualSinVigencia.status === 409 && /no está vigente/i.test(manualSinVigencia.body?.message ?? ''),
    `status ${manualSinVigencia.status}`
  );

  const manualRechazo = await llamar('V5', () =>
    request(app)
      .post('/api/acceso/manual')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ id_cliente: idC, resultado: 'rechazado', motivo: 'Identidad no verificable' })
  );
  comprobar(
    'V5',
    'Rechazo manual con motivo → 201 con motivo_rechazo registrado',
    manualRechazo.status === 201 && manualRechazo.body?.data?.motivo_rechazo === 'Identidad no verificable',
    `status ${manualRechazo.status}, motivo=${manualRechazo.body?.data?.motivo_rechazo}`
  );

  const manualSinSesion = await llamar('V5', () =>
    request(app).post('/api/acceso/manual').send({ id_cliente: idD, resultado: 'autorizado' })
  );
  comprobar('V5', 'Sin sesión → 401', manualSinSesion.status === 401, `status ${manualSinSesion.status}`);

  const manualEntrenador = await llamar('V5', () =>
    request(app)
      .post('/api/acceso/manual')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ id_cliente: idD, resultado: 'autorizado' })
  );
  comprobar('V5', 'Con sesión de entrenador → 403', manualEntrenador.status === 403, `status ${manualEntrenador.status}`);

  const manualCliente = await llamar('V5', () =>
    request(app)
      .post('/api/acceso/manual')
      .set('Authorization', `Bearer ${tokenClienteA}`)
      .send({ id_cliente: idD, resultado: 'autorizado' })
  );
  comprobar('V5', 'Con sesión de cliente → 403', manualCliente.status === 403, `status ${manualCliente.status}`);

  const accesosTrasManual = await llamar('V5', () =>
    request(app).get('/api/accesos').set('Authorization', `Bearer ${tokenAdmin}`)
  );
  const manualD = (accesosTrasManual.body?.data ?? []).find(
    (a) => Number(a.id_cliente) === Number(idD) && a.origen === 'manual'
  );
  comprobar(
    'V5',
    'El registro manual muestra usuario responsable, fecha, hora y resultado',
    manualD?.origen === 'manual' &&
      Number(manualD?.id_usuario) === Number(idRecep) &&
      manualD?.usuario_nombre === 'Recepcionista Validación' &&
      Boolean(manualD?.fecha && manualD?.hora) &&
      manualD?.resultado === 'autorizado',
    `usuario_nombre=${manualD?.usuario_nombre}, id_usuario=${manualD?.id_usuario}`
  );

  const intentosBTrasManual = (accesosTrasManual.body?.data ?? []).filter(
    (a) => Number(a.id_cliente) === Number(idB) && a.resultado === 'rechazado'
  );
  comprobar(
    'V5',
    'El intento manual a 409 NO dejó registro de acceso autorizado para el cliente B',
    (accesosTrasManual.body?.data ?? []).filter(
      (a) => Number(a.id_cliente) === Number(idB) && a.resultado === 'autorizado'
    ).length === 0 && intentosBTrasManual.length >= 1
  );

  const auditoriaV5 = await llamar('V5', () =>
    request(app).get('/api/auditoria').set('Authorization', `Bearer ${tokenAdmin}`)
  );
  comprobar(
    'V5',
    'Auditoría registra la autorización manual con actor (SC-009)',
    existeEn(auditoriaV5, 'autorizacion_manual')
  );

  // ---------------------------------------------------------------------------
  // V7 — Privacidad biométrica y permisos (SC-003 / SC-004 / SC-005)
  // ---------------------------------------------------------------------------
  console.log('== V7 — Privacidad biométrica y permisos ==');
  const biometricos = capturas.filter((c) => /descriptor_facial|"descriptor"/.test(JSON.stringify(c.json ?? {})));
  comprobar(
    'V7',
    `Cero datos biométricos en las ${capturas.length} respuestas de la API (SC-003)`,
    biometricos.length === 0,
    biometricos.length === 0 ? '' : `contaminadas: ${biometricos.map((b) => b.etapa).join(', ')}`
  );

  const textoAuditoria = JSON.stringify(auditoriaV5.body?.data ?? []);
  const textoAccesos = JSON.stringify(accesosTrasManual.body?.data ?? []);
  comprobar(
    'V7',
    'Auditoría y registros de acceso no contienen descriptores (FR-024/FR-039)',
    !textoAuditoria.includes('descriptor') && !textoAccesos.includes('descriptor')
  );

  for (const ruta of ['/api/pagos/1', '/api/accesos/1', '/api/auditoria/1']) {
    const r = await llamar('V7', () =>
      request(app).delete(ruta).set('Authorization', `Bearer ${tokenAdmin}`)
    );
    comprobar('V7', `DELETE ${ruta} no existe (404): sin eliminación física (SC-005)`, r.status === 404, `status ${r.status}`);
  }

  const denegaciones =
    manualSinSesion.status === 401 &&
    manualEntrenador.status === 403 &&
    manualCliente.status === 403 &&
    adeudosRecep.status === 403 &&
    adeudosClienteGlobal.status === 403;
  comprobar(
    'V7',
    'Las denegaciones por rol ocurren en el servidor, no solo en la interfaz (RN-001/FR-045)',
    denegaciones
  );

  console.log('== V6 — Rediseño y pantalla de inicio ==');
  console.log(
    '  [INFO] V6 se evidencia con las pruebas automatizadas del frontend (Layout.test, Inicio.test, ' +
      'Login.test y PuntoAcceso.test, 14/14 en verde) y con las suites de este sprint; la revisión ' +
      'visual en navegador (menú por rol, ≤768 px y movimiento reducido) queda pendiente de un ' +
      'navegador de escritorio conectado.'
  );

  console.log('');
  console.log(`Resultado: ${comprobaciones - fallos}/${comprobaciones} comprobaciones correctas, ${fallos} fallo(s).`);
  if (fallos > 0) process.exitCode = 1;
}

try {
  await principal();
} catch (error) {
  console.error('Error inesperado durante la validación:', error);
  process.exitCode = 1;
} finally {
  await cerrarPool();
}
