// pages/Entrenadores.jsx
// Gestión de perfiles de entrenador (US-S3-01, Sprint 3).
// El administrador registra, edita y activa/desactiva perfiles vinculados a
// cuentas existentes con rol `entrenador` (FR-001, FR-002, FR-003). La cuenta
// se elige en una lista descriptiva y al backend se envía su `id_usuario`.
// La autorización real la valida el backend; la interfaz solo ofrece las
// opciones permitidas (FR-032). ES Modules (JSX).

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const FORMULARIO_ALTA = { id_usuario: '', especialidad: '', telefono: '' };

const fetchTrainers = () => api.listarEntrenadores();
const fetchUsers = () => api.listarUsuarios();

/** Carga un listado con indicador, error y reintento. Una recarga conserva los
 *  datos previos y solo se aplica la respuesta de la petición más reciente.
 *  Una respuesta que no sea un arreglo se trata como error de carga. */
function useList(fetcher, enabled = true) {
  const [state, setState] = useState({ data: null, loading: enabled, error: '' });
  const latest = useRef(0);

  const reload = useCallback(async () => {
    const turn = ++latest.current;
    setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const data = await fetcher();
      if (!Array.isArray(data)) throw new Error('La respuesta del servidor no es válida');
      if (turn === latest.current) setState({ data, loading: false, error: '' });
    } catch (e) {
      if (turn === latest.current) {
        setState((current) => ({ ...current, loading: false, error: e.message }));
      }
    }
  }, [fetcher]);

  useEffect(() => {
    if (enabled) reload();
  }, [enabled, reload]);

  return { ...state, reload };
}

/** Error de carga con la opción de reintentar. */
function LoadError({ message, retryText, onRetry }) {
  return (
    <div className="mensaje mensaje-error" role="alert">
      <span>{message}</span>{' '}
      <button type="button" onClick={onRetry}>{retryText}</button>
    </div>
  );
}

export default function Entrenadores() {
  const { usuario } = useAuth();
  // Solo el administrador puede consultar las cuentas de usuario.
  const isAdmin = usuario?.rol === 'administrador';

  const trainers = useList(fetchTrainers);
  const users = useList(fetchUsers, isAdmin);

  const [formulario, setFormulario] = useState(FORMULARIO_ALTA);
  const [editando, setEditando] = useState(null); // id del perfil en edición
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Para saber qué cuentas ya tienen perfil hacen falta ambos listados al día.
  const optionsLoading = isAdmin && (users.loading || trainers.loading);
  const optionsReady =
    isAdmin && !optionsLoading && !users.error && !trainers.error &&
    users.data !== null && trainers.data !== null;

  let accounts = [];
  if (optionsReady) {
    const withProfile = new Set(trainers.data.map((trainer) => trainer.id_usuario));
    accounts = users.data
      .filter((user) =>
        user.rol === 'entrenador' && user.estado === 'activo' && !withProfile.has(user.id_usuario))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }
  // Una selección que ya no está disponible deja de contar.
  const selectedAccount = accounts.some((a) => String(a.id_usuario) === formulario.id_usuario)
    ? formulario.id_usuario
    : '';

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
    if (processing) return;
    setError('');
    setExito('');
    if (!editando && !selectedAccount) {
      setError('Selecciona una cuenta de entrenador.');
      return;
    }
    setProcessing(true);
    try {
      if (editando) {
        await api.actualizarEntrenador(editando, {
          especialidad: formulario.especialidad.trim() || null,
          telefono: formulario.telefono.trim() || null,
        });
        setExito('Entrenador modificado correctamente.');
        setEditando(null);
        setFormulario(FORMULARIO_ALTA);
        await trainers.reload();
      } else {
        await api.crearEntrenador({
          id_usuario: Number(selectedAccount),
          especialidad: formulario.especialidad.trim() || null,
          telefono: formulario.telefono.trim() || null,
        });
        setExito('Entrenador registrado correctamente.');
        setFormulario(FORMULARIO_ALTA);
        await Promise.all([trainers.reload(), users.reload()]);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setProcessing(false);
    }
  }

  async function alternarEstado(entrenador) {
    if (processing) return;
    setError('');
    setExito('');
    setProcessing(true);
    try {
      const nuevo = entrenador.estado === 'activo' ? 'inactivo' : 'activo';
      await api.cambiarEstadoEntrenador(entrenador.id_entrenador, nuevo);
      setExito(`Entrenador ${nuevo === 'activo' ? 'activado' : 'desactivado'} correctamente.`);
      await trainers.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setProcessing(false);
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
                <label className="etiqueta" htmlFor="ent-cuenta">Cuenta de entrenador</label>
                <select
                  id="ent-cuenta"
                  value={selectedAccount}
                  onChange={(e) => cambiarCampo('id_usuario', e.target.value)}
                  disabled={!optionsReady || accounts.length === 0}
                  required
                >
                  <option value="">Seleccione una cuenta…</option>
                  {accounts.map((account) => (
                    <option key={account.id_usuario} value={account.id_usuario}>
                      {`${account.nombre} — ${account.correo}`}
                    </option>
                  ))}
                </select>
                {optionsLoading && <p>Cargando cuentas disponibles…</p>}
                {optionsReady && accounts.length === 0 && (
                  <p>No hay cuentas de entrenador activas sin perfil.</p>
                )}
                {!isAdmin && <p>Solo el administrador puede registrar entrenadores.</p>}
                {isAdmin && !optionsLoading && trainers.error && (
                  <p>No se pueden mostrar las cuentas hasta cargar la lista de entrenadores.</p>
                )}
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
          {!editando && users.error && (
            <LoadError
              message={`No se pudieron cargar las cuentas: ${users.error}`}
              retryText="Reintentar carga de cuentas"
              onRetry={users.reload}
            />
          )}
          <div className="fila">
            <button
              type="submit"
              disabled={processing || (!editando && (!optionsReady || accounts.length === 0))}
            >
              {processing ? 'Guardando…' : editando ? 'Guardar cambios' : 'Registrar entrenador'}
            </button>
            {editando && (
              <button type="button" onClick={cancelarEdicion} disabled={processing}>Cancelar</button>
            )}
          </div>
        </form>
      </section>

      <section className="tarjeta">
        <h1>Entrenadores</h1>
        {trainers.loading && <p>Cargando entrenadores…</p>}
        {trainers.error && (
          <LoadError
            message={`No se pudieron cargar los entrenadores: ${trainers.error}`}
            retryText="Reintentar carga de entrenadores"
            onRetry={trainers.reload}
          />
        )}
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
            {trainers.data?.length === 0 && !trainers.loading && !trainers.error && (
              <tr>
                <td colSpan={5}>No hay entrenadores registrados.</td>
              </tr>
            )}
            {(trainers.data ?? []).map((entrenador) => (
              <tr key={entrenador.id_entrenador}>
                <td>{entrenador.nombre}</td>
                <td>{entrenador.especialidad || '—'}</td>
                <td>{entrenador.telefono || '—'}</td>
                <td>{entrenador.estado === 'activo' ? 'Activo' : 'Inactivo'}</td>
                <td>
                  <button type="button" onClick={() => prepararEdicion(entrenador)} disabled={processing}>
                    Editar
                  </button>{' '}
                  <button type="button" onClick={() => alternarEstado(entrenador)} disabled={processing}>
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
