// pages/Dashboard.test.jsx
// Dashboard administrativo (US-S3-06): indicadores por grupos, filtro de
// periodo, ceros sin datos y errores. Solo datos agregados.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import Dashboard from './Dashboard';

vi.mock('../services/api', () => ({ api: { obtenerDashboard: vi.fn() } }));

import { api } from '../services/api';

const DATOS = {
  periodo: { desde: '2026-11-01', hasta: '2026-11-30' },
  clientes: { totales: 12, activos: 9, nuevos: 3 },
  membresias: { vigentes: 7, porVencer: 2, vencidas: 5 },
  pagos: { cantidad: 4, ingresos: 1850.5, adeudosPendientes: 600 },
  accesos: { intentos: 20, autorizados: 18, rechazados: 2 },
  entrenamiento: {
    entrenadoresActivos: 2, rutinasActivas: 6, clientesSinRutinaActiva: 4,
    objetivosActivos: 8, progresosEnPeriodo: 11,
    cargaPorEntrenador: [{ id_entrenador: 1, nombre: 'Carlos Ruiz', clientes: 5 }],
  },
};

const CEROS = {
  periodo: { desde: '2001-01-01', hasta: '2001-01-31' },
  clientes: { totales: 0, activos: 0, nuevos: 0 },
  membresias: { vigentes: 0, porVencer: 0, vencidas: 0 },
  pagos: { cantidad: 0, ingresos: 0, adeudosPendientes: 0 },
  accesos: { intentos: 0, autorizados: 0, rechazados: 0 },
  entrenamiento: {
    entrenadoresActivos: 0, rutinasActivas: 0, clientesSinRutinaActiva: 0,
    objetivosActivos: 0, progresosEnPeriodo: 0, cargaPorEntrenador: [],
  },
};

/** Pares «indicador: valor» de un grupo. */
function grupo(nombre) {
  const region = screen.getByRole('region', { name: nombre });
  return within(region).queryAllByRole('article').map((tarjeta) =>
    `${within(tarjeta).getByRole('heading').textContent}: ${tarjeta.querySelector('.valor').textContent}`
  );
}

const desde = () => screen.getByLabelText('Desde');
const hasta = () => screen.getByLabelText('Hasta');

describe('Pantalla del dashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.obtenerDashboard.mockResolvedValue(DATOS);
  });

  it('test_consulta_el_periodo_por_defecto_y_lo_muestra_en_los_filtros', async () => {
    render(<Dashboard />);
    await screen.findByRole('region', { name: 'Clientes' });

    expect(api.obtenerDashboard).toHaveBeenCalledWith({});
    expect(desde().value).toBe('2026-11-01');
    expect(hasta().value).toBe('2026-11-30');
    expect(screen.getByText('Periodo mostrado: 2026-11-01 a 2026-11-30')).toBeTruthy();
  });

  it('test_muestra_los_indicadores_por_grupos', async () => {
    render(<Dashboard />);
    await screen.findByRole('region', { name: 'Clientes' });

    expect(grupo('Clientes')).toEqual(['Totales: 12', 'Activos: 9', 'Nuevos en el periodo: 3']);
    expect(grupo('Membresías')).toEqual(['Vigentes: 7', 'Por vencer en 7 días: 2', 'Vencidas o inactivas: 5']);
    expect(grupo('Pagos')).toEqual(['Pagos del periodo: 4', 'Ingresos del periodo: $1,850.50', 'Adeudo pendiente actual: $600.00']);
    expect(grupo('Accesos del periodo')).toEqual(['Intentos: 20', 'Autorizados: 18', 'Rechazados: 2']);
    expect(grupo('Entrenamiento')).toEqual([
      'Entrenadores activos: 2', 'Rutinas activas: 6', 'Clientes sin rutina activa: 4',
      'Objetivos activos: 8', 'Registros de progreso del periodo: 11',
    ]);
    const filas = within(screen.getByRole('table', { name: 'Carga por entrenador' })).getAllByRole('row');
    expect(filas[1].textContent).toBe('Carlos Ruiz5');
  });

  it('test_no_ofrece_enlaces_a_informacion_individual', async () => {
    render(<Dashboard />);
    await screen.findByRole('region', { name: 'Clientes' });

    expect(screen.queryByRole('link')).toBeNull();
  });

  it('test_aplica_el_periodo_elegido', async () => {
    api.obtenerDashboard.mockResolvedValueOnce(DATOS).mockResolvedValue(CEROS);
    render(<Dashboard />);
    await screen.findByRole('region', { name: 'Clientes' });

    fireEvent.change(desde(), { target: { value: '2001-01-01' } });
    fireEvent.change(hasta(), { target: { value: '2001-01-31' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar periodo' }));

    expect(await screen.findByText('Periodo mostrado: 2001-01-01 a 2001-01-31')).toBeTruthy();
    expect(api.obtenerDashboard).toHaveBeenLastCalledWith({ desde: '2001-01-01', hasta: '2001-01-31' });
    expect(grupo('Pagos')).toEqual(['Pagos del periodo: 0', 'Ingresos del periodo: $0.00', 'Adeudo pendiente actual: $0.00']);
    expect(screen.getByText('No hay entrenadores registrados.')).toBeTruthy();
  });

  it('test_muestra_el_rechazo_de_un_periodo_invalido_sin_cifras_desactualizadas', async () => {
    api.obtenerDashboard
      .mockResolvedValueOnce(DATOS)
      .mockRejectedValue(new Error('El periodo de fechas es inválido'));
    render(<Dashboard />);
    await screen.findByRole('region', { name: 'Clientes' });

    fireEvent.change(desde(), { target: { value: '2026-11-30' } });
    fireEvent.change(hasta(), { target: { value: '2026-11-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar periodo' }));

    expect((await screen.findByRole('alert')).textContent).toContain('El periodo de fechas es inválido');
    expect(screen.queryByRole('region', { name: 'Clientes' })).toBeNull();
    expect(desde().value).toBe('2026-11-30');
  });

  it('test_muestra_la_carga_y_bloquea_el_filtro', () => {
    api.obtenerDashboard.mockReturnValue(new Promise(() => {}));

    render(<Dashboard />);

    expect(screen.getByText('Cargando indicadores…')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Aplicar periodo' }).disabled).toBe(true);
    expect(screen.queryByRole('region', { name: 'Clientes' })).toBeNull();
  });

  it('test_permite_reintentar_tras_un_fallo', async () => {
    api.obtenerDashboard.mockRejectedValueOnce(new Error('Fallo del servidor')).mockResolvedValue(DATOS);
    render(<Dashboard />);

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('region', { name: 'Clientes' })).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it.each([
    ['indefinida', undefined],
    ['incompleta', { ok: false }],
    ['un_texto', '<!doctype html>'],
  ])('test_trata_como_error_una_respuesta_%s', async (_caso, respuesta) => {
    api.obtenerDashboard.mockResolvedValue(respuesta);

    render(<Dashboard />);

    expect((await screen.findByRole('alert')).textContent).toContain('La respuesta del servidor no es válida');
  });
});
