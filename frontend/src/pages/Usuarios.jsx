// pages/Usuarios.jsx
// Gestión de usuarios y roles (exclusiva del administrador).
// ES Modules (JSX).

import { useEffect, useState } from 'react';
import { api } from '../services/api';

const ROLES = ['administrador', 'recepcionista', 'entrenador', 'cliente'];

const FORMULARIO_INICIAL = { nombre: '', correo: '', password: '', rol: 'recepcionista' };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  async function cargar() {
    try {
      setUsuarios(await api.listarUsuarios());
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
      await api.crearUsuario(formulario);
      setExito(`Usuario "${formulario.nombre}" registrado correctamente.`);
      setFormulario(FORMULARIO_INICIAL);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function cambiarRol(usuario, rol) {
    setError('');
    setExito('');
    try {
      await api.modificarUsuario(usuario.id_usuario, { rol });
      setExito(`Rol de ${usuario.nombre} actualizado a ${rol}.`);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function cambiarEstado(usuario) {
    const nuevoEstado = usuario.estado === 'activo' ? 'inactivo' : 'activo';
    setError('');
    setExito('');
    try {
      await api.modificarUsuario(usuario.id_usuario, { estado: nuevoEstado });
      setExito(`Usuario ${usuario.nombre}: estado ${nuevoEstado}.`);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <section className="tarjeta">
        <h1>Registrar usuario</h1>
        {error && <div className="mensaje mensaje-error" role="alert">{error}</div>}
        {exito && <div className="mensaje mensaje-exito" role="status">{exito}</div>}

        <form onSubmit={manejarEnvio}>
          <div className="fila">
            <div className="campo">
              <label className="etiqueta" htmlFor="nombre">Nombre</label>
              <input
                id="nombre"
                value={formulario.nombre}
                onChange={(e) => cambiarCampo('nombre', e.target.value)}
                required
                minLength={2}
                maxLength={100}
              />
            </div>
            <div className="campo">
              <label className="etiqueta" htmlFor="correo">Correo</label>
              <input
                id="correo"
                type="email"
                value={formulario.correo}
                onChange={(e) => cambiarCampo('correo', e.target.value)}
                required
              />
            </div>
            <div className="campo">
              <label className="etiqueta" htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                value={formulario.password}
                onChange={(e) => cambiarCampo('password', e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="campo">
              <label className="etiqueta" htmlFor="rol">Rol</label>
              <select
                id="rol"
                value={formulario.rol}
                onChange={(e) => cambiarCampo('rol', e.target.value)}
              >
                {ROLES.map((rol) => (
                  <option key={rol} value={rol}>{rol}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit">Registrar usuario</button>
        </form>
      </section>

      <section className="tarjeta">
        <h1>Usuarios del sistema</h1>
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id_usuario}>
                <td>{usuario.nombre}</td>
                <td>{usuario.correo}</td>
                <td>
                  <select
                    value={usuario.rol}
                    onChange={(e) => cambiarRol(usuario, e.target.value)}
                    aria-label={`Rol de ${usuario.nombre}`}
                  >
                    {ROLES.map((rol) => (
                      <option key={rol} value={rol}>{rol}</option>
                    ))}
                  </select>
                </td>
                <td>{usuario.estado}</td>
                <td>
                  <button
                    type="button"
                    className={usuario.estado === 'activo' ? 'peligro' : 'secundario'}
                    onClick={() => cambiarEstado(usuario)}
                  >
                    {usuario.estado === 'activo' ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
