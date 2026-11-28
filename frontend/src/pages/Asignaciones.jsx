// pages/Asignaciones.jsx
// Asignación de entrenador a cliente (US-S3-02, Sprint 3).
// Administrador y recepcionista asignan un entrenador activo a un cliente
// activo y finalizan asignaciones; una única asignación vigente por cliente
// (FR-006, SC-003) y finalización con confirmación que conserva el historial
// (FR-007, FR-008). Cliente y entrenador se eligen en listas descriptivas y al
// backend se envían `id_cliente` e `id_entrenador`. La autorización real la
// valida el backend; la interfaz solo ofrece las opciones permitidas
// (FR-032). ES Modules (JSX).

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

const FORMULARIO_INICIAL = { id_cliente: '', id_entrenador: '', fecha_inicio: '' };

const fetchAssignments = () => api.listarAsignaciones();
const fetchClients = () => api.listarClientes();
const fetchTrainers = () => api.listarEntrenadores();

/** Carga un listado con indicador, error y reintento. Una recarga conserva los
 *  datos previos y solo se aplica la respuesta de la petición más reciente.
 *  Una respuesta que no sea un arreglo se trata como error de carga. */
function useList(fetcher) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
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
    reload();
  }, [reload]);

  /** Aplica un cambio ya confirmado por el backend a los datos cargados y
   *  descarta las respuestas pendientes, que podrían ser anteriores a él. */
  const update = useCallback((transform) => {
    latest.current += 1;
    setState((current) => ({
      ...current,
      loading: false,
      data: current.data === null ? null : transform(current.data),
    }));
  }, []);

  return { ...state, reload, update };
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

/** Devuelve los textos que aparecen más de una vez, sin distinguir mayúsculas
 *  ni espacios sobrantes. */
function findRepeated(labels) {
  const seen = new Set();
  const repeated = new Set();
  labels.forEach((label) => {
    const key = normalize(label);
    if (seen.has(key)) repeated.add(key);
    seen.add(key);
  });
  return repeated;
}

function normalize(text) {
  return text.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
}

/** Construye una etiqueta distinta para cada opción: texto base; un dato extra
 *  solo si el base se repite; y el ID como último recurso. */
function buildOptions(items, { getId, getBase, getExtra }) {
  const base = items.map(getBase);
  const repeatedBase = findRepeated(base);
  const detailed = items.map((item, index) => {
    const extra = getExtra(item);
    return repeatedBase.has(normalize(base[index])) && extra
      ? `${base[index]} — ${extra}`
      : base[index];
  });
  const repeatedDetailed = findRepeated(detailed);
  return items.map((item, index) => ({
    id: getId(item),
    label: repeatedDetailed.has(normalize(detailed[index]))
      ? `${detailed[index]} (ID ${getId(item)})`
      : detailed[index],
  }));
}

