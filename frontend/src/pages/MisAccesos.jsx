// pages/MisAccesos.jsx
// Historial de accesos propios del cliente (US-S2-09, FR-036).
// El cliente solo ve sus propios intentos; el backend valida el rol.
// ES Modules (JSX).

import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function MisAccesos() {
  const [accesos, setAccesos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .misAccesos()
      .then(setAccesos)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <section className="tarjeta">
      <h1>Mis accesos</h1>
      {error && <div className="mensaje mensaje-error" role="alert">{error}</div>}
      <table className="tabla">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Resultado</th>
            <th>Motivo</th>
            <th>Origen</th>
          </tr>
        </thead>
        <tbody>
          {accesos.length === 0 && (
            <tr>
              <td colSpan={5}>No tienes intentos de acceso registrados.</td>
            </tr>
          )}
          {accesos.map((a) => (
            <tr key={a.id_acceso}>
              <td>{a.fecha}</td>
              <td>{a.hora}</td>
              <td>{a.resultado}</td>
              <td>{a.motivo_rechazo || '—'}</td>
              <td>{a.origen === 'manual' ? 'manual' : 'kiosco'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
