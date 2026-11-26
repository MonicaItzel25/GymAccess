// pages/Rutinas.test.jsx
// Pruebas de la pantalla de rutinas del entrenador (US-S3-03):
//   1. Listado de sus rutinas con cliente y estado.
//   2. Creación con ejercicios del catálogo y parámetros por fila.
//   3. Activación con confirmación del usuario.
//   4. Mensaje de error del backend visible (ejercicio desactivado).
//   5. Estado vacío comprensible.
// Se usa un doble de `services/api` para no depender del backend (FR-046).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Rutinas from './Rutinas';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    usuario: { id_usuario: 2, nombre: 'Hugo Entrenador', correo: 'hugo@gimnasio.mx', rol: 'entrenador' },
    cargando: false,
  }),
}));

vi.mock('../services/api', () => ({
  api: {
    listarRutinas: vi.fn(),
    obtenerRutina: vi.fn(),
    crearRutina: vi.fn(),
    actualizarRutina: vi.fn(),
    cambiarEstadoRutina: vi.fn(),
    listarAsignaciones: vi.fn(),
    listarEjercicios: vi.fn(),
  },
}));

import { api } from '../services/api';

function pintar() {
  return render(
    <MemoryRouter>
      <Rutinas />
    </MemoryRouter>
  );
}

describe('Pantalla de rutinas del entrenador', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listarAsignaciones.mockResolvedValue([
      { id_asignacion: 1, id_cliente: 5, cliente_nombre: 'Carla', cliente_apellido: 'Ríos', estado: 'vigente' },
    ]);
    api.listarEjercicios.mockResolvedValue([
      { id_ejercicio: 1, nombre: 'Press de banca', estado: 'activo' },
      { id_ejercicio: 2, nombre: 'Sentadilla', estado: 'activo' },
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('test_listado_muestra_las_rutinas_del_entrenador_con_cliente_y_estado', async () => {
    api.listarRutinas.mockResolvedValue([
      {
        id_rutina: 1,
        id_cliente: 5,
        nombre: 'Semana 1 - Empuje',
        estado: 'activa',
        cliente_nombre: 'Carla',
        cliente_apellido: 'Ríos',
      },
    ]);

    pintar();

    expect(await screen.findByText('Semana 1 - Empuje')).toBeTruthy();
    // 'Carla Ríos' aparece en el selector de clientes y en la fila de la tabla.
    expect((await screen.findAllByText('Carla Ríos')).length).toBeGreaterThan(0);
    expect(screen.getByText('Activa')).toBeTruthy();
    expect(api.listarRutinas).toHaveBeenCalled();
  });

  it('test_creacion_con_ejercicios_del_catalogo_y_parametros_por_fila', async () => {
    api.listarRutinas.mockResolvedValue([]);
    api.crearRutina.mockResolvedValue({ id_rutina: 2, nombre: 'Semana 1 - Empuje', estado: 'inactiva' });

    pintar();

    fireEvent.change(await screen.findByLabelText(/cliente/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/nombre de la rutina/i), { target: { value: 'Semana 1 - Empuje' } });
    fireEvent.change(screen.getByLabelText(/^ejercicio/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/series/i), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText(/repeticiones/i), { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: /crear rutina/i }));

    expect(await screen.findByRole('status')).toBeTruthy();
    expect(api.crearRutina).toHaveBeenCalledWith({
      id_cliente: 5,
      nombre: 'Semana 1 - Empuje',
      ejercicios: [
        {
          id_ejercicio: 1,
          orden: 1,
          series: 4,
          repeticiones: 8,
          peso_recomendado: null,
          descanso_segundos: null,
          instrucciones: null,
        },
      ],
    });
  });

  it('test_activacion_pide_confirmacion_y_cambia_el_estado', async () => {
    api.listarRutinas.mockResolvedValue([
      {
        id_rutina: 1,
        id_cliente: 5,
        nombre: 'Semana 1 - Empuje',
        estado: 'inactiva',
        cliente_nombre: 'Carla',
        cliente_apellido: 'Ríos',
      },
    ]);
    api.cambiarEstadoRutina.mockResolvedValue({ id_rutina: 1, estado: 'activa' });
    window.confirm = vi.fn(() => true);

    pintar();

    fireEvent.click(await screen.findByRole('button', { name: 'Activar' }));

    expect(window.confirm).toHaveBeenCalled();
    expect(api.cambiarEstadoRutina).toHaveBeenCalledWith(1, 'activa');
  });

  it('test_muestra_el_mensaje_de_error_del_backend', async () => {
    api.listarRutinas.mockResolvedValue([]);
    api.crearRutina.mockRejectedValue(
      new Error('El ejercicio está desactivado y no puede agregarse a rutinas nuevas')
    );

    pintar();

    fireEvent.change(await screen.findByLabelText(/cliente/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/nombre de la rutina/i), { target: { value: 'Con desactivado' } });
    fireEvent.change(screen.getByLabelText(/^ejercicio/i), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /crear rutina/i }));

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('desactivado');
  });

  it('test_muestra_estado_vacio_cuando_no_hay_rutinas', async () => {
    api.listarRutinas.mockResolvedValue([]);

    pintar();

    expect(await screen.findByText(/No tienes rutinas registradas/)).toBeTruthy();
  });
});
