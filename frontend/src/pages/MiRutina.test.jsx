// pages/MiRutina.test.jsx
// Pantalla «Mi rutina» del cliente (US-S3-05): rutina activa con sus
// parámetros, estado vacío, carga, error y reintento. Solo consulta.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import MiRutina from './MiRutina';

vi.mock('../services/api', () => ({ api: { obtenerMiRutina: vi.fn() } }));

import { api } from '../services/api';

const RUTINA = {
  id_rutina: 7,
  nombre: 'Fuerza inicial',
  estado: 'activa',
  ejercicios: [
    {
      id_rutina_ejercicio: 1, orden: 1, nombre: 'Sentadilla', grupo_muscular: 'Piernas',
      series: 4, repeticiones: 8, peso_recomendado: '40.00', descanso_segundos: 90,
      instrucciones: 'Espalda recta',
    },
    {
      id_rutina_ejercicio: 2, orden: 2, nombre: 'Plancha', grupo_muscular: 'Abdomen',
      series: 3, repeticiones: 1, peso_recomendado: null, descanso_segundos: null,
      instrucciones: null,
    },
  ],
};

const celdas = (fila) => within(fila).getAllByRole('cell').map((celda) => celda.textContent);

describe('Pantalla Mi rutina', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('test_muestra_la_rutina_activa_con_todos_sus_parametros', async () => {
    api.obtenerMiRutina.mockResolvedValue(RUTINA);

    render(<MiRutina />);

    expect(await screen.findByText('Fuerza inicial')).toBeTruthy();
    const [, primera, segunda] = screen.getAllByRole('row');
    expect(celdas(primera)).toEqual(['1', 'Sentadilla', 'Piernas', '4', '8', '40 kg', '90 s', 'Espalda recta']);
    expect(celdas(segunda)).toEqual(['2', 'Plancha', 'Abdomen', '3', '1', '—', '—', '—']);
  });

  it('test_no_ofrece_controles_para_modificar', async () => {
    api.obtenerMiRutina.mockResolvedValue(RUTINA);

    render(<MiRutina />);
    await screen.findByText('Fuerza inicial');

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('test_sin_rutina_activa_muestra_un_estado_vacio_sin_error', async () => {
    api.obtenerMiRutina.mockResolvedValue(null);

    render(<MiRutina />);

    expect(await screen.findByText(/Aún no tienes una rutina activa/)).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('test_muestra_la_carga_sin_adelantar_el_estado_vacio', () => {
    api.obtenerMiRutina.mockReturnValue(new Promise(() => {}));

    render(<MiRutina />);

    expect(screen.getByText('Cargando tu rutina…')).toBeTruthy();
    expect(screen.queryByText(/Aún no tienes una rutina activa/)).toBeNull();
  });

  it('test_muestra_el_error_y_permite_reintentar', async () => {
    api.obtenerMiRutina
      .mockRejectedValueOnce(new Error('No existe un cliente asociado a esta cuenta'))
      .mockResolvedValue(RUTINA);

    render(<MiRutina />);

    expect((await screen.findByRole('alert')).textContent).toContain('No existe un cliente asociado');
    expect(screen.queryByText(/Aún no tienes una rutina activa/)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Fuerza inicial')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it.each([
    ['indefinida', undefined],
    ['sin_ejercicios', { ok: false }],
    ['un_texto', '<!doctype html>'],
  ])('test_trata_como_error_una_respuesta_%s', async (_caso, respuesta) => {
    api.obtenerMiRutina.mockResolvedValue(respuesta);

    render(<MiRutina />);

    expect((await screen.findByRole('alert')).textContent).toContain('La respuesta del servidor no es válida');
  });
});
