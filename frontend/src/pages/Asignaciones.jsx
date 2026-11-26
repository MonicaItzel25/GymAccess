// pages/Asignaciones.jsx
// Asignación de entrenador a cliente (US-S3-02, Sprint 3).
// Administrador y recepcionista asignan un entrenador activo a un cliente
// activo y finalizan asignaciones; una única asignación vigente por cliente
// (FR-006, SC-003) y finalización con confirmación que conserva el historial
// (FR-007, FR-008). La autorización real la valida el backend; la interfaz
// solo ofrece las opciones permitidas (FR-032). ES Modules (JSX).

import { useEffect, useState } from 'react';
import { api } from '../services/api';

const FORMULARIO_INICIAL = { id_cliente: '', id_entrenador: '', fecha_inicio: '' };

export default function Asignaciones() {
  const [asignaciones, setAsignaciones] = useState([]);
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  async function cargar() {
    try {
      setAsignaciones(await api.listarAsignaciones());
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function cambiarCampo(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setError('');
    setExito('');
    try {
      await api.crearAsignacion({
        id_cliente: Number(formulario.id_cliente),
        id_entrenador: Number(formulario.id_entrenador),
        fecha_inicio: formulario.fecha_inicio || null,
      });
      setExito('Entrenador asignado al cliente correctamente.');
      setFormulario(FORMULARIO_INICIAL);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function finalizar(asignacion) {
    const confirmado = window.confirm(
      '¿Finalizar esta asignación? El entrenador dejará de gestionar al cliente.'
    );
    if (!confirmado) return;
    setError('');
    setExito('');
    try {
      await api.finalizarAsignacion(asignacion.id_asignacion, {});
      setExito('Asignación finalizada correctamente.');
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <section className="tarjeta">
        <h1>Asignar entrenador a cliente</h1>
        {error && <div className="mensaje mensaje-error" role="alert">{error}</div>}
        {exito && <div className="mensaje mensaje-exito" role="status">{exito}</div>}

        <form onSubmit={manejarEnvio}>
          <div className="fila">
            <div className="campo">
              <label className="etiqueta" htmlFor="asig-cliente">Cliente (id)</label>
              <input
                id="asig-cliente"
                type="number"
                min="1"
                value={formulario.id_cliente}
                onChange={(e) => cambiarCampo('id_cliente', e.target.value)}
                required
              />
            </div>
            <div className="campo">
              <label className="etiqueta" htmlFor="asig-entrenador">Entrenador (id)</label>
              <input
                id="asig-entrenador"
                type="number"
                min="1"
                value={formulario.id_entrenador}
                onChange={(e) => cambiarCampo('id_entrenador', e.target.value)}
                required
              />
            </div>
            <div className="campo">
              <label className="etiqueta" htmlFor="asig-inicio">Fecha de inicio (opcional)</label>
              <input
                id="asig-inicio"
                type="date"
                value={formulario.fecha_inicio}
                onChange={(e) => cambiarCampo('fecha_inicio', e.target.value)}
              />
            </div>
          </div>
          <div className="fila">
            <button type="submit">Asignar entrenador</button>
          </div>
        </form>
      </section>

      <section className="tarjeta">
        <h1>Asignaciones</h1>
        <table className="tabla">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Entrenador</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {asignaciones.length === 0 && (
              <tr>
                <td colSpan={6}>No hay asignaciones registradas.</td>
              </tr>
            )}
            {asignaciones.map((asignacion) => (
              <tr key={asignacion.id_asignacion}>
                <td>{`${asignacion.cliente_nombre} ${asignacion.cliente_apellido}`}</td>
                <td>{asignacion.entrenador_nombre}</td>
                <td>{asignacion.fecha_inicio}</td>
                <td>{asignacion.fecha_fin || '—'}</td>
                <td>{asignacion.estado === 'vigente' ? 'Vigente' : 'Finalizada'}</td>
                <td>
                  {asignacion.estado === 'vigente' ? (
                    <button type="button" onClick={() => finalizar(asignacion)}>
                      Finalizar
                    </button>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