export default function Asignaciones() {
  const assignments = useList(fetchAssignments);
  const clients = useList(fetchClients);
  const trainers = useList(fetchTrainers);

  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [justFinalized, setJustFinalized] = useState(false);

  // La finalización ya está confirmada: si después falla alguna recarga, se
  // avisa de que la información en pantalla puede estar desactualizada.
  const refreshFailed =
    justFinalized && Boolean(assignments.error || clients.error || trainers.error);

  const isReady = (list) => !list.loading && !list.error && list.data !== null;
  // Sin las asignaciones no se sabe qué clientes siguen disponibles.
  const clientsReady = isReady(clients) && isReady(assignments);
  const trainersReady = isReady(trainers);

  let clientOptions = [];
  if (clientsReady) {
    const assigned = new Set(
      assignments.data.filter((a) => a.estado === 'vigente').map((a) => a.id_cliente)
    );
    clientOptions = buildOptions(
      clients.data.filter((client) => client.estado === 'activo'),
      {
        getId: (client) => client.id_cliente,
        getBase: (client) => `${client.nombre} ${client.apellido}`,
        getExtra: (client) => client.correo || client.telefono,
      }
    ).map((option) => ({ ...option, disabled: assigned.has(option.id) }));
  }

  let trainerOptions = [];
  if (trainersReady) {
    trainerOptions = buildOptions(
      trainers.data.filter((trainer) => trainer.estado === 'activo'),
      {
        getId: (trainer) => trainer.id_entrenador,
        getBase: (trainer) => `${trainer.nombre} — ${trainer.especialidad || 'Sin especialidad'}`,
        getExtra: (trainer) => trainer.telefono,
      }
    );
  }

  const hasFreeClient = clientOptions.some((option) => !option.disabled);
  // Una selección que ya no está disponible deja de contar.
  const selectedClient = clientOptions.some(
    (o) => !o.disabled && String(o.id) === formulario.id_cliente
  ) ? formulario.id_cliente : '';
  const selectedTrainer = trainerOptions.some((o) => String(o.id) === formulario.id_entrenador)
    ? formulario.id_entrenador
    : '';

  function cambiarCampo(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  function reloadAll() {
    return Promise.all([assignments.reload(), clients.reload(), trainers.reload()]);
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();
    if (processing) return;
    setError('');
    setExito('');
    setJustFinalized(false);
    if (!selectedClient || !selectedTrainer) {
      setError('Selecciona un cliente y un entrenador.');
      return;
    }
    setProcessing(true);
    try {
      await api.crearAsignacion({
        id_cliente: Number(selectedClient),
        id_entrenador: Number(selectedTrainer),
        fecha_inicio: formulario.fecha_inicio || null,
      });
      setExito('Entrenador asignado al cliente correctamente.');
      setFormulario(FORMULARIO_INICIAL);
      await reloadAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setProcessing(false);
    }
  }

  async function finalizar(asignacion) {
    if (processing) return;
    const confirmado = window.confirm(
      '¿Finalizar esta asignación? El entrenador dejará de gestionar al cliente.'
    );
    if (!confirmado) return;
    setError('');
    setExito('');
    setJustFinalized(false);
    setProcessing(true);
    try {
      const confirmed = await api.finalizarAsignacion(asignacion.id_asignacion, {});
      // Se refleja de inmediato, sin depender de que la recarga funcione.
      assignments.update((rows) => rows.map((row) =>
        row.id_asignacion === asignacion.id_asignacion
          ? { ...row, estado: 'finalizada', fecha_fin: confirmed?.fecha_fin ?? row.fecha_fin }
          : row));
      setExito('Asignación finalizada correctamente.');
      setJustFinalized(true);
      await reloadAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <>
      <section className="tarjeta">
        <h1>Asignar entrenador a cliente</h1>
        {error && <div className="mensaje mensaje-error" role="alert">{error}</div>}
        {exito && (
          <div className="mensaje mensaje-exito" role="status">
            {refreshFailed
              ? 'La asignación se finalizó correctamente, pero no fue posible actualizar la información. Usa «Reintentar» para volver a cargarla.'
              : exito}
          </div>
        )}

        <form onSubmit={manejarEnvio}>
          <div className="fila">
            <div className="campo">
              <label className="etiqueta" htmlFor="asig-cliente">Cliente</label>
              <select
                id="asig-cliente"
                value={selectedClient}
                onChange={(e) => cambiarCampo('id_cliente', e.target.value)}
                disabled={!clientsReady || !hasFreeClient}
                required
              >
                <option value="">Seleccione un cliente…</option>
                {clientOptions.map((option) => (
                  <option key={option.id} value={option.id} disabled={option.disabled}>
                    {option.disabled
                      ? `${option.label} · Ya tiene una asignación vigente`
                      : option.label}
                  </option>
                ))}
              </select>
              {(clients.loading || assignments.loading) && <p>Cargando clientes…</p>}
              {clientsReady && clientOptions.length === 0 && <p>No hay clientes activos.</p>}
              {clientsReady && clientOptions.length > 0 && !hasFreeClient && (
                <p>Todos los clientes activos ya tienen una asignación vigente.</p>
              )}
              {!assignments.loading && assignments.error && (
                <p>No se puede comprobar qué clientes están disponibles hasta cargar las asignaciones.</p>
              )}
            </div>
            <div className="campo">
              <label className="etiqueta" htmlFor="asig-entrenador">Entrenador</label>
              <select
                id="asig-entrenador"
                value={selectedTrainer}
                onChange={(e) => cambiarCampo('id_entrenador', e.target.value)}
                disabled={!trainersReady || trainerOptions.length === 0}
                required
              >
                <option value="">Seleccione un entrenador…</option>
                {trainerOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
              {trainers.loading && <p>Cargando entrenadores…</p>}
              {trainersReady && trainerOptions.length === 0 && <p>No hay entrenadores activos.</p>}
            </div>
            <div className="campo">
              <label className="etiqueta" htmlFor="asig-inicio">Fecha de inicio (opcional)</label>
              <input
                id="asig-inicio"
                type="date"
                value={formulario.fecha_inicio}
                onChange={(e) => cambiarCampo('fecha_inicio', e.target.value)}
              />
            </div>
          </div>
          {clients.error && (
            <LoadError
              message={`No se pudieron cargar los clientes: ${clients.error}`}
              retryText="Reintentar carga de clientes"
              onRetry={clients.reload}
            />
          )}
          {trainers.error && (
            <LoadError
              message={`No se pudieron cargar los entrenadores: ${trainers.error}`}
              retryText="Reintentar carga de entrenadores"
              onRetry={trainers.reload}
            />
          )}
          <div className="fila">
            <button
              type="submit"
              disabled={processing || !hasFreeClient || trainerOptions.length === 0}
            >
              {processing ? 'Procesando…' : 'Asignar entrenador'}
            </button>
          </div>
        </form>
      </section>

      <section className="tarjeta">
        <h1>Asignaciones</h1>
        {assignments.loading && <p>Cargando asignaciones…</p>}
        {assignments.error && (
          <LoadError
            message={`No se pudieron cargar las asignaciones: ${assignments.error}`}
            retryText="Reintentar carga de asignaciones"
            onRetry={assignments.reload}
          />
        )}
        <div className="tabla-desplazable">
          <table className="tabla">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Entrenador</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {assignments.data?.length === 0 && !assignments.loading && !assignments.error && (
                <tr>
                  <td colSpan={6}>No hay asignaciones registradas.</td>
                </tr>
              )}
              {(assignments.data ?? []).map((asignacion) => (
                <tr key={asignacion.id_asignacion}>
                  <td>{`${asignacion.cliente_nombre} ${asignacion.cliente_apellido}`}</td>
                  <td>{asignacion.entrenador_nombre}</td>
                  <td>{asignacion.fecha_inicio}</td>
                  <td>{asignacion.fecha_fin || '—'}</td>
                  <td>{asignacion.estado === 'vigente' ? 'Vigente' : 'Finalizada'}</td>
                  <td>
                    {asignacion.estado === 'vigente' ? (
                      <button type="button" onClick={() => finalizar(asignacion)} disabled={processing}>
                        Finalizar
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
