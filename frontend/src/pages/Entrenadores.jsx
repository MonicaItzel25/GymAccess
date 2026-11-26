// pages/Entrenadores.jsx
// Gestión de perfiles de entrenador (US-S3-01, Sprint 3).
// El administrador registra, edita y activa/desactiva perfiles vinculados a
// cuentas existentes con rol `entrenador` (FR-001, FR-002, FR-003). La
// autorización real la valida el backend; la interfaz solo ofrece las
// opciones permitidas (FR-032). ES Modules (JSX).

import { useEffect, useState } from 'react';
import { api } from '../services/api';

const FORMULARIO_ALTA = { id_usuario: '', especialidad: '', telefono: '' };

export default function Entrenadores() {
  const [entrenadores, setEntrenadores] = useState([]);
  const [formulario, setFormulario] = useState(FORMULARIO_ALTA);
  const [editando, setEditando] = useState(null); // id del perfil en edición
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  async function cargar() {
    try {
      setEntrenadores(await api.listarEntrenadores());
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

  function prepararEdicion(entrenador) {
    setEditando(entrenador.id_entrenador);
    setFormulario({
      id_usuario: '',
      especialidad: entrenador.especialidad || '',
      telefono: entrenador.telefono || '',
    });
    setError('');
    setExito('');
  }

  function cancelarEdicion() {
    setEditando(null);
    setFormulario(FORMULARIO_ALTA);
    setError('');
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setError('');
    setExito('');
    try {
      if (editando) {
        await api.actualizarEntrenador(editando, {
          especialidad: formulario.especialidad.trim() || null,
          telefono: formulario.telefono.trim() || null,
        });
        setExito('Entrenador modificado correctamente.');
        setEditando(null);
      } else {
        await api.crearEntrenador({
          id_usuario: Number(formulario.id_usuario),
          especialidad: formulario.especialidad.trim() || null,
          telefono: formulario.telefono.trim() || null,
        });
        setExito('Entrenador registrado correctamente.');
      }
      setFormulario(FORMULARIO_ALTA);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function alternarEstado(entrenador) {
    setError('');
    setExito('');
    try {
      const nuevo = entrenador.estado === 'activo' ? 'inactivo' : 'activo';
      await api.cambiarEstadoEntrenador(entrenador.id_entrenador, nuevo);
      setExito(`Entrenador ${nuevo === 'activo' ? 'activado' : 'desactivado'} correctamente.`);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <section className="tarjeta">
        <h1>{editando ? 'Modificar entrenador' : 'Registrar entrenador'}</h1>
        {error && <div className="mensaje mensaje-error" role="alert">{error}</div>}
        {exito && <div className="mensaje mensaje-exito" role="status">{exito}</div>}

        <form onSubmit={manejarEnvio}>
          <div className="fila">
            {!editando && (
              <div className="campo">
                <label className="etiqueta" htmlFor="ent-cuenta">Cuenta (id de usuario con rol entrenador)</label>
                <input
                  id="ent-cuenta"
                  type="number"
                  min="1"
                  value={formulario.id_usuario}
                  onChange={(e) => cambiarCampo('id_usuario', e.target.value)}
                  required
                />
              </div>
            )}
            <div className="campo">
              <label className="etiqueta" htmlFor="ent-especialidad">Especialidad</label>
              <input
                id="ent-especialidad"
                value={formulario.especialidad}
                onChange={(e) => cambiarCampo('especialidad', e.target.value)}
                maxLength={150}
              />
            </div>
            <div className="campo">
              <label className="etiqueta" htmlFor="ent-telefono">Teléfono</label>
              <input
                id="ent-telefono"
                value={formulario.telefono}
                onChange={(e) => cambiarCampo('telefono', e.target.value)}
                maxLength={20}
              />
            </div>
          </div>
          <div className="fila">
            <button type="submit">{editando ? 'Guardar cambios' : 'Registrar entrenador'}</button>
            {editando && (
              <button type="button" onClick={cancelarEdicion}>Cancelar</button>
            )}
          </div>
        </form>
      </section>

      <section className="tarjeta">
        <h1>Entrenadores</h1>
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Especialidad</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {entrenadores.length === 0 && (
              <tr>
                <td colSpan={5}>No hay entrenadores registrados.</td>
              </tr>
            )}
            {entrenadores.map((entrenador) => (
              <tr key={entrenador.id_entrenador}>
                <td>{entrenador.nombre}</td>
                <td>{entrenador.especialidad || '—'}</td>
                <td>{entrenador.telefono || '—'}</td>
                <td>{entrenador.estado === 'activo' ? 'Activo' : 'Inactivo'}</td>
                <td>
                  <button type="button" onClick={() => prepararEdicion(entrenador)}>Editar</button>{' '}
                  <button type="button" onClick={() => alternarEstado(entrenador)}>
                    {entrenador.estado === 'activo' ? 'Desactivar' : 'Activar'}
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
