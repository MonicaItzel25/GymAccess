// pages/Entrenadores.test.jsx
// Pruebas de la pantalla de gestión de entrenadores (US-S3-01, Sprint 3):
//   1. Listado de perfiles con nombre, especialidad y estado.
//   2. Alta desde una cuenta existente con rol entrenador.
//   3. Mensaje de error visible cuando el backend rechaza la operación.
//   4. Estado vacío comprensible cuando no hay perfiles.
// Se usa un doble de `services/api` para no depender del backend (FR-046).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Entrenadores from './Entrenadores';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    usuario: { id_usuario: 1, nombre: 'Elsa Admin', correo: 'elsa@gimnasio.mx', rol: 'administrador' },
    cargando: false,
  }),
}));

vi.mock('../services/api', () => ({
  api: {
    listarEntrenadores: vi.fn(),
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

describe('Pantalla de entrenadores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('test_muestra_listado_de_entrenadores_con_nombre_especialidad_y_estado', async () => {
    api.listarEntrenadores.mockResolvedValue([
      { id_entrenador: 1, nombre: 'Carlos Ruiz', especialidad: 'Fuerza', telefono: '555-1234', estado: 'activo' },
      { id_entrenador: 2, nombre: 'Diana Lopez', especialidad: null, telefono: null, estado: 'inactivo' },
    ]);

    pintar();

    expect(await screen.findByText('Carlos Ruiz')).toBeTruthy();
    expect(screen.getByText('Fuerza')).toBeTruthy();
    expect(screen.getByText('Diana Lopez')).toBeTruthy();
    expect(api.listarEntrenadores).toHaveBeenCalled();
  });

  it('test_muestra_estado_vacio_cuando_no_hay_entrenadores', async () => {
    api.listarEntrenadores.mockResolvedValue([]);

    pintar();

    expect(await screen.findByText(/No hay entrenadores registrados/)).toBeTruthy();
  });

  it('test_da_de_alta_un_entrenador_desde_el_formulario', async () => {
    api.listarEntrenadores.mockResolvedValue([]);
    api.crearEntrenador.mockResolvedValue({
      id_entrenador: 3,
      id_usuario: 12,
      nombre: 'Nuevo Entrenador',
      especialidad: 'Resistencia',
      estado: 'activo',
    });

    pintar();

    fireEvent.change(await screen.findByLabelText(/cuenta/i), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText(/especialidad/i), { target: { value: 'Resistencia' } });
    fireEvent.click(screen.getByRole('button', { name: /registrar/i }));

    expect(await screen.findByRole('status')).toBeTruthy();
    expect(api.crearEntrenador).toHaveBeenCalledWith({
      id_usuario: 12,
      especialidad: 'Resistencia',
      telefono: null,
    });
  });

  it('test_muestra_el_mensaje_de_error_cuando_el_backend_rechaza_el_alta', async () => {
    api.listarEntrenadores.mockResolvedValue([]);
    api.crearEntrenador.mockRejectedValue(
      new Error('La cuenta ya tiene un perfil de entrenador')
    );

    pintar();

    fireEvent.change(await screen.findByLabelText(/cuenta/i), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: /registrar/i }));

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('ya tiene un perfil');
  });
});
