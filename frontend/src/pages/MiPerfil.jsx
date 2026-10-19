// pages/MiPerfil.jsx
// Consulta de la información propia del cliente (rol cliente, FR-024, spec Sprint 1).
// Solo lectura: el cliente nunca modifica sus datos desde esta vista.
// ES Modules (JSX).

import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function MiPerfil() {
  const [cliente, setCliente] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api
      .miPerfil()
      .then((datos) => setCliente(datos))
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return <p className="centrado">Cargando tu información…</p>;
  }

  if (error) {
    return (
      <section className="tarjeta">
        <h1>Mi perfil</h1>
        <div className="mensaje mensaje-error" role="alert">{error}</div>
      </section>
    );
  }

  return (
    <section className="tarjeta">
      <h1>Mi perfil</h1>
      <p className="subtitulo">Tu información personal registrada en el gimnasio</p>

      <table className="tabla">
        <tbody>
          <tr>
            <th>Nombre</th>
            <td>{cliente.nombre}</td>
          </tr>
          <tr>
            <th>Apellido</th>
            <td>{cliente.apellido}</td>
          </tr>
          <tr>
            <th>Correo</th>
            <td>{cliente.correo || '—'}</td>
          </tr>
          <tr>
            <th>Teléfono</th>
            <td>{cliente.telefono || '—'}</td>
          </tr>
          <tr>
            <th>Dirección</th>
            <td>{cliente.direccion || '—'}</td>
          </tr>
          <tr>
            <th>Fecha de registro</th>
            <td>{new Date(cliente.fecha_registro).toLocaleDateString('es')}</td>
          </tr>
          <tr>
            <th>Estado</th>
            <td>{cliente.estado}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
