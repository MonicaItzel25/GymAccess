// pages/Clientes.jsx
// Gestión de clientes: alta, listado con búsqueda y modificación.
// Administrador y recepcionista registran/editan; entrenador solo consulta.
// ES Modules (JSX).

import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const FORMULARIO_INICIAL = {
  nombre: '',
  apellido: '',
  correo: '',
  telefono: '',
  direccion: '',
};

export default function Clientes() {
  const { usuario } = useAuth();
  const puedeEscribir = ['administrador', 'recepcionista'].includes(usuario?.rol);

  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [editando, setEditando] = useState(null); // id del cliente en edición
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  async function cargar(termino = '') {
    try {
      setClientes(await api.listarClientes(termino));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function manejarBusqueda(evento) {
    evento.preventDefault();
    await cargar(busqueda.trim());
  }

  function cambiarCampo(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setError('');
    setExito('');
    try {
      if (editando) {
        const confirmar = window.confirm(
          `¿Guardar los cambios del cliente \"${formulario.nombre} ${formulario.apellido}\"?`
        );
        if (!confirmar) return;
        await api.actualizarCliente(editando, formulario);
        setExito(`Cliente \"${formulario.nombre} ${formulario.apellido}\" actualizado.`);
      } else {
        await api.crearCliente(formulario);
        setExito(`Cliente \"${formulario.nombre} ${formulario.apellido}\" registrado.`);
      }
      setFormulario(FORMULARIO_INICIAL);
      setEditando(null);
      await cargar(busqueda.trim());
    } catch (e) {
      setError(e.message);
    }
  }

  function comenzarEdicion(cliente) {
    setEditando(cliente.id_cliente);
    setFormulario({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      correo: cliente.correo || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
    });
    setError('');
    setExito('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelarEdicion() {
    setEditando(null);
    setFormulario(FORMULARIO_INICIAL);
    setError('');
    setExito('');
  }

  return (
    <>
      <section className="tarjeta">
        <h1>{editando ? 'Editar cliente' : 'Registrar cliente'}</h1>
        {error && <div className="mensaje mensaje-error" role="alert">{error}</div>}
        {exito && <div className="mensaje mensaje-exito" role="status">{exito}</div>}

        {puedeEscribir && (
          <form onSubmit={manejarEnvio}>
            <div className="fila">
              <div className="campo">
                <label className="etiqueta" htmlFor="cli-nombre">Nombre</label>
                <input
                  id="cli-nombre"
                  value={formulario.nombre}
                  onChange={(e) => cambiarCampo('nombre', e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>
              <div className="campo">
                <label className="etiqueta" htmlFor="cli-apellido">Apellido</label>
                <input
                  id="cli-apellido"
                  value={formulario.apellido}
                  onChange={(e) => cambiarCampo('apellido', e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>
              <div className="campo">
                <label className="etiqueta" htmlFor="cli-correo">Correo (opcional)</label>
                <input
                  id="cli-correo"
                  type="email"
                  value={formulario.correo}
                  onChange={(e) => cambiarCampo('correo', e.target.value)}
                />
              </div>
            </div>
            <div className="fila">
              <div className="campo">
                <label className="etiqueta" htmlFor="cli-telefono">Teléfono (opcional)</label>
                <input
                  id="cli-telefono"
                  value={formulario.telefono}
                  onChange={(e) => cambiarCampo('telefono', e.target.value)}
                  maxLength={20}
                />
              </div>
              <div className="campo">
                <label className="etiqueta" htmlFor="cli-direccion">Dirección (opcional)</label>
                <input
                  id="cli-direccion"
                  value={formulario.direccion}
                  onChange={(e) => cambiarCampo('direccion', e.target.value)}
                  maxLength={200}
                />
              </div>
            </div>
            <button type="submit">
              {editando ? 'Guardar cambios' : 'Registrar cliente'}
            </button>
            {editando && (
              <button type="button" className="secundario" onClick={cancelarEdicion}>
                Cancelar
              </button>
            )}
          </form>
        )}
      </section>

      <section className="tarjeta">
        <h1>Clientes</h1>

        <form className="fila" onSubmit={manejarBusqueda}>
          <div className="campo">
            <label className="etiqueta" htmlFor="buscar">Buscar por nombre o apellido</label>
            <input
              id="buscar"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Ej. López"
            />
          </div>
          <button type="submit">Buscar</button>
          {busqueda && (
            <button
              type="button"
              className="secundario"
              onClick={() => {
                setBusqueda('');
                cargar('');
              }}
            >
              Limpiar
            </button>
          )}
        </form>

        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Apellido</th>
              {usuario?.rol !== 'entrenador' && <th>Correo</th>}
              <th>Teléfono</th>
              <th>Estado</th>
              {puedeEscribir && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 && (
              <tr>
                <td colSpan={6}>No hay clientes registrados.</td>
              </tr>
            )}
            {clientes.map((cliente) => (
              <tr key={cliente.id_cliente}>
                <td>{cliente.nombre}</td>
                <td>{cliente.apellido}</td>
                {usuario?.rol !== 'entrenador' && <td>{cliente.correo || '—'}</td>}
                <td>{cliente.telefono || '—'}</td>
                <td>{cliente.estado}</td>
                {puedeEscribir && (
                  <td>
                    <button type="button" className="secundario" onClick={() => comenzarEdicion(cliente)}>
                      Editar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
