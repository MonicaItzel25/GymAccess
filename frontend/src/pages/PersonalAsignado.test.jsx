// pages/PersonalAsignado.test.jsx
// Consulta del personal asignado (US-S3-07): carga y clientes por entrenador,
// carga cero, estados de carga, vacío y error. Solo consulta.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import PersonalAsignado from './PersonalAsignado';

vi.mock('../services/api', () => ({
  api: { listarEntrenadores: vi.fn(), listarAsignaciones: vi.fn() },
}));

import { api } from '../services/api';

const ENTRENADORES = [
  { id_entrenador: 1, nombre: 'Carlos Ruiz', especialidad: 'Fuerza', estado: 'activo', carga: 2 },
  { id_entrenador: 2, nombre: 'Diana Lopez', especialidad: null, estado: 'inactivo', carga: 0 },
];

const asignacion = (id, nombre, idEntrenador = 1) => ({
  id_asignacion: id, id_entrenador: idEntrenador, cliente_nombre: nombre,
  cliente_apellido: 'Socio', fecha_inicio: '2026-11-01', estado: 'vigente',
});

const tarjeta = (nombre) => within(screen.getByRole('region', { name: nombre }));

describe('Pantalla de personal asignado', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.listarEntrenadores.mockResolvedValue(ENTRENADORES);
    api.listarAsignaciones.mockResolvedValue([asignacion(1, 'Ana'), asignacion(2, 'Bruno')]);
  });

  it('test_muestra_la_carga_y_los_clientes_de_cada_entrenador', async () => {
    render(<PersonalAsignado />);
    await screen.findByRole('region', { name: 'Carlos Ruiz' });

    expect(api.listarAsignaciones).toHaveBeenCalledWith({ vigentes: true });
    expect(tarjeta('Carlos Ruiz').getByText('Clientes asignados: 2')).toBeTruthy();
    expect(tarjeta('Carlos Ruiz').getByText('Fuerza · Activo')).toBeTruthy();
    expect(await tarjeta('Carlos Ruiz').findByText('Ana Socio')).toBeTruthy();
    expect(tarjeta('Carlos Ruiz').getByText('Bruno Socio')).toBeTruthy();
  });

  it('test_un_entrenador_sin_asignados_aparece_con_carga_cero', async () => {
    render(<PersonalAsignado />);
    await screen.findByText('Ana Socio');

    expect(tarjeta('Diana Lopez').getByText('Clientes asignados: 0')).toBeTruthy();
    expect(tarjeta('Diana Lopez').getByText('Sin especialidad · Inactivo')).toBeTruthy();
    expect(tarjeta('Diana Lopez').getByText('Sin clientes asignados.')).toBeTruthy();
    expect(tarjeta('Diana Lopez').queryByRole('table')).toBeNull();
  });

  it('test_no_ofrece_controles_para_modificar', async () => {
    render(<PersonalAsignado />);
    await screen.findByText('Ana Socio');

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('test_muestra_la_carga_sin_adelantar_estados_vacios', () => {
    api.listarEntrenadores.mockReturnValue(new Promise(() => {}));
    api.listarAsignaciones.mockReturnValue(new Promise(() => {}));

    render(<PersonalAsignado />);

    expect(screen.getByText('Cargando entrenadores…')).toBeTruthy();
    expect(screen.queryByText(/No hay entrenadores/)).toBeNull();
  });

  it('test_sin_entrenadores_muestra_un_estado_vacio', async () => {
    api.listarEntrenadores.mockResolvedValue([]);

    render(<PersonalAsignado />);

    expect(await screen.findByText('No hay entrenadores registrados.')).toBeTruthy();
  });

  it('test_un_fallo_de_asignaciones_conserva_la_carga_y_permite_reintentar', async () => {
    api.listarAsignaciones.mockRejectedValueOnce(new Error('Fallo del servidor'))
      .mockResolvedValue([asignacion(1, 'Ana')]);

    render(<PersonalAsignado />);

    expect((await screen.findByRole('alert')).textContent).toContain('No se pudieron cargar las asignaciones');
    expect(await screen.findByRole('region', { name: 'Carlos Ruiz' })).toBeTruthy();
    expect(tarjeta('Carlos Ruiz').queryByText('Sin clientes asignados.')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar carga de asignaciones' }));

    expect(await screen.findByText('Ana Socio')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it.each([
    ['entrenadores', 'listarEntrenadores'],
    ['asignaciones', 'listarAsignaciones'],
  ])('test_trata_como_error_una_respuesta_de_%s_que_no_es_una_lista', async (_nombre, consulta) => {
    api[consulta].mockResolvedValue({ ok: false });

    render(<PersonalAsignado />);

    expect((await screen.findByRole('alert')).textContent).toContain('La respuesta del servidor no es válida');
  });
});
