// pages/Entrenadores.test.jsx
// Pruebas de la pantalla de gestión de entrenadores (US-S3-01, Sprint 3):
//   1. Listado de perfiles con nombre, especialidad y estado.
//   2. Alta eligiendo una cuenta en una lista descriptiva.
//   3. Estados de carga, vacío, error y reintento.
//   4. Bloqueo del envío y consulta de usuarios solo para el administrador.
// Se usa un doble de `services/api` para no depender del backend (FR-046).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Entrenadores from './Entrenadores';

const session = vi.hoisted(() => ({ rol: 'administrador' }));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    usuario: { id_usuario: 1, nombre: 'Elsa Admin', correo: 'elsa@gimnasio.mx', rol: session.rol },
    cargando: false,
  }),
}));

vi.mock('../services/api', () => ({
  api: {
    listarEntrenadores: vi.fn(),
    listarUsuarios: vi.fn(),
    crearEntrenador: vi.fn(),
    actualizarEntrenador: vi.fn(),
    cambiarEstadoEntrenador: vi.fn(),
  },
}));

import { api } from '../services/api';

function pintar() {
  return render(
    <MemoryRouter>
      <Entrenadores />
    </MemoryRouter>
  );
}

function cuenta(id, nombre, extra = {}) {
  return {
    id_usuario: id,
    nombre,
    correo: `usuario${id}@gimnasio.mx`,
    rol: 'entrenador',
    estado: 'activo',
    ...extra,
  };
}

const PERFIL = {
  id_entrenador: 1,
  id_usuario: 10,
  nombre: 'Carlos Ruiz',
  especialidad: 'Fuerza',
  telefono: '555-1234',
  estado: 'activo',
};

const lista = () => screen.getByLabelText(/cuenta/i);
const textosDeOpciones = () =>
  within(lista()).getAllByRole('option').map((opcion) => opcion.textContent);
const botonRegistrar = () => screen.getByRole('button', { name: /registrar entrenador/i });

async function elegirCuenta(id) {
  await waitFor(() => expect(lista().disabled).toBe(false));
  fireEvent.change(lista(), { target: { value: String(id) } });
}

