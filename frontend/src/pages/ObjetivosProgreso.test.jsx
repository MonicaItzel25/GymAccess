// Pruebas de la pantalla de objetivos y progreso del entrenador (US-S3-04).
// Se usan dobles de AuthContext y services/api para no depender del backend.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ObjetivosProgreso from './ObjetivosProgreso';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    usuario: { id_usuario: 3, nombre: 'Elena Entrenadora', correo: 'elena@gimnasio.mx', rol: 'entrenador' },
    cargando: false,
  }),
}));

vi.mock('../services/api', () => ({
  api: {
    listarAsignaciones: vi.fn(),
    listarObjetivos: vi.fn(),
    crearObjetivo: vi.fn(),
    actualizarObjetivo: vi.fn(),
    cambiarEstadoObjetivo: vi.fn(),
    listarProgresos: vi.fn(),
    crearProgreso: vi.fn(),
  },
}));

import { api } from '../services/api';

function pintar() {
  return render(
    <MemoryRouter>
      <ObjetivosProgreso />
    </MemoryRouter>
  );
}

describe('Pantalla de objetivos y progreso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listarAsignaciones.mockResolvedValue([
      {
        id_asignacion: 1,
        id_cliente: 21,
        cliente_nombre: 'María',
        cliente_apellido: 'López',
        estado: 'vigente',
      },
    ]);
    api.listarObjetivos.mockResolvedValue([]);
    api.listarProgresos.mockResolvedValue([]);
    api.crearObjetivo.mockResolvedValue({
      id_objetivo: 7,
      id_cliente: 21,
      meta: 'Aumentar fuerza',
      unidad: 'kg',
      fecha_objetivo: '2026-12-31',
      estado: 'activo',
    });
    api.crearProgreso.mockResolvedValue({
      id_progreso: 12,
      id_cliente: 21,
      fecha: '2026-11-20',
      valor_numerico: 82.5,
      avance: null,
      comentario: 'Seguimiento deportivo',
    });
  });

  it('test_entrenador_registra_objetivo_para_un_cliente_asignado', async () => {
    pintar();

    fireEvent.change(await screen.findByLabelText(/cliente/i), { target: { value: '21' } });
    fireEvent.change(screen.getByLabelText(/meta/i), { target: { value: 'Aumentar fuerza' } });
    fireEvent.change(screen.getByLabelText(/unidad/i), { target: { value: 'kg' } });
    fireEvent.change(screen.getByLabelText(/fecha objetivo/i), { target: { value: '2026-12-31' } });
    fireEvent.click(screen.getByRole('button', { name: /registrar objetivo/i }));

    expect(await screen.findByRole('status')).toBeTruthy();
    expect(api.crearObjetivo).toHaveBeenCalledWith({
      id_cliente: 21,
      meta: 'Aumentar fuerza',
      unidad: 'kg',
      fecha_objetivo: '2026-12-31',
    });
  });

  it('test_entrenador_registra_una_entrada_de_progreso', async () => {
    pintar();

    fireEvent.change(await screen.findByLabelText(/cliente/i), { target: { value: '21' } });
    fireEvent.change(screen.getByLabelText(/^fecha del progreso$/i), { target: { value: '2026-11-20' } });
    fireEvent.change(screen.getByLabelText(/valor numérico/i), { target: { value: '82.5' } });
    fireEvent.change(screen.getByLabelText(/comentario/i), { target: { value: 'Seguimiento deportivo' } });
    fireEvent.click(screen.getByRole('button', { name: /registrar progreso/i }));

    expect(await screen.findByRole('status')).toBeTruthy();
    const datosProgreso = api.crearProgreso.mock.calls[0][0];
    expect(datosProgreso).toMatchObject({
      id_cliente: 21,
      fecha: '2026-11-20',
      valor_numerico: 82.5,
      avance: null,
      comentario: 'Seguimiento deportivo',
    });
    // `id_objetivo` es opcional: si la pantalla lo envía sin selección, debe
    // hacerlo como null; también es válido omitir la propiedad.
    expect(datosProgreso.id_objetivo ?? null).toBeNull();
  });

  it('test_muestra_el_error_del_backend_al_rechazar_el_objetivo', async () => {
    api.crearObjetivo.mockRejectedValue(new Error('No tienes una asignación vigente con este cliente'));
    pintar();

    fireEvent.change(await screen.findByLabelText(/cliente/i), { target: { value: '21' } });
    fireEvent.change(screen.getByLabelText(/meta/i), { target: { value: 'Meta sin permiso' } });
    fireEvent.change(screen.getByLabelText(/fecha objetivo/i), { target: { value: '2026-12-31' } });
    fireEvent.click(screen.getByRole('button', { name: /registrar objetivo/i }));

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('asignación vigente');
  });

  const objetivoActivo = {
    id_objetivo: 7,
    id_cliente: 21,
    meta: 'Correr cinco kilómetros',
    unidad: 'km',
    fecha_objetivo: '2026-12-31',
    estado: 'activo',
  };
  const seleccionarCliente = async () =>
    fireEvent.change(await screen.findByLabelText(/cliente/i), { target: { value: '21' } });

  it('test_muestra_objetivos_e_historial_y_solo_permite_cambiar_los_activos', async () => {
    api.listarObjetivos.mockResolvedValue([
      objetivoActivo,
      { ...objetivoActivo, id_objetivo: 8, meta: 'Objetivo antiguo', estado: 'cerrado' },
    ]);
    api.listarProgresos.mockResolvedValue([
      {
        id_progreso: 1,
        id_cliente: 21,
        id_objetivo: 8,
        fecha: '2026-11-01',
        valor_numerico: 0,
        avance: null,
        comentario: 'Línea base',
      },
    ]);
    pintar();
    await seleccionarCliente();

    expect(await screen.findByText('Línea base')).toBeTruthy();
    expect(screen.getByRole('cell', { name: '0' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(1);
    expect(api.listarObjetivos).toHaveBeenCalledWith(21);
    expect(api.listarProgresos).toHaveBeenCalledWith(21);
  });

  it('test_edita_un_objetivo_activo_y_permite_quitar_la_unidad', async () => {
    api.listarObjetivos.mockResolvedValue([objetivoActivo]);
    api.actualizarObjetivo.mockResolvedValue(objetivoActivo);
    pintar();
    await seleccionarCliente();

    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getByLabelText(/unidad/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect(await screen.findByRole('status')).toBeTruthy();
    expect(api.actualizarObjetivo).toHaveBeenCalledWith(7, {
      meta: 'Correr cinco kilómetros',
      unidad: null,
      fecha_objetivo: '2026-12-31',
    });
    expect(api.crearObjetivo).not.toHaveBeenCalled();
  });

  it('test_cierra_un_objetivo_solo_si_se_confirma', async () => {
    api.listarObjetivos.mockResolvedValue([objetivoActivo]);
    api.cambiarEstadoObjetivo.mockResolvedValue({ ...objetivoActivo, estado: 'cerrado' });
    const confirmacion = vi.spyOn(window, 'confirm').mockReturnValue(false);
    pintar();
    await seleccionarCliente();

    fireEvent.click(await screen.findByRole('button', { name: 'Cerrar' }));
    expect(api.cambiarEstadoObjetivo).not.toHaveBeenCalled();

    confirmacion.mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(await screen.findByRole('status')).toBeTruthy();
    expect(api.cambiarEstadoObjetivo).toHaveBeenCalledWith(7, 'cerrado');
    confirmacion.mockRestore();
  });

  it('test_muestra_estados_vacios_sin_errores', async () => {
    pintar();
    await seleccionarCliente();

    expect(await screen.findByText('Sin objetivos registrados.')).toBeTruthy();
    expect(screen.getByText('Sin entradas de progreso.')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('test_informa_cuando_no_hay_clientes_asignados', async () => {
    api.listarAsignaciones.mockResolvedValue([]);
    pintar();

    expect(await screen.findByText('No tienes clientes con asignación vigente.')).toBeTruthy();
    expect(screen.queryByLabelText(/cliente/i)).toBeNull();
  });

  it('test_muestra_el_error_del_backend_al_rechazar_el_progreso', async () => {
    api.crearProgreso.mockRejectedValue(new Error('Indica un valor o un avance medido'));
    pintar();

    fireEvent.change(await screen.findByLabelText(/cliente/i), { target: { value: '21' } });
    fireEvent.change(screen.getByLabelText(/^fecha del progreso$/i), { target: { value: '2026-11-20' } });
    fireEvent.click(screen.getByRole('button', { name: /registrar progreso/i }));

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('valor o un avance');
  });
});
