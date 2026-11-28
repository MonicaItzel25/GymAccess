// pages/MiProgreso.test.jsx
// Pantalla «Mi progreso» del cliente (US-S3-05): objetivos e historial en
// orden cronológico, estados vacíos, carga, error y reintento. Solo consulta.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import MiProgreso from './MiProgreso';

vi.mock('../services/api', () => ({
  api: { obtenerMisObjetivos: vi.fn(), obtenerMisProgresos: vi.fn() },
}));

import { api } from '../services/api';

const OBJETIVOS = [
  { id_objetivo: 3, meta: 'Levantar 60 kg', unidad: 'kg', fecha_objetivo: '2026-12-31', estado: 'activo' },
  { id_objetivo: 4, meta: 'Correr 5 km', unidad: null, fecha_objetivo: '2026-11-30', estado: 'alcanzado' },
];

const PROGRESOS = [
  { id_progreso: 9, id_objetivo: 3, fecha: '2026-11-20', valor_numerico: 50, avance: null, comentario: 'Mejor técnica' },
  { id_progreso: 8, id_objetivo: null, fecha: '2026-11-05', valor_numerico: 0, avance: 'Primera sesión', comentario: null },
];

const celdas = (fila) => within(fila).getAllByRole('cell').map((celda) => celda.textContent);
const filas = (nombre) => within(screen.getByRole('table', { name: nombre })).getAllByRole('row').slice(1);

describe('Pantalla Mi progreso', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.obtenerMisObjetivos.mockResolvedValue(OBJETIVOS);
    api.obtenerMisProgresos.mockResolvedValue(PROGRESOS);
  });

  it('test_muestra_los_objetivos_con_su_estado', async () => {
    render(<MiProgreso />);
    await screen.findByRole('table', { name: 'Mis objetivos' });

    expect(filas('Mis objetivos').map(celdas)).toEqual([
      ['Levantar 60 kg', 'kg', '2026-12-31', 'Activo'],
      ['Correr 5 km', '—', '2026-11-30', 'Alcanzado'],
    ]);
  });

  it('test_ordena_la_evolucion_en_el_tiempo_y_relaciona_cada_objetivo', async () => {
    render(<MiProgreso />);
    await screen.findByRole('table', { name: 'Mi evolución' });

    expect(filas('Mi evolución').map(celdas)).toEqual([
      ['2026-11-05', '—', '0', 'Primera sesión', '—'],
      ['2026-11-20', 'Levantar 60 kg', '50', '—', 'Mejor técnica'],
    ]);
  });

  it('test_aclara_que_no_es_un_diagnostico_y_no_permite_modificar', async () => {
    render(<MiProgreso />);
    await screen.findByRole('table', { name: 'Mi evolución' });

    expect(screen.getByText(/no constituye un diagnóstico médico/)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('test_sin_registros_muestra_estados_vacios', async () => {
    api.obtenerMisObjetivos.mockResolvedValue([]);
    api.obtenerMisProgresos.mockResolvedValue([]);

    render(<MiProgreso />);

    expect(await screen.findByText('Aún no tienes objetivos registrados.')).toBeTruthy();
    expect(await screen.findByText('Aún no tienes entradas de progreso.')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('test_muestra_la_carga_sin_adelantar_estados_vacios', () => {
    api.obtenerMisObjetivos.mockReturnValue(new Promise(() => {}));
    api.obtenerMisProgresos.mockReturnValue(new Promise(() => {}));

    render(<MiProgreso />);

    expect(screen.getByText('Cargando tus objetivos…')).toBeTruthy();
    expect(screen.getByText('Cargando tu evolución…')).toBeTruthy();
    expect(screen.queryByText(/Aún no tienes/)).toBeNull();
  });

  it.each([
    ['objetivos', 'obtenerMisObjetivos', 'Mi evolución'],
    ['progresos', 'obtenerMisProgresos', 'Mis objetivos'],
  ])('test_un_fallo_de_%s_no_oculta_lo_demas_y_permite_reintentar', async (nombre, consulta, otra) => {
    api[consulta].mockRejectedValueOnce(new Error('Fallo del servidor'));

    render(<MiProgreso />);

    expect((await screen.findByRole('alert')).textContent).toContain('Fallo del servidor');
    expect(await screen.findByRole('table', { name: otra })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: `Reintentar carga de ${nombre}` }));

    await screen.findByRole('table', { name: nombre === 'objetivos' ? 'Mis objetivos' : 'Mi evolución' });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('test_trata_como_error_una_respuesta_que_no_es_una_lista', async () => {
    api.obtenerMisProgresos.mockResolvedValue({ ok: false });

    render(<MiProgreso />);

    expect((await screen.findByRole('alert')).textContent).toContain('La respuesta del servidor no es válida');
  });
});
