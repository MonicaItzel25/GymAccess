// pages/Asignaciones.test.jsx
// Pruebas de la pantalla de asignación de entrenador a cliente (US-S3-02):
//   1. Listado con nombre del cliente, entrenador y estado (vigente/finalizada).
//   2. Listas descriptivas de clientes y entrenadores, con homónimos.
//   3. Estados de carga, vacío, error y reintento; bloqueo del envío.
//   4. Alta y finalización con actualización de las opciones.
// Se usa un doble de `services/api` para no depender del backend (FR-046).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Asignaciones from './Asignaciones';

const session = vi.hoisted(() => ({ rol: 'recepcionista' }));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    usuario: { id_usuario: 1, nombre: 'Rosa Recepcion', correo: 'rosa@gimnasio.mx', rol: session.rol },
    cargando: false,
  }),
}));

vi.mock('../services/api', () => ({
  api: {
    listarAsignaciones: vi.fn(),
    listarClientes: vi.fn(),
    listarEntrenadores: vi.fn(),
    listarUsuarios: vi.fn(),
    crearAsignacion: vi.fn(),
    finalizarAsignacion: vi.fn(),
  },
}));

import { api } from '../services/api';

function pintar() {
  return render(
    <MemoryRouter>
      <Asignaciones />
    </MemoryRouter>
  );
}

function cliente(id, nombre, apellido, extra = {}) {
  return { id_cliente: id, nombre, apellido, correo: null, telefono: null, estado: 'activo', ...extra };
}

function entrenador(id, nombre, extra = {}) {
  return { id_entrenador: id, nombre, especialidad: 'Fuerza', telefono: null, estado: 'activo', ...extra };
}

function asignacion(id, extra = {}) {
  return {
    id_asignacion: id,
    id_cliente: 5,
    id_entrenador: 2,
    cliente_nombre: 'Ana',
    cliente_apellido: 'Cliente',
    entrenador_nombre: 'Carlos Ruiz',
    fecha_inicio: '2026-10-01',
    fecha_fin: null,
    estado: 'vigente',
    ...extra,
  };
}

const listaClientes = () => screen.getByLabelText('Cliente');
const listaEntrenadores = () => screen.getByLabelText('Entrenador');
const opciones = (lista) => within(lista).getAllByRole('option').slice(1);
const textos = (lista) => opciones(lista).map((opcion) => opcion.textContent);
const botonAsignar = () => screen.getByRole('button', { name: /asignar entrenador/i });
const tabla = () => within(screen.getByRole('table'));

async function esperarListas() {
  await waitFor(() => {
    expect(listaClientes().disabled).toBe(false);
    expect(listaEntrenadores().disabled).toBe(false);
  });
}

async function elegir(idCliente, idEntrenador) {
  await esperarListas();
  fireEvent.change(listaClientes(), { target: { value: String(idCliente) } });
  fireEvent.change(listaEntrenadores(), { target: { value: String(idEntrenador) } });
}

