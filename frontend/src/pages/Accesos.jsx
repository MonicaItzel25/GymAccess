// pages/Accesos.jsx
// Historial de intentos de acceso para administrador, recepcionista y
// entrenador (US-S2-09, FR-019). Muestra fecha, hora, resultado y motivo de
// rechazo, con filtros de fecha y cliente. No existe eliminación (FR-018).
// ES Modules (JSX).

import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Accesos() {
  const { usuario } = useAuth();
  const esEntrenador = usuario?.rol === 'entrenador';

  const [accesos, setAccesos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filtros, setFiltros] = useState({ desde: '', hasta: '', cliente: '' });
  const [error, setError] = useState('');

  async function cargar(f = filtros) {
    try {
      setAccesos(await api.listarAccesos(f));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    cargar();
    // El filtro por cliente no lo necesita el entrenador (solo asistencia).
    if (!esEntrenador) {
      api
        .listarClientes()
        .then(setClientes)
        .catch((e) => setError(e.message));
    }
  }, [esEntrenador]);

  function cambiarFiltro(campo, valor) {
    const nuevos = { ...filtros, [campo]: valor };
    setFiltros(nuevos);
    cargar(nuevos);
  }

  return (
    <section className="tarjeta">
      <h1>Historial de accesos</h1>
      {error && <div className="mensaje mensaje-error" role="alert">{error}</div>}

      <div className="fila">
        <div className="campo">
          <label className="etiqueta" htmlFor="acc-desde">Desde</label>
          <input
            id="acc-desde"
            type="date"
            value={filtros.desde}
            onChange={(e) => cambiarFiltro('desde', e.target.value)}
          />
        </div>
        <div className="campo">
          <label className="etiqueta" htmlFor="acc-hasta">Hasta</label>
          <input
            id="acc-hasta"
            type="date"
            value={filtros.hasta}
            onChange={(e) => cambiarFiltro('hasta', e.target.value)}
          />
        </div>
        {!esEntrenador && (
          <div className="campo">
            <label className="etiqueta" htmlFor="acc-cliente">Cliente</label>
            <select
              id="acc-cliente"
              value={filtros.cliente}
              onChange={(e) => cambiarFiltro('cliente', e.target.value)}
            >
              <option value="">Todos los clientes</option>
              {clientes.map((c) => (
                <option key={c.id_cliente} value={c.id_cliente}>
                  {c.nombre} {c.apellido}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <table className="tabla">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Cliente</th>
            <th>Resultado</th>
            <th>Motivo</th>
          </tr>
        </thead>
        <tbody>
          {accesos.length === 0 && (
            <tr>
              <td colSpan={5}>No hay intentos de acceso registrados.</td>
            </tr>
          )}
          {accesos.map((a) => (
            <tr key={a.id_acceso}>
              <td>{a.fecha}</td>
              <td>{a.hora}</td>
              <td>{a.cliente_nombre ? `${a.cliente_nombre} ${a.cliente_apellido}` : '—'}</td>
              <td>{a.resultado}</td>
              <td>{a.motivo_rechazo || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
