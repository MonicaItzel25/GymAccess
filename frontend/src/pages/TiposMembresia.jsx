// pages/TiposMembresia.jsx
// Alta, consulta y edición de tipos de membresía (US-S2-01).
// Solo el administrador crea o modifica; la edición es en línea desde la tabla.
// ES Modules (JSX).

import { useEffect, useState } from 'react';
import { api } from '../services/api';

const FORMULARIO_INICIAL = {
  nombre: '',
  descripcion: '',
  duracion: '',
  precio: '',
  estado: 'activo',
};

export default function TiposMembresia() {
  const [tipos, setTipos] = useState([]);
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [editando, setEditando] = useState(null); // id del tipo en edición
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  async function cargar() {
    try {
      setTipos(await api.listarTiposMembresia());
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

  function prepararEdicion(tipo) {
    setEditando(tipo.id_tipo_membresia);
    setFormulario({
      nombre: tipo.nombre,
      descripcion: tipo.descripcion || '',
      duracion: tipo.duracion,
      precio: tipo.precio,
      estado: tipo.estado,
    });
    setError('');
    setExito('');
  }

  function cancelarEdicion() {
    setEditando(null);
    setFormulario(FORMULARIO_INICIAL);
    setError('');
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setError('');
    setExito('');
    const datos = {
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim() || null,
      duracion: Number(formulario.duracion),
      precio: Number(formulario.precio),
      estado: formulario.estado,
    };
    try {
      if (editando) {
        await api.modificarTipoMembresia(editando, datos);
        setExito('Tipo de membresía modificado correctamente.');
        setEditando(null);
      } else {
        await api.crearTipoMembresia(datos);
        setExito('Tipo de membresía creado correctamente.');
      }
      setFormulario(FORMULARIO_INICIAL);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <section className="tarjeta">
        <h1>{editando ? 'Modificar tipo de membresía' : 'Crear tipo de membresía'}</h1>
        {error && <div className="mensaje mensaje-error" role="alert">{error}</div>}
        {exito && <div className="mensaje mensaje-exito" role="status">{exito}</div>}

        <form onSubmit={manejarEnvio}>
          <div className="fila">
            <div className="campo">
              <label className="etiqueta" htmlFor="tipo-nombre">Nombre</label>
              <input
                id="tipo-nombre"
                value={formulario.nombre}
                onChange={(e) => cambiarCampo('nombre', e.target.value)}
                required
                minLength={2}
                maxLength={100}
              />
            </div>
            <div className="campo">
              <label className="etiqueta" htmlFor="tipo-duracion">Duración (días)</label>
              <input
                id="tipo-duracion"
                type="number"
                min="1"
                value={formulario.duracion}
                onChange={(e) => cambiarCampo('duracion', e.target.value)}
                required
              />
            </div>
            <div className="campo">
              <label className="etiqueta" htmlFor="tipo-precio">Precio</label>
              <input
                id="tipo-precio"
                type="number"
                min="0.01"
                step="0.01"
                value={formulario.precio}
                onChange={(e) => cambiarCampo('precio', e.target.value)}
                required
              />
            </div>
            <div className="campo">
              <label className="etiqueta" htmlFor="tipo-estado">Estado</label>
              <select
                id="tipo-estado"
                value={formulario.estado}
                onChange={(e) => cambiarCampo('estado', e.target.value)}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>
          <div className="campo">
            <label className="etiqueta" htmlFor="tipo-descripcion">Descripción</label>
            <input
              id="tipo-descripcion"
              value={formulario.descripcion}
              onChange={(e) => cambiarCampo('descripcion', e.target.value)}
              maxLength={255}
            />
          </div>
          <div className="fila">
            <button type="submit">{editando ? 'Guardar cambios' : 'Crear tipo'}</button>
            {editando && (
              <button type="button" onClick={cancelarEdicion}>Cancelar</button>
            )}
          </div>
        </form>
      </section>

      <section className="tarjeta">
        <h1>Tipos de membresía</h1>
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Duración</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tipos.length === 0 && (
              <tr>
                <td colSpan={6}>No hay tipos de membresía registrados.</td>
              </tr>
            )}
            {tipos.map((t) => (
              <tr key={t.id_tipo_membresia}>
                <td>{t.nombre}</td>
                <td>{t.descripcion || '—'}</td>
                <td>{t.duracion} días</td>
                <td>${t.precio}</td>
                <td>{t.estado}</td>
                <td>
                  <button type="button" onClick={() => prepararEdicion(t)}>Modificar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
