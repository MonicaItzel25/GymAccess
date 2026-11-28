// pages/Auditoria.test.jsx
// Pantalla de auditoría de solo lectura (US-S3-09): registros, filtros, estado
// vacío, errores y ausencia de controles de modificación (SC-007).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import Auditoria from './Auditoria';

vi.mock('../services/api', () => ({ api: { obtenerAuditoria: vi.fn() } }));

import { api } from '../services/api';

const REGISTROS = [
  {
    id_auditoria: 2, id_usuario: 5, actor: 'Rosa Recepcion', accion: 'asignar_entrenador',
    modulo: 'asignaciones', fecha: '2026-11-20T18:30:00.000Z', resultado: 'rechazado',
    descripcion: 'Alta rechazada',
  },
  {
    id_auditoria: 1, id_usuario: null, actor: null, accion: 'intento_acceso',
    modulo: 'accesos', fecha: '2026-11-19T10:00:00.000Z', resultado: 'exitoso', descripcion: null,
  },
];

const fechaLocal = (valor) => new Date(valor).toLocaleString('es-MX');
const celdas = (fila) => within(fila).getAllByRole('cell').map((celda) => celda.textContent);
const aplicar = () => screen.getByRole('button', { name: 'Aplicar filtros' });

describe('Pantalla de auditoría', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.obtenerAuditoria.mockResolvedValue(REGISTROS);
  });

  it('test_muestra_actor_accion_entidad_fecha_y_resultado', async () => {
    render(<Auditoria />);
    await screen.findByRole('table');

    const [, primera, segunda] = screen.getAllByRole('row');
    expect(celdas(primera)).toEqual([
      fechaLocal(REGISTROS[0].fecha), 'Rosa Recepcion', 'asignar entrenador',
      'Asignaciones', 'Rechazado', 'Alta rechazada',
    ]);
    expect(celdas(segunda)).toEqual([
      fechaLocal(REGISTROS[1].fecha), 'Sistema', 'intento acceso', 'Accesos', 'Exitoso', '—',
    ]);
    expect(screen.getByText('Registros mostrados: 2')).toBeTruthy();
    expect(api.obtenerAuditoria).toHaveBeenCalledWith({});
  });

  it('test_no_ofrece_controles_para_crear_editar_ni_borrar', async () => {
    render(<Auditoria />);
    const tabla = await screen.findByRole('table');

    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Aplicar filtros', 'Limpiar filtros',
    ]);
    expect(within(tabla).queryByRole('button')).toBeNull();
    expect(within(tabla).queryByRole('textbox')).toBeNull();
    expect(within(tabla).queryByRole('combobox')).toBeNull();
  });

  it('test_aplica_los_filtros_elegidos', async () => {
    render(<Auditoria />);
    await screen.findByRole('table');

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-11-01' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-11-30' } });
    fireEvent.change(screen.getByLabelText('Entidad'), { target: { value: 'asignaciones' } });
    fireEvent.change(screen.getByLabelText('Actor (nombre o ID)'), { target: { value: ' Rosa ' } });
    fireEvent.click(aplicar());

    await screen.findByRole('table');
    expect(api.obtenerAuditoria).toHaveBeenLastCalledWith({
      desde: '2026-11-01', hasta: '2026-11-30', modulo: 'asignaciones', actor: 'Rosa',
    });
  });

  it('test_limpiar_vuelve_a_consultar_todo', async () => {
    render(<Auditoria />);
    await screen.findByRole('table');
    fireEvent.change(screen.getByLabelText('Entidad'), { target: { value: 'accesos' } });
    fireEvent.click(aplicar());
    await screen.findByRole('table');

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    await screen.findByRole('table');
    expect(screen.getByLabelText('Entidad').value).toBe('');
    expect(api.obtenerAuditoria).toHaveBeenLastCalledWith({});
  });

  it('test_sin_resultados_muestra_un_estado_vacio', async () => {
    api.obtenerAuditoria.mockResolvedValue([]);

    render(<Auditoria />);

    expect(await screen.findByText('No hay registros que cumplan los filtros.')).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('test_muestra_la_carga_y_bloquea_los_filtros', () => {
    api.obtenerAuditoria.mockReturnValue(new Promise(() => {}));

    render(<Auditoria />);

    expect(screen.getByText('Cargando registros…')).toBeTruthy();
    expect(aplicar().disabled).toBe(true);
    expect(screen.queryByText(/No hay registros/)).toBeNull();
  });

  it('test_muestra_el_rechazo_sin_registros_desactualizados_y_permite_reintentar', async () => {
    api.obtenerAuditoria
      .mockResolvedValueOnce(REGISTROS)
      .mockRejectedValueOnce(new Error('El periodo de fechas es inválido'))
      .mockResolvedValue(REGISTROS);
    render(<Auditoria />);
    await screen.findByRole('table');

    fireEvent.click(aplicar());

    expect((await screen.findByRole('alert')).textContent).toContain('El periodo de fechas es inválido');
    expect(screen.queryByRole('table')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('table')).toBeTruthy();
  });

  it('test_trata_como_error_una_respuesta_que_no_es_una_lista', async () => {
    api.obtenerAuditoria.mockResolvedValue({ ok: false });

    render(<Auditoria />);

    expect((await screen.findByRole('alert')).textContent).toContain('La respuesta del servidor no es válida');
  });
});
