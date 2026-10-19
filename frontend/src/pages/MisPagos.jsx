// pages/MisPagos.jsx
// Pagos y adeudos propios del cliente (US-S2-05, FR-020).
// El cliente consulta solo su información; el backend valida el rol.
// ES Modules (JSX).

import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function MisPagos() {
  const [pagos, setPagos] = useState([]);
  const [adeudos, setAdeudos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .misPagos()
      .then(setPagos)
      .catch((e) => setError(e.message));
    api
      .misAdeudos()
      .then(setAdeudos)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <section className="tarjeta">
        <h1>Mis adeudos</h1>
        {error && <div className="mensaje mensaje-error" role="alert">{error}</div>}
        <table className="tabla">
          <thead>
            <tr>
              <th>Membresía</th>
              <th>Tipo</th>
              <th>Precio</th>
              <th>Pagado</th>
              <th>Adeudo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {adeudos.length === 0 && (
              <tr>
                <td colSpan={6}>No tienes membresías registradas.</td>
              </tr>
            )}
            {adeudos.map((a) => (
              <tr key={a.id_membresia}>
                <td>#{a.id_membresia}</td>
                <td>{a.tipo}</td>
                <td>${a.precio}</td>
                <td>${a.total_pagado}</td>
                <td>{Number(a.adeudo) > 0 ? `$${a.adeudo}` : 'Sin deuda'}</td>
                <td>{a.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="tarjeta">
        <h1>Mis pagos</h1>
        <table className="tabla">
          <thead>
            <tr>
              <th>Monto</th>
              <th>Método</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {pagos.length === 0 && (
              <tr>
                <td colSpan={4}>No tienes pagos registrados.</td>
              </tr>
            )}
            {pagos.map((p) => (
              <tr key={p.id_pago}>
                <td>${p.monto}</td>
                <td>{p.metodo_pago}</td>
                <td>{p.fecha_pago}</td>
                <td>{p.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
