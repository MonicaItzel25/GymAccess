// pages/Ejercicios.jsx
// Catálogo de ejercicios reutilizable (US-S3-08, Sprint 3).
// El administrador crea, modifica y activa/desactiva ejercicios (FR-011); el
// entrenador consulta el catálogo en modo SOLO LECTURA para usarlo en sus
// rutinas (FR-012, Clarification Q2). Un ejercicio desactivado se retira de
// las rutinas nuevas pero se conserva en el historial (RN-008, SC-004); la
// autorización real la valida el backend (FR-032). ES Modules (JSX).

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const FORMULARIO_INICIAL = { nombre: '', descripcion: '', grupo_muscular: '' };

export default function Ejercicios() {
  const { usuario } = useAuth();
  const esAdministrador = usuario?.rol === 'administrador';

  const [ejercicios, setEjercicios] = useState([]);
  const [filtro, setFiltro] = useState('activo');
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [editando, setEditando] = useState(null); // id del ejercicio en edición
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  async function cargar(estado = filtro) {
    try {
      setEjercicios(await api.listarEjercicios(estado));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    cargar('activo');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cambiarCampo(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  function prepararEdicion(ejercicio) {
    setEditando(ejercicio.id_ejercicio);
    setFormulario({
      nombre: ejercicio.nombre,
      descripcion: ejercicio.descripcion,
      grupo_muscular: ejercicio.grupo_muscular || '',
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
      descripcion: formulario.descripcion.trim(),
      grupo_muscular: formulario.grupo_muscular.trim() || null,
    };
    try {
      if (editando) {
        await api.actualizarEjercicio(editando, datos);
        setExito('Ejercicio modificado correctamente.');
        setEditando(null);
      } else {
        await api.crearEjercicio(datos);
        setExito('Ejercicio registrado correctamente.');
      }
      setFormulario(FORMULARIO_INICIAL);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function alternarEstado(ejercicio) {
    setError('');
    setExito('');
    try {
      const nuevo = ejercicio.estado === 'activo' ? 'inactivo' : 'activo';
      await api.cambiarEstadoEjercicio(ejercicio.id_ejercicio, nuevo);
      setExito(`Ejercicio ${nuevo === 'activo' ? 'activado' : 'desactivado'} correctamente.`);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function cambiarFiltro(valor) {
    setFiltro(valor);
    await cargar(valor);
  }

  return (
    <>
      {esAdministrador && (
        <section className="tarjeta">
          <h1>{editando ? 'Modificar ejercicio' : 'Registrar ejercicio'}</h1>
          {error && <div className="mensaje mensaje-error" role="alert">{error}</div>}
          {exito && <div className="mensaje mensaje-exito" role="status">{exito}</div>}

          <form onSubmit={manejarEnvio}>
            <div className="fila">
              <div className="campo">
                <label className="etiqueta" htmlFor="ej-nombre">Nombre del ejercicio</label>
                <input
                  id="ej-nombre"
                  value={formulario.nombre}
                  onChange={(e) => cambiarCampo('nombre', e.target.value)}
                  maxLength={100}
                  required
                />
              </div>
              <div className="campo">
                <label className="etiqueta" htmlFor="ej-descripcion">Descripción del ejercicio</label>
                <input
                  id="ej-descripcion"
                  value={formulario.descripcion}
                  onChange={(e) => cambiarCampo('descripcion', e.target.value)}
                  maxLength={255}
                  required
                />
              </div>
              <div className="campo">
                <label className="etiqueta" htmlFor="ej-grupo">Grupo muscular (opcional)</label>
                <input
                  id="ej-grupo"
                  value={formulario.grupo_muscular}
                  onChange={(e) => cambiarCampo('grupo_muscular', e.target.value)}
                  maxLength={50}
                />
              </div>
            </div>
            <div className="fila">
              <button type="submit">{editando ? 'Guardar cambios' : 'Registrar ejercicio'}</button>
              {editando && (
                <button type="button" onClick={cancelarEdicion}>Cancelar</button>
              )}
            </div>
          </form>
        </section>
      )}

      <section className="tarjeta">
        <div className="fila">
          <h1>Ejercicios</h1>
          {esAdministrador && (
            <div className="campo">
              <label className="etiqueta" htmlFor="ej-filtro">Mostrar</label>
              <select
                id="ej-filtro"
                value={filtro}
                onChange={(e) => cambiarFiltro(e.target.value)}
              >
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
                <option value="todos">Todos</option>
              </select>
            </div>
          )}
        </div>
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Grupo muscular</th>
              <th>Estado</th>
              {esAdministrador && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {ejercicios.length === 0 && (
              <tr>
                <td colSpan={esAdministrador ? 5 : 4}>No hay ejercicios en el catálogo.</td>
              </tr>
            )}
            {ejercicios.map((ejercicio) => (
              <tr key={ejercicio.id_ejercicio}>
                <td>{ejercicio.nombre}</td>
                <td>{ejercicio.descripcion}</td>
                <td>{ejercicio.grupo_muscular || '—'}</td>
                <td>{ejercicio.estado === 'activo' ? 'Activo' : 'Inactivo'}</td>
                {esAdministrador && (
                  <td>
                    <button type="button" onClick={() => prepararEdicion(ejercicio)}>Editar</button>{' '}
                    <button type="button" onClick={() => alternarEstado(ejercicio)}>
                      {ejercicio.estado === 'activo' ? 'Desactivar' : 'Activar'}
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