describe('Pantalla de asignaciones', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    session.rol = 'recepcionista';
    api.listarAsignaciones.mockResolvedValue([]);
    api.listarClientes.mockResolvedValue([cliente(5, 'Ana', 'Cliente')]);
    api.listarEntrenadores.mockResolvedValue([entrenador(2, 'Carlos Ruiz')]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('test_muestra_listado_con_cliente_entrenador_y_estado', async () => {
    api.listarAsignaciones.mockResolvedValue([
      asignacion(1),
      asignacion(2, {
        id_cliente: 6,
        cliente_nombre: 'Bruno',
        cliente_apellido: 'Socio',
        entrenador_nombre: 'Diana Lopez',
        fecha_fin: '2026-09-30',
        estado: 'finalizada',
      }),
    ]);

    pintar();

    await screen.findByRole('cell', { name: 'Ana Cliente' });
    expect(tabla().getByText('Carlos Ruiz')).toBeTruthy();
    expect(tabla().getByText('Vigente')).toBeTruthy();
    expect(tabla().getByText('Finalizada')).toBeTruthy();
    expect(api.listarAsignaciones).toHaveBeenCalled();
  });

  it('test_muestra_nombres_y_especialidad_sin_ids_ni_datos_de_contacto', async () => {
    api.listarClientes.mockResolvedValue([
      cliente(5, 'Ana', 'Cliente', { correo: 'ana@correo.mx', telefono: '555-0001' }),
    ]);
    api.listarEntrenadores.mockResolvedValue([
      entrenador(2, 'Carlos Ruiz', { telefono: '555-0002' }),
      entrenador(3, 'Diana Lopez', { especialidad: null }),
    ]);

    pintar();
    await esperarListas();

    expect(textos(listaClientes())).toEqual(['Ana Cliente']);
    expect(textos(listaEntrenadores())).toEqual([
      'Carlos Ruiz — Fuerza',
      'Diana Lopez — Sin especialidad',
    ]);
    expect(opciones(listaClientes())[0].value).toBe('5');
  });

  it('test_deshabilita_los_clientes_con_asignacion_vigente_y_lo_indica', async () => {
    api.listarClientes.mockResolvedValue([
      cliente(5, 'Ana', 'Cliente'),
      cliente(6, 'Bruno', 'Socio'),
    ]);
    api.listarAsignaciones.mockResolvedValue([
      asignacion(1),
      asignacion(2, { id_cliente: 6, estado: 'finalizada', fecha_fin: '2026-09-30' }),
    ]);

    pintar();
    await esperarListas();

    const [ana, bruno] = opciones(listaClientes());
    expect(ana.textContent).toBe('Ana Cliente · Ya tiene una asignación vigente');
    expect(ana.disabled).toBe(true);
    expect(bruno.textContent).toBe('Bruno Socio');
    expect(bruno.disabled).toBe(false);
  });

  it('test_excluye_clientes_y_entrenadores_inactivos', async () => {
    api.listarClientes.mockResolvedValue([
      cliente(5, 'Ana', 'Cliente'),
      cliente(7, 'Ivan', 'Inactivo', { estado: 'inactivo' }),
    ]);
    api.listarEntrenadores.mockResolvedValue([
      entrenador(2, 'Carlos Ruiz'),
      entrenador(4, 'Elena Baja', { estado: 'inactivo' }),
    ]);

    pintar();
    await esperarListas();

    expect(textos(listaClientes())).toEqual(['Ana Cliente']);
    expect(textos(listaEntrenadores())).toEqual(['Carlos Ruiz — Fuerza']);
  });

  it('test_distingue_clientes_homonimos_con_correo_o_telefono_y_en_ultimo_caso_con_id', async () => {
    api.listarClientes.mockResolvedValue([
      cliente(1, 'Luis', 'Perez', { correo: 'luis@correo.mx', telefono: '555-1111' }),
      cliente(2, 'Luis', 'Perez', { telefono: '555-2222' }),
      cliente(3, 'Mara', 'Gil', { telefono: '555-3333' }),
      cliente(4, 'mara', 'gil ', { telefono: '555-3333' }),
      cliente(8, 'Noe', 'Sol'),
      cliente(9, 'Noe', 'Sol'),
    ]);

    pintar();
    await esperarListas();

    expect(textos(listaClientes()).map((t) => t.replace(/\s+/g, ' ').trim())).toEqual([
      'Luis Perez — luis@correo.mx',
      'Luis Perez — 555-2222',
      'Mara Gil — 555-3333 (ID 3)',
      'mara gil — 555-3333 (ID 4)',
      'Noe Sol (ID 8)',
      'Noe Sol (ID 9)',
    ]);
  });

  it('test_distingue_entrenadores_homonimos_con_telefono_y_en_ultimo_caso_con_id', async () => {
    api.listarEntrenadores.mockResolvedValue([
      entrenador(1, 'Sara Paz', { especialidad: 'Yoga', telefono: '555-0001' }),
      entrenador(2, 'Sara Paz', { telefono: '555-0002' }),
      entrenador(3, 'Sara Paz', { telefono: '555-0003' }),
      entrenador(4, 'Omar Rey'),
      entrenador(6, 'Omar Rey'),
    ]);

    pintar();
    await esperarListas();

    expect(textos(listaEntrenadores())).toEqual([
      'Sara Paz — Yoga',
      'Sara Paz — Fuerza — 555-0002',
      'Sara Paz — Fuerza — 555-0003',
      'Omar Rey — Fuerza (ID 4)',
      'Omar Rey — Fuerza (ID 6)',
    ]);
  });

  it('test_da_de_alta_una_asignacion_desde_el_formulario', async () => {
    api.crearAsignacion.mockResolvedValue({ id_asignacion: 3 });

    pintar();
    await elegir(5, 2);
    fireEvent.click(botonAsignar());

    expect(await screen.findByRole('status')).toBeTruthy();
    expect(api.crearAsignacion).toHaveBeenCalledWith({ id_cliente: 5, id_entrenador: 2, fecha_inicio: null });
  });

  it('test_tras_asignar_actualiza_la_tabla_y_deshabilita_al_cliente', async () => {
    api.listarClientes.mockResolvedValue([
      cliente(5, 'Ana', 'Cliente'),
      cliente(6, 'Bruno', 'Socio'),
    ]);
    api.listarAsignaciones.mockResolvedValueOnce([]).mockResolvedValue([asignacion(3)]);
    api.crearAsignacion.mockResolvedValue({ id_asignacion: 3 });

    pintar();
    await elegir(5, 2);
    fireEvent.click(botonAsignar());

    await screen.findByRole('cell', { name: 'Ana Cliente' });
    await waitFor(() => expect(opciones(listaClientes())[0].disabled).toBe(true));
    expect(listaClientes().value).toBe('');
    expect(api.listarClientes).toHaveBeenCalledTimes(2);
    expect(api.listarEntrenadores).toHaveBeenCalledTimes(2);
  });

  it('test_muestra_el_mensaje_de_error_cuando_el_backend_rechaza_el_alta', async () => {
    api.crearAsignacion.mockRejectedValue(
      new Error('El cliente ya tiene un entrenador asignado vigente')
    );

    pintar();
    await elegir(5, 2);
    fireEvent.click(botonAsignar());

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('ya tiene un entrenador asignado vigente');
    expect(botonAsignar().disabled).toBe(false);
  });

  it('test_no_envia_sin_seleccionar_cliente_y_entrenador', async () => {
    pintar();
    await esperarListas();

    expect(listaClientes().required).toBe(true);
    expect(listaEntrenadores().required).toBe(true);
    fireEvent.change(listaClientes(), { target: { value: '5' } });
    fireEvent.submit(botonAsignar().closest('form'));

    expect((await screen.findByRole('alert')).textContent).toContain('Selecciona un cliente y un entrenador');
    expect(api.crearAsignacion).not.toHaveBeenCalled();
  });

  it('test_bloquea_el_envio_mientras_se_procesa_y_evita_duplicados', async () => {
    let terminar;
    api.crearAsignacion.mockReturnValue(new Promise((resolver) => { terminar = resolver; }));

    pintar();
    await elegir(5, 2);
    const formulario = botonAsignar().closest('form');
    fireEvent.click(botonAsignar());

    expect(screen.getByRole('button', { name: 'Procesando…' }).disabled).toBe(true);
    fireEvent.submit(formulario);
    expect(api.crearAsignacion).toHaveBeenCalledTimes(1);

    terminar({ id_asignacion: 3 });
    expect(await screen.findByRole('button', { name: /asignar entrenador/i })).toBeTruthy();
  });

  it('test_muestra_indicadores_de_carga_y_bloquea_el_envio_mientras_carga', () => {
    const pendiente = new Promise(() => {});
    api.listarAsignaciones.mockReturnValue(pendiente);
    api.listarClientes.mockReturnValue(pendiente);
    api.listarEntrenadores.mockReturnValue(pendiente);

    pintar();

    expect(screen.getByText('Cargando clientes…')).toBeTruthy();
    expect(screen.getByText('Cargando entrenadores…')).toBeTruthy();
    expect(screen.getByText('Cargando asignaciones…')).toBeTruthy();
    expect(screen.queryByText(/No hay asignaciones registradas/)).toBeNull();
    expect(listaClientes().disabled).toBe(true);
    expect(listaEntrenadores().disabled).toBe(true);
    expect(botonAsignar().disabled).toBe(true);
  });

  it('test_muestra_estados_vacios_cuando_no_hay_registros', async () => {
    api.listarClientes.mockResolvedValue([]);
    api.listarEntrenadores.mockResolvedValue([]);

    pintar();

    expect(await screen.findByText('No hay clientes activos.')).toBeTruthy();
    expect(screen.getByText('No hay entrenadores activos.')).toBeTruthy();
    expect(screen.getByText('No hay asignaciones registradas.')).toBeTruthy();
    expect(botonAsignar().disabled).toBe(true);
  });

  it('test_avisa_cuando_todos_los_clientes_activos_ya_tienen_asignacion', async () => {
    api.listarAsignaciones.mockResolvedValue([asignacion(1)]);

    pintar();

    expect(await screen.findByText(/Todos los clientes activos ya tienen/)).toBeTruthy();
    expect(botonAsignar().disabled).toBe(true);
  });

  it.each([
    ['clientes', 'listarClientes'],
    ['entrenadores', 'listarEntrenadores'],
  ])('test_un_fallo_al_cargar_%s_no_oculta_la_tabla_y_permite_reintentar', async (nombre, consulta) => {
    api.listarClientes.mockResolvedValue([cliente(6, 'Bruno', 'Socio')]);
    api.listarAsignaciones.mockResolvedValue([asignacion(1)]);
    api[consulta].mockRejectedValueOnce(new Error('Fallo del servidor'));

    pintar();

    expect((await screen.findByRole('alert')).textContent).toContain(`No se pudieron cargar los ${nombre}`);
    expect(await screen.findByRole('cell', { name: 'Ana Cliente' })).toBeTruthy();
    expect(botonAsignar().disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: `Reintentar carga de ${nombre}` }));

    await esperarListas();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(botonAsignar().disabled).toBe(false);
  });

  it('test_un_fallo_al_cargar_asignaciones_bloquea_el_envio_y_permite_reintentar', async () => {
    api.listarAsignaciones.mockRejectedValueOnce(new Error('Fallo del servidor'));

    pintar();

    expect((await screen.findByRole('alert')).textContent).toContain('No se pudieron cargar las asignaciones');
    expect(screen.queryByText(/No hay asignaciones registradas/)).toBeNull();
    expect(listaClientes().disabled).toBe(true);
    expect(botonAsignar().disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar carga de asignaciones' }));

    await esperarListas();
    expect(screen.getByText('No hay asignaciones registradas.')).toBeTruthy();
  });

  it('test_finaliza_una_asignacion_tras_confirmar', async () => {
    api.listarAsignaciones
      .mockResolvedValueOnce([asignacion(7)])
      .mockResolvedValue([asignacion(7, { estado: 'finalizada', fecha_fin: '2026-10-19' })]);
    api.finalizarAsignacion.mockResolvedValue({ id_asignacion: 7 });
    const confirmacion = vi.spyOn(window, 'confirm').mockReturnValue(true);

    pintar();
    fireEvent.click(await screen.findByRole('button', { name: /finalizar/i }));

    expect(await screen.findByRole('status')).toBeTruthy();
    expect(confirmacion).toHaveBeenCalled();
    expect(api.finalizarAsignacion).toHaveBeenCalledWith(7, {});
    await esperarListas();
    expect(opciones(listaClientes())[0].disabled).toBe(false);
  });

  it('test_no_finaliza_si_el_usuario_cancela_la_confirmacion', async () => {
    api.listarAsignaciones.mockResolvedValue([asignacion(7)]);
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    pintar();
    fireEvent.click(await screen.findByRole('button', { name: /finalizar/i }));

    expect(api.finalizarAsignacion).not.toHaveBeenCalled();
  });

  it('test_bloquea_el_boton_finalizar_mientras_se_procesa_y_evita_duplicados', async () => {
    api.listarAsignaciones.mockResolvedValue([asignacion(7)]);
    let terminar;
    api.finalizarAsignacion.mockReturnValue(new Promise((resolver) => { terminar = resolver; }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    pintar();
    fireEvent.click(await screen.findByRole('button', { name: 'Finalizar' }));

    expect(screen.getByRole('button', { name: 'Finalizar' }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Procesando…' }).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar' }));
    expect(api.finalizarAsignacion).toHaveBeenCalledTimes(1);

    terminar({ id_asignacion: 7 });
    expect(await screen.findByRole('status')).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Finalizar' }).disabled).toBe(false)
    );
  });

  it.each(['administrador', 'recepcionista'])(
    'test_el_rol_%s_puede_asignar_sin_consultar_las_cuentas_de_usuario',
    async (rol) => {
      session.rol = rol;
      api.crearAsignacion.mockResolvedValue({ id_asignacion: 3 });

      pintar();
      await elegir(5, 2);
      fireEvent.click(botonAsignar());

      expect(await screen.findByRole('status')).toBeTruthy();
      expect(api.listarClientes).toHaveBeenCalled();
      expect(api.listarEntrenadores).toHaveBeenCalled();
      expect(api.crearAsignacion).toHaveBeenCalledTimes(1);
      expect(api.listarUsuarios).not.toHaveBeenCalled();
    }
  );

  const AVISO_SIN_ACTUALIZAR =
    'La asignación se finalizó correctamente, pero no fue posible actualizar la información';
  const FINALIZADA = { id_asignacion: 7, estado: 'finalizada', fecha_fin: '2026-10-19' };
  const botonFinalizar = () => screen.queryByRole('button', { name: 'Finalizar' });

  async function finalizarConfirmando() {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    pintar();
    const boton = await screen.findByRole('button', { name: 'Finalizar' });
    // La respuesta simulada se resuelve dentro de act.
    await act(async () => { fireEvent.click(boton); });
  }

  it('test_muestra_el_rechazo_del_backend_al_finalizar_y_conserva_la_asignacion', async () => {
    api.listarAsignaciones.mockResolvedValue([asignacion(7)]);
    api.finalizarAsignacion.mockRejectedValue(new Error('Asignación no encontrada'));

    await finalizarConfirmando();

    expect((await screen.findByRole('alert')).textContent).toContain('Asignación no encontrada');
    expect(screen.queryByRole('status')).toBeNull();
    expect(tabla().getByText('Vigente')).toBeTruthy();
    expect(botonFinalizar().disabled).toBe(false);
  });

  it('test_mantiene_finalizada_la_asignacion_si_falla_la_recarga', async () => {
    api.listarAsignaciones
      .mockResolvedValueOnce([asignacion(7)])
      .mockRejectedValue(new Error('Fallo del servidor'));
    api.finalizarAsignacion.mockResolvedValue(FINALIZADA);

    await finalizarConfirmando();

    expect((await screen.findByRole('alert')).textContent)
      .toContain('No se pudieron cargar las asignaciones');
    expect(screen.getByRole('status').textContent).toContain(AVISO_SIN_ACTUALIZAR);
    expect(tabla().getByText('Finalizada')).toBeTruthy();
    expect(tabla().getByText('2026-10-19')).toBeTruthy();
    expect(tabla().queryByText('Vigente')).toBeNull();
    expect(botonFinalizar()).toBeNull();
    expect(api.finalizarAsignacion).toHaveBeenCalledTimes(1);
    expect(botonAsignar().disabled).toBe(true);
  });

  it('test_actualiza_el_estado_en_cuanto_el_backend_confirma_sin_esperar_la_recarga', async () => {
    api.listarAsignaciones
      .mockResolvedValueOnce([asignacion(7)])
      .mockReturnValue(new Promise(() => {}));
    api.finalizarAsignacion.mockResolvedValue(FINALIZADA);

    await finalizarConfirmando();

    expect(await screen.findByRole('cell', { name: 'Finalizada' })).toBeTruthy();
    expect(botonFinalizar()).toBeNull();
  });

  it('test_mantiene_finalizada_la_asignacion_aunque_la_confirmacion_no_traiga_datos', async () => {
    api.listarAsignaciones
      .mockResolvedValueOnce([asignacion(7)])
      .mockRejectedValue(new Error('Fallo del servidor'));
    api.finalizarAsignacion.mockResolvedValue(undefined);

    await finalizarConfirmando();

    await screen.findByRole('alert');
    expect(tabla().getByText('Finalizada')).toBeTruthy();
    expect(botonFinalizar()).toBeNull();
  });

  it('test_retira_el_aviso_y_habilita_al_cliente_cuando_el_reintento_funciona', async () => {
    api.listarAsignaciones
      .mockResolvedValueOnce([asignacion(7)])
      .mockRejectedValueOnce(new Error('Fallo del servidor'))
      .mockResolvedValue([asignacion(7, FINALIZADA)]);
    api.finalizarAsignacion.mockResolvedValue(FINALIZADA);

    await finalizarConfirmando();
    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar carga de asignaciones' }));

    await esperarListas();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('Asignación finalizada correctamente.');
    expect(opciones(listaClientes())[0].disabled).toBe(false);
  });

  it.each([
    ['clientes', 'listarClientes', [cliente(5, 'Ana', 'Cliente')]],
    ['entrenadores', 'listarEntrenadores', [entrenador(2, 'Carlos Ruiz')]],
  ])(
    'test_avisa_si_falla_la_recarga_de_%s_tras_finalizar',
    async (_nombre, consulta, primera) => {
      api.listarAsignaciones
        .mockResolvedValueOnce([asignacion(7)])
        .mockResolvedValue([asignacion(7, FINALIZADA)]);
      api[consulta].mockResolvedValueOnce(primera).mockRejectedValue(new Error('Fallo del servidor'));
      api.finalizarAsignacion.mockResolvedValue(FINALIZADA);

      await finalizarConfirmando();

      await screen.findByRole('alert');
      expect(screen.getByRole('status').textContent).toContain(AVISO_SIN_ACTUALIZAR);
      expect(tabla().getByText('Finalizada')).toBeTruthy();
      expect(botonFinalizar()).toBeNull();
    }
  );

  it('test_una_respuesta_atrasada_no_devuelve_a_vigente_una_asignacion_finalizada', async () => {
    const vigentes = [
      asignacion(7),
      asignacion(8, { id_cliente: 6, cliente_nombre: 'Bruno', cliente_apellido: 'Socio' }),
    ];
    let responderAtrasada;
    api.listarAsignaciones
      .mockResolvedValueOnce(vigentes)
      .mockRejectedValueOnce(new Error('Fallo del servidor'))
      .mockReturnValueOnce(new Promise((resolver) => { responderAtrasada = resolver; }))
      .mockRejectedValue(new Error('Fallo del servidor'));
    api.finalizarAsignacion.mockResolvedValue({ estado: 'finalizada', fecha_fin: '2026-10-19' });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    pintar();
    fireEvent.click((await screen.findAllByRole('button', { name: 'Finalizar' }))[0]);
    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar carga de asignaciones' }));
    await waitFor(() => expect(botonFinalizar().disabled).toBe(false));
    fireEvent.click(botonFinalizar());
    await screen.findByRole('alert');
    await act(async () => responderAtrasada(vigentes));

    expect(tabla().getAllByText('Finalizada')).toHaveLength(2);
    expect(botonFinalizar()).toBeNull();
  });

  it.each([
    ['clientes', 'listarClientes'],
    ['entrenadores', 'listarEntrenadores'],
    ['asignaciones', 'listarAsignaciones'],
  ])(
    'test_controla_una_respuesta_de_%s_que_no_es_una_lista',
    async (nombre, consulta) => {
      api[consulta].mockResolvedValueOnce({ ok: false });

      pintar();

      expect((await screen.findByRole('alert')).textContent)
        .toContain(`No se pudieron cargar ${nombre === 'asignaciones' ? 'las' : 'los'} ${nombre}: La respuesta del servidor no es válida`);
      expect(screen.getByRole('table')).toBeTruthy();
      expect(botonAsignar().disabled).toBe(true);

      fireEvent.click(screen.getByRole('button', { name: `Reintentar carga de ${nombre}` }));

      await esperarListas();
      expect(screen.queryByRole('alert')).toBeNull();
    }
  );

  it.each([
    ['undefined', undefined],
    ['nulo', null],
    ['un_texto', '<!doctype html>'],
  ])(
    'test_conserva_la_tabla_si_la_recarga_tras_finalizar_devuelve_%s',
    async (_tipo, respuesta) => {
      api.listarAsignaciones
        .mockResolvedValueOnce([asignacion(7)])
        .mockResolvedValue(respuesta);
      api.finalizarAsignacion.mockResolvedValue(FINALIZADA);

      await finalizarConfirmando();

      expect((await screen.findByRole('alert')).textContent)
        .toContain('La respuesta del servidor no es válida');
      expect(screen.getByRole('cell', { name: 'Ana Cliente' })).toBeTruthy();
      expect(tabla().getByText('Finalizada')).toBeTruthy();
      expect(botonFinalizar()).toBeNull();
    }
  );

  it('test_conserva_los_datos_si_falla_la_recarga_despues_de_asignar', async () => {
    const previa = asignacion(1, {
      id_cliente: 9, cliente_nombre: 'Bruno', cliente_apellido: 'Socio',
      estado: 'finalizada', fecha_fin: '2026-09-30',
    });
    api.listarAsignaciones
      .mockResolvedValueOnce([previa])
      .mockRejectedValueOnce(new Error('Fallo del servidor'))
      .mockResolvedValue([previa, asignacion(3)]);
    api.crearAsignacion.mockResolvedValue({ id_asignacion: 3 });

    pintar();
    await elegir(5, 2);
    fireEvent.click(botonAsignar());

    expect((await screen.findByRole('alert')).textContent)
      .toContain('No se pudieron cargar las asignaciones');
    expect(screen.getByRole('status').textContent)
      .toBe('Entrenador asignado al cliente correctamente.');
    expect(screen.getByRole('cell', { name: 'Bruno Socio' })).toBeTruthy();
    expect(botonAsignar().disabled).toBe(true);
    expect(api.crearAsignacion).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar carga de asignaciones' }));

    expect(await screen.findByRole('cell', { name: 'Ana Cliente' })).toBeTruthy();
  });
});
