// pages/Asignaciones.test.jsx
// Pruebas de la pantalla de asignación de entrenador a cliente (US-S3-02):
//   1. Listado con nombre del cliente, entrenador y estado (vigente/finalizada).
//   2. Alta desde el formulario para administrador o recepcionista.
//   3. Mensaje de error visible cuando el backend rechaza la operación.
//   4. Finalización con confirmación previa.
// Se usa un doble de `services/api` para no depender del backend (FR-046).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Asignaciones from './Asignaciones';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    usuario: { id_usuario: 1, nombre: 'Rosa Recepcion', correo: 'rosa@gimnasio.mx', rol: 'recepcionista' },
    cargando: false,
  }),
}));

vi.mock('../services/api', () => ({
  api: {
    listarAsignaciones: vi.fn(),
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

describe('Pantalla de asignaciones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('test_muestra_listado_con_cliente_entrenador_y_estado', async () => {
    api.listarAsignaciones.mockResolvedValue([
      {
        id_asignacion: 1,
        cliente_nombre: 'Ana',
        cliente_apellido: 'Cliente',
        entrenador_nombre: 'Carlos Ruiz',
        fecha_inicio: '2026-10-01',
        fecha_fin: null,
        estado: 'vigente',
      },
      {
        id_asignacion: 2,
        cliente_nombre: 'Bruno',
        cliente_apellido: 'Socio',
        entrenador_nombre: 'Diana Lopez',
        fecha_inicio: '2026-09-01',
        fecha_fin: '2026-09-30',
        estado: 'finalizada',
      },
    ]);

    pintar();

    expect(await screen.findByText('Ana Cliente')).toBeTruthy();
    expect(screen.getByText('Carlos Ruiz')).toBeTruthy();
    expect(screen.getByText(/vigente/i)).toBeTruthy();
    expect(screen.getByText(/finalizada/i)).toBeTruthy();
    expect(api.listarAsignaciones).toHaveBeenCalled();
  });

  it('test_da_de_alta_una_asignacion_desde_el_formulario', async () => {
    api.listarAsignaciones.mockResolvedValue([]);
    api.crearAsignacion.mockResolvedValue({
      id_asignacion: 3,
      id_cliente: 5,
      id_entrenador: 2,
      fecha_inicio: '2026-10-19',
      fecha_fin: null,
      estado: 'vigente',
    });

    pintar();

    fireEvent.change(await screen.findByLabelText(/cliente/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/entrenador/i), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /asignar/i }));

    expect(await screen.findByRole('status')).toBeTruthy();
    expect(api.crearAsignacion).toHaveBeenCalledWith({ id_cliente: 5, id_entrenador: 2, fecha_inicio: null });
  });

  it('test_muestra_el_mensaje_de_error_cuando_el_backend_rechaza_el_alta', async () => {
    api.listarAsignaciones.mockResolvedValue([]);
    api.crearAsignacion.mockRejectedValue(
      new Error('El cliente ya tiene un entrenador asignado vigente')
    );

    pintar();

    fireEvent.change(await screen.findByLabelText(/cliente/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/entrenador/i), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /asignar/i }));

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('ya tiene un entrenador asignado vigente');
  });

  it('test_finaliza_una_asignacion_tras_confirmar', async () => {
    api.listarAsignaciones.mockResolvedValue([
      {
        id_asignacion: 7,
        cliente_nombre: 'Ana',
        cliente_apellido: 'Cliente',
        entrenador_nombre: 'Carlos Ruiz',
        fecha_inicio: '2026-10-01',
        fecha_fin: null,
        estado: 'vigente',
      },
    ]);
    api.finalizarAsignacion.mockResolvedValue({
      id_asignacion: 7,
      estado: 'finalizada',
      fecha_fin: '2026-10-19',
    });
    const confirmacion = vi.spyOn(window, 'confirm').mockReturnValue(true);

    pintar();

    fireEvent.click(await screen.findByRole('button', { name: /finalizar/i }));

    expect(await screen.findByRole('status')).toBeTruthy();
    expect(confirmacion).toHaveBeenCalled();
    expect(api.finalizarAsignacion).toHaveBeenCalledWith(7, {});
  });

  it('test_no_finaliza_si_el_usuario_cancela_la_confirmacion', async () => {
    api.listarAsignaciones.mockResolvedValue([
      {
        id_asignacion: 7,
        cliente_nombre: 'Ana',
        cliente_apellido: 'Cliente',
        entrenador_nombre: 'Carlos Ruiz',
        fecha_inicio: '2026-10-01',
        fecha_fin: null,
        estado: 'vigente',
      },
    ]);
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    pintar();

    fireEvent.click(await screen.findByRole('button', { name: /finalizar/i }));

    expect(api.finalizarAsignacion).not.toHaveBeenCalled();
  });
});
