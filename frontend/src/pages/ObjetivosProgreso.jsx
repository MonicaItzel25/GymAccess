// pages/ObjetivosProgreso.jsx
// Objetivos y progreso de los clientes del entrenador (US-S3-04, Sprint 3).
// El entrenador registra y consulta SOLO de clientes con asignación vigente;
// el backend valida la vigencia y el perfil activo (FR-032, RN-005). Los
// objetivos activos se pueden editar, marcar como alcanzados o cerrar; el
// historial de progreso solo admite altas (FR-021). Es seguimiento deportivo,
// nunca diagnóstico médico (RN-013). ES Modules (JSX).

import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

const OBJETIVO_VACIO = { meta: '', unidad: '', fecha_objetivo: '' };
const PROGRESO_VACIO = {
  id_objetivo: '',
  fecha: '',
  valor_numerico: '',
  avance: '',
  comentario: '',
};
const NOMBRE_ESTADO = { activo: 'Activo', alcanzado: 'Alcanzado', cerrado: 'Cerrado' };

export default function ObjetivosProgreso() {
  const [asignaciones, setAsignaciones] = useState(null); // null = cargando
  const [idCliente, setIdCliente] = useState('');
  const [objetivos, setObjetivos] = useState([]);
  const [progresos, setProgresos] = useState([]);
  const [objetivo, setObjetivo] = useState(OBJETIVO_VACIO);
  const [progreso, setProgreso] = useState(PROGRESO_VACIO);
  const [editando, setEditando] = useState(null); // id del objetivo en edición
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  // Cliente visible: descarta respuestas tardías de un cliente anterior.
  const clienteActual = useRef('');

  useEffect(() => {
    api
      .listarAsignaciones()
      .then(setAsignaciones)
      .catch((e) => {
        setAsignaciones([]);
        setError(e.message);
      });
  }, []);

  async function cargarHistorial(cliente) {
    try {
      const [listaObjetivos, listaProgresos] = await Promise.all([
        api.listarObjetivos(Number(cliente)),
        api.listarProgresos(Number(cliente)),
      ]);
      if (clienteActual.current !== cliente) return;
      setObjetivos(listaObjetivos);
      setProgresos(listaProgresos);
    } catch (e) {
      if (clienteActual.current === cliente) setError(e.message);
    }
  }

  function limpiarMensajes() {
    setError('');
    setExito('');
  }

  function seleccionarCliente(cliente) {
    clienteActual.current = cliente;
    setIdCliente(cliente);
    setObjetivos([]);
    setProgresos([]);
    setObjetivo(OBJETIVO_VACIO);
    setProgreso(PROGRESO_VACIO);
    setEditando(null);
    limpiarMensajes();
    if (cliente) cargarHistorial(cliente);
  }

  /** Ejecuta una escritura, muestra su resultado y recarga el historial. */
  async function guardar(operacion, mensaje, alTerminar) {
    limpiarMensajes();
    const cliente = idCliente;
    try {
      await operacion();
      if (clienteActual.current !== cliente) return;
      alTerminar?.();
      setExito(mensaje);
      await cargarHistorial(cliente);
    } catch (e) {
      if (clienteActual.current === cliente) setError(e.message);
    }
  }

  function cancelarEdicion() {
    setEditando(null);
    setObjetivo(OBJETIVO_VACIO);
    limpiarMensajes();
  }

  function prepararEdicion(fila) {
    limpiarMensajes();
    setEditando(fila.id_objetivo);
    setObjetivo({
      meta: fila.meta,
      unidad: fila.unidad ?? '',
      fecha_objetivo: fila.fecha_objetivo,
    });
  }

  function enviarObjetivo(evento) {
    evento.preventDefault();
    const datos = {
      meta: objetivo.meta.trim(),
      unidad: objetivo.unidad.trim() || null,
      fecha_objetivo: objetivo.fecha_objetivo,
    };
    guardar(
      () =>
        editando
          ? api.actualizarObjetivo(editando, datos)
          : api.crearObjetivo({ id_cliente: Number(idCliente), ...datos }),
      editando ? 'Objetivo modificado correctamente.' : 'Objetivo registrado correctamente.',
      () => {
        setEditando(null);
        setObjetivo(OBJETIVO_VACIO);
      }
    );
  }

  function terminarObjetivo(fila, estado) {
    const accion = estado === 'alcanzado' ? 'Marcar como alcanzado' : 'Cerrar';
    if (!window.confirm(`¿${accion} el objetivo «${fila.meta}»? Después no podrá modificarse.`)) {
      return;
    }
    guardar(
      () => api.cambiarEstadoObjetivo(fila.id_objetivo, estado),
      estado === 'alcanzado' ? 'Objetivo marcado como alcanzado.' : 'Objetivo cerrado.',
      () => {
        if (editando === fila.id_objetivo) {
          setEditando(null);
          setObjetivo(OBJETIVO_VACIO);
        }
        setProgreso((actual) =>
          actual.id_objetivo === String(fila.id_objetivo) ? { ...actual, id_objetivo: '' } : actual
        );
      }
    );
  }

  function enviarProgreso(evento) {
    evento.preventDefault();
    // El backend exige al menos un valor o un avance (FR-020).
    guardar(
      () =>
        api.crearProgreso({
          id_cliente: Number(idCliente),
          id_objetivo: progreso.id_objetivo ? Number(progreso.id_objetivo) : null,
          fecha: progreso.fecha,
          valor_numerico: progreso.valor_numerico === '' ? null : Number(progreso.valor_numerico),
          avance: progreso.avance.trim() || null,
          comentario: progreso.comentario.trim() || null,
        }),
      'Progreso registrado correctamente.',
      () => setProgreso(PROGRESO_VACIO)
    );
  }

  const cambiarObjetivo = (campo) => (e) =>
    setObjetivo((actual) => ({ ...actual, [campo]: e.target.value }));
  const cambiarProgreso = (campo) => (e) =>
    setProgreso((actual) => ({ ...actual, [campo]: e.target.value }));

  const objetivosActivos = objetivos.filter((fila) => fila.estado === 'activo');
  const nombreObjetivo = (id) =>
    objetivos.find((fila) => fila.id_objetivo === id)?.meta ?? '—';

  return (
    <>
      <section className="tarjeta">
        <h1>Objetivos y progreso</h1>
        <p>Información de seguimiento deportivo; no constituye un diagnóstico médico.</p>
        {error && <div className="mensaje mensaje-error" role="alert">{error}</div>}
        {exito && <div className="mensaje mensaje-exito" role="status">{exito}</div>}

        {asignaciones === null && <p>Cargando asignaciones…</p>}
        {asignaciones?.length === 0 && <p>No tienes clientes con asignación vigente.</p>}
        {asignaciones?.length > 0 && (
          <div className="campo">
            <label className="etiqueta" htmlFor="op-cliente">Cliente</label>
            <select
              id="op-cliente"
              value={idCliente}
              onChange={(e) => seleccionarCliente(e.target.value)}
            >
              <option value="">Selecciona un cliente</option>
              {asignaciones.map((asignacion) => (
                <option key={asignacion.id_asignacion} value={asignacion.id_cliente}>
                  {`${asignacion.cliente_nombre} ${asignacion.cliente_apellido}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {idCliente && (
        <>
          <section className="tarjeta">
            <h2>{editando ? 'Modificar objetivo' : 'Nuevo objetivo'}</h2>
            <form onSubmit={enviarObjetivo}>
              <div className="fila">
                <div className="campo">
                  <label className="etiqueta" htmlFor="op-meta">Meta</label>
                  <input
                    id="op-meta"
                    value={objetivo.meta}
                    onChange={cambiarObjetivo('meta')}
                    maxLength={255}
                    required
                  />
                </div>
                <div className="campo">
                  <label className="etiqueta" htmlFor="op-unidad">Unidad (opcional)</label>
                  <input
                    id="op-unidad"
                    value={objetivo.unidad}
                    onChange={cambiarObjetivo('unidad')}
                    maxLength={30}
                  />
                </div>
                <div className="campo">
                  <label className="etiqueta" htmlFor="op-fecha-objetivo">Fecha objetivo</label>
                  <input
                    id="op-fecha-objetivo"
                    type="date"
                    value={objetivo.fecha_objetivo}
                    onChange={cambiarObjetivo('fecha_objetivo')}
                    required
                  />
                </div>
              </div>
              <div className="fila">
                <button type="submit">{editando ? 'Guardar cambios' : 'Registrar objetivo'}</button>
                {editando && (
                  <button type="button" onClick={cancelarEdicion}>Cancelar</button>
                )}
              </div>
            </form>

            <h2>Objetivos registrados</h2>
            <div className="tabla-desplazable">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Objetivo</th>
                    <th>Unidad</th>
                    <th>Para el</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {objetivos.length === 0 && (
                    <tr>
                      <td colSpan={5}>Sin objetivos registrados.</td>
                    </tr>
                  )}
                  {objetivos.map((fila) => (
                    <tr key={fila.id_objetivo}>
                      <td>{fila.meta}</td>
                      <td>{fila.unidad ?? '—'}</td>
                      <td>{fila.fecha_objetivo}</td>
                      <td>{NOMBRE_ESTADO[fila.estado] ?? fila.estado}</td>
                      <td>
                        {fila.estado === 'activo' ? (
                          <>
                            <button type="button" onClick={() => prepararEdicion(fila)}>Editar</button>{' '}
                            <button type="button" onClick={() => terminarObjetivo(fila, 'alcanzado')}>
                              Alcanzado
                            </button>{' '}
                            <button type="button" onClick={() => terminarObjetivo(fila, 'cerrado')}>
                              Cerrar
                            </button>
                          </>
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

          <section className="tarjeta">
            <h2>Nueva entrada de progreso</h2>
            <p>Captura un valor numérico, un avance descrito o ambos.</p>
            <form onSubmit={enviarProgreso}>
              <div className="fila">
                <div className="campo">
                  <label className="etiqueta" htmlFor="op-fecha">Fecha del progreso</label>
                  <input
                    id="op-fecha"
                    type="date"
                    value={progreso.fecha}
                    onChange={cambiarProgreso('fecha')}
                    required
                  />
                </div>
                <div className="campo">
                  <label className="etiqueta" htmlFor="op-asociado">Objetivo asociado (opcional)</label>
                  <select
                    id="op-asociado"
                    value={progreso.id_objetivo}
                    onChange={cambiarProgreso('id_objetivo')}
                  >
                    <option value="">Ninguno</option>
                    {objetivosActivos.map((fila) => (
                      <option key={fila.id_objetivo} value={fila.id_objetivo}>{fila.meta}</option>
                    ))}
                  </select>
                </div>
                <div className="campo">
                  <label className="etiqueta" htmlFor="op-valor">Valor numérico (opcional)</label>
                  <input
                    id="op-valor"
                    type="number"
                    min="0"
                    max="999999.99"
                    step="any"
                    value={progreso.valor_numerico}
                    onChange={cambiarProgreso('valor_numerico')}
                  />
                </div>
                <div className="campo">
                  <label className="etiqueta" htmlFor="op-avance">Avance descrito (opcional)</label>
                  <input
                    id="op-avance"
                    value={progreso.avance}
                    onChange={cambiarProgreso('avance')}
                    maxLength={150}
                  />
                </div>
                <div className="campo">
                  <label className="etiqueta" htmlFor="op-comentario">Comentario (opcional)</label>
                  <input
                    id="op-comentario"
                    value={progreso.comentario}
                    onChange={cambiarProgreso('comentario')}
                    maxLength={255}
                  />
                </div>
              </div>
              <button type="submit">Registrar progreso</button>
            </form>

            <h2>Historial de progreso</h2>
            <div className="tabla-desplazable">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Objetivo</th>
                    <th>Valor</th>
                    <th>Avance</th>
                    <th>Comentario</th>
                  </tr>
                </thead>
                <tbody>
                  {progresos.length === 0 && (
                    <tr>
                      <td colSpan={5}>Sin entradas de progreso.</td>
                    </tr>
                  )}
                  {progresos.map((fila) => (
                    <tr key={fila.id_progreso}>
                      <td>{fila.fecha}</td>
                      <td>{nombreObjetivo(fila.id_objetivo)}</td>
                      <td>{fila.valor_numerico ?? '—'}</td>
                      <td>{fila.avance ?? '—'}</td>
                      <td>{fila.comentario ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