describe('Pantalla de entrenadores', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    session.rol = 'administrador';
    api.listarEntrenadores.mockResolvedValue([]);
    api.listarUsuarios.mockResolvedValue([cuenta(12, 'Nuevo Entrenador')]);
  });

  it('test_muestra_listado_de_entrenadores_con_nombre_especialidad_y_estado', async () => {
    api.listarEntrenadores.mockResolvedValue([
      PERFIL,
      { id_entrenador: 2, id_usuario: 11, nombre: 'Diana Lopez', especialidad: null, telefono: null, estado: 'inactivo' },
    ]);

    pintar();

    expect(await screen.findByText('Carlos Ruiz')).toBeTruthy();
    expect(screen.getByText('Fuerza')).toBeTruthy();
    expect(screen.getByText('Diana Lopez')).toBeTruthy();
    expect(screen.getByText('Inactivo')).toBeTruthy();
    expect(api.listarEntrenadores).toHaveBeenCalled();
  });

  it('test_muestra_estado_vacio_cuando_no_hay_entrenadores', async () => {
    pintar();

    expect(await screen.findByText(/No hay entrenadores registrados/)).toBeTruthy();
  });

  it('test_muestra_solo_cuentas_entrenador_activas_y_sin_perfil_con_nombre_y_correo', async () => {
    api.listarEntrenadores.mockResolvedValue([PERFIL]);
    api.listarUsuarios.mockResolvedValue([
      cuenta(10, 'Carlos Ruiz'),
      cuenta(13, 'Rosa Recepcion', { rol: 'recepcionista' }),
      cuenta(14, 'Ivan Inactivo', { estado: 'inactivo' }),
      cuenta(15, 'Beto Libre'),
    ]);

    pintar();
    await waitFor(() => expect(lista().disabled).toBe(false));

    expect(textosDeOpciones()).toEqual([
      'Seleccione una cuenta…',
      'Beto Libre — usuario15@gimnasio.mx',
    ]);
  });

  it('test_da_de_alta_un_entrenador_desde_el_formulario', async () => {
    api.crearEntrenador.mockResolvedValue({ id_entrenador: 3 });

    pintar();
    await elegirCuenta(12);
    fireEvent.change(screen.getByLabelText(/especialidad/i), { target: { value: 'Resistencia' } });
    fireEvent.click(botonRegistrar());

    expect(await screen.findByRole('status')).toBeTruthy();
    expect(api.crearEntrenador).toHaveBeenCalledWith({
      id_usuario: 12,
      especialidad: 'Resistencia',
      telefono: null,
    });
  });

  it('test_la_cuenta_registrada_desaparece_de_las_opciones', async () => {
    api.listarEntrenadores
      .mockResolvedValueOnce([])
      .mockResolvedValue([{ ...PERFIL, id_usuario: 12, nombre: 'Nuevo Entrenador' }]);
    api.crearEntrenador.mockResolvedValue({ id_entrenador: 1 });

    pintar();
    await elegirCuenta(12);
    fireEvent.click(botonRegistrar());

    expect(await screen.findByText(/No hay cuentas de entrenador activas sin perfil/)).toBeTruthy();
    expect(textosDeOpciones()).toEqual(['Seleccione una cuenta…']);
    expect(botonRegistrar().disabled).toBe(true);
    expect(api.listarUsuarios).toHaveBeenCalledTimes(2);
  });

  it('test_muestra_el_mensaje_de_error_cuando_el_backend_rechaza_el_alta', async () => {
    api.crearEntrenador.mockRejectedValue(
      new Error('La cuenta ya tiene un perfil de entrenador')
    );

    pintar();
    await elegirCuenta(12);
    fireEvent.click(botonRegistrar());

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('ya tiene un perfil');
    expect(lista().value).toBe('12');
    expect(botonRegistrar().disabled).toBe(false);
  });

  it('test_muestra_indicadores_de_carga_y_bloquea_el_envio_mientras_carga', () => {
    api.listarEntrenadores.mockReturnValue(new Promise(() => {}));
    api.listarUsuarios.mockReturnValue(new Promise(() => {}));

    pintar();

    expect(screen.getByText('Cargando entrenadores…')).toBeTruthy();
    expect(screen.getByText('Cargando cuentas disponibles…')).toBeTruthy();
    expect(screen.queryByText(/No hay entrenadores registrados/)).toBeNull();
    expect(lista().disabled).toBe(true);
    expect(botonRegistrar().disabled).toBe(true);
  });

  it('test_un_fallo_al_cargar_cuentas_no_oculta_la_tabla_y_permite_reintentar', async () => {
    api.listarEntrenadores.mockResolvedValue([PERFIL]);
    api.listarUsuarios
      .mockRejectedValueOnce(new Error('No tienes permisos para realizar esta operación'))
      .mockResolvedValue([cuenta(12, 'Nuevo Entrenador')]);

    pintar();

    expect((await screen.findByRole('alert')).textContent).toContain('No tienes permisos');
    expect(screen.getByText('Carlos Ruiz')).toBeTruthy();
    expect(botonRegistrar().disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar carga de cuentas' }));

    await waitFor(() => expect(lista().disabled).toBe(false));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(botonRegistrar().disabled).toBe(false);
  });

  it('test_un_fallo_al_cargar_entrenadores_no_muestra_estado_vacio_y_permite_reintentar', async () => {
    api.listarEntrenadores
      .mockRejectedValueOnce(new Error('No se pudo conectar con el servidor'))
      .mockResolvedValue([PERFIL]);

    pintar();

    expect((await screen.findByRole('alert')).textContent).toContain('No se pudo conectar');
    expect(screen.queryByText(/No hay entrenadores registrados/)).toBeNull();
    expect(botonRegistrar().disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar carga de entrenadores' }));

    expect(await screen.findByText('Carlos Ruiz')).toBeTruthy();
    await waitFor(() => expect(botonRegistrar().disabled).toBe(false));
  });

  it('test_no_envia_el_alta_sin_seleccionar_una_cuenta', async () => {
    pintar();
    await waitFor(() => expect(lista().disabled).toBe(false));

    expect(lista().required).toBe(true);
    fireEvent.submit(botonRegistrar().closest('form'));

    expect((await screen.findByRole('alert')).textContent).toContain('Selecciona una cuenta');
    expect(api.crearEntrenador).not.toHaveBeenCalled();
  });

  it('test_bloquea_el_envio_mientras_se_procesa_y_evita_duplicados', async () => {
    let terminar;
    api.crearEntrenador.mockReturnValue(new Promise((resolver) => { terminar = resolver; }));

    pintar();
    await elegirCuenta(12);
    const formulario = botonRegistrar().closest('form');
    fireEvent.click(botonRegistrar());

    const boton = screen.getByRole('button', { name: 'Guardando…' });
    expect(boton.disabled).toBe(true);
    fireEvent.submit(formulario);
    expect(api.crearEntrenador).toHaveBeenCalledTimes(1);

    terminar({ id_entrenador: 3 });
    expect(await screen.findByRole('button', { name: /registrar entrenador/i })).toBeTruthy();
  });

  it('test_bloquea_las_acciones_de_la_tabla_mientras_se_cambia_el_estado', async () => {
    api.listarEntrenadores.mockResolvedValue([PERFIL]);
    let terminar;
    api.cambiarEstadoEntrenador.mockReturnValue(new Promise((resolver) => { terminar = resolver; }));

    pintar();
    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar' }));

    expect(screen.getByRole('button', { name: 'Desactivar' }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Editar' }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Guardando…' }).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Desactivar' }));
    expect(api.cambiarEstadoEntrenador).toHaveBeenCalledTimes(1);
    expect(api.cambiarEstadoEntrenador).toHaveBeenCalledWith(1, 'inactivo');

    terminar({});
    expect(await screen.findByRole('status')).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Editar' }).disabled).toBe(false)
    );
  });

  it('test_modifica_especialidad_y_telefono_sin_pedir_la_cuenta', async () => {
    api.listarEntrenadores.mockResolvedValue([PERFIL]);
    api.actualizarEntrenador.mockResolvedValue({});

    pintar();
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    expect(screen.queryByLabelText(/cuenta/i)).toBeNull();
    fireEvent.change(screen.getByLabelText(/especialidad/i), { target: { value: 'Yoga' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByRole('status')).toBeTruthy();
    expect(api.actualizarEntrenador).toHaveBeenCalledWith(1, {
      especialidad: 'Yoga',
      telefono: '555-1234',
    });
  });

  it('test_el_administrador_consulta_las_cuentas_de_usuario', async () => {
    pintar();
    await waitFor(() => expect(lista().disabled).toBe(false));

    expect(api.listarUsuarios).toHaveBeenCalledTimes(1);
    expect(botonRegistrar().disabled).toBe(false);
  });

  it('test_no_consulta_usuarios_si_el_rol_no_es_administrador', async () => {
    session.rol = 'recepcionista';

    pintar();

    expect(await screen.findByText(/No hay entrenadores registrados/)).toBeTruthy();
    expect(screen.getByText(/Solo el administrador puede registrar/)).toBeTruthy();
    expect(botonRegistrar().disabled).toBe(true);
    expect(api.listarUsuarios).not.toHaveBeenCalled();
  });

  it('test_muestra_el_rechazo_del_backend_al_editar_un_entrenador', async () => {
    api.listarEntrenadores.mockResolvedValue([PERFIL]);
    api.actualizarEntrenador.mockRejectedValue(
      new Error('El teléfono solo puede contener dígitos')
    );

    pintar();
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect((await screen.findByRole('alert')).textContent).toContain('solo puede contener dígitos');
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByLabelText(/teléfono/i).value).toBe('abc');
    expect(screen.getByRole('button', { name: 'Guardar cambios' }).disabled).toBe(false);
    expect(screen.getByText('555-1234')).toBeTruthy();
  });

  it.each([
    ['desactivar', 'activo', 'Desactivar', 'inactivo', 'Activo'],
    ['activar', 'inactivo', 'Activar', 'activo', 'Inactivo'],
  ])(
    'test_muestra_el_rechazo_del_backend_al_%s_un_entrenador',
    async (_accion, estado, boton, nuevo, textoEstado) => {
      api.listarEntrenadores.mockResolvedValue([{ ...PERFIL, estado }]);
      api.cambiarEstadoEntrenador.mockRejectedValue(new Error('Entrenador no encontrado'));

      pintar();
      fireEvent.click(await screen.findByRole('button', { name: boton }));

      expect((await screen.findByRole('alert')).textContent).toContain('Entrenador no encontrado');
      expect(api.cambiarEstadoEntrenador).toHaveBeenCalledWith(1, nuevo);
      expect(screen.queryByRole('status')).toBeNull();
      expect(screen.getByText(textoEstado)).toBeTruthy();
      expect(screen.getByRole('button', { name: boton }).disabled).toBe(false);
    }
  );

  it.each([
    ['undefined', undefined],
    ['nulo', null],
    ['un_objeto', { ok: false }],
    ['un_texto', '<!doctype html>'],
  ])(
    'test_controla_una_respuesta_de_entrenadores_que_es_%s',
    async (_tipo, respuesta) => {
      api.listarEntrenadores.mockResolvedValueOnce(respuesta).mockResolvedValue([PERFIL]);

      pintar();

      expect((await screen.findByRole('alert')).textContent)
        .toContain('La respuesta del servidor no es válida');
      expect(screen.getByRole('table')).toBeTruthy();
      expect(screen.queryByText(/No hay entrenadores registrados/)).toBeNull();
      expect(botonRegistrar().disabled).toBe(true);

      fireEvent.click(screen.getByRole('button', { name: 'Reintentar carga de entrenadores' }));

      expect(await screen.findByText('Carlos Ruiz')).toBeTruthy();
    }
  );

  it('test_controla_una_respuesta_de_cuentas_que_no_es_una_lista_y_conserva_la_tabla', async () => {
    api.listarEntrenadores.mockResolvedValue([PERFIL]);
    api.listarUsuarios.mockResolvedValue({ ok: false });

    pintar();

    expect((await screen.findByRole('alert')).textContent)
      .toContain('No se pudieron cargar las cuentas: La respuesta del servidor no es válida');
    expect(screen.getByText('Carlos Ruiz')).toBeTruthy();
    expect(screen.getByText('Fuerza')).toBeTruthy();
    expect(lista().disabled).toBe(true);
    expect(botonRegistrar().disabled).toBe(true);
  });

  it.each([
    ['falla', () => Promise.reject(new Error('Fallo del servidor'))],
    ['no_es_una_lista', () => Promise.resolve(undefined)],
  ])(
    'test_conserva_la_tabla_si_la_recarga_tras_cambiar_el_estado_%s',
    async (_caso, recarga) => {
      api.listarEntrenadores.mockResolvedValueOnce([PERFIL]).mockImplementation(recarga);
      api.cambiarEstadoEntrenador.mockResolvedValue({});

      pintar();
      fireEvent.click(await screen.findByRole('button', { name: 'Desactivar' }));

      expect((await screen.findByRole('alert')).textContent)
        .toContain('No se pudieron cargar los entrenadores');
      expect(screen.getByRole('status').textContent).toContain('desactivado correctamente');
      expect(screen.getByText('Carlos Ruiz')).toBeTruthy();
      expect(screen.getByText('555-1234')).toBeTruthy();
    }
  );

  it('test_conserva_la_informacion_de_la_tabla_cuando_falla_la_recarga_de_opciones', async () => {
    api.listarEntrenadores.mockResolvedValue([PERFIL]);
    api.listarUsuarios
      .mockResolvedValueOnce([cuenta(12, 'Nuevo Entrenador')])
      .mockRejectedValue(new Error('Fallo del servidor'));
    api.crearEntrenador.mockResolvedValue({ id_entrenador: 3 });

    pintar();
    await elegirCuenta(12);
    fireEvent.click(botonRegistrar());

    expect((await screen.findByRole('alert')).textContent)
      .toContain('No se pudieron cargar las cuentas');
    expect(screen.getByText('Carlos Ruiz')).toBeTruthy();
    expect(screen.getByText('Fuerza')).toBeTruthy();
    expect(screen.getByText('555-1234')).toBeTruthy();
    expect(screen.getByText('Activo')).toBeTruthy();
    expect(textosDeOpciones()).toEqual(['Seleccione una cuenta…']);
    expect(botonRegistrar().disabled).toBe(true);
  });
});
