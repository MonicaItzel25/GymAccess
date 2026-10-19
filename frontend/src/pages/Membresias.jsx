// pages/Membresias.jsx
// Asignación, consulta y ciclo de vida de membresías (US-S2-02, US-S2-03).
// El administrador y el recepcionista asignan y renuevan; suspender, reactivar
// y cancelar es exclusivo del administrador (FR-012). Acciones sensibles con
// confirmación previa (constitución XI). ES Modules (JSX).

import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Membresias() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'administrador';
  const puedeEscribir = ['administrador', 'recepcionista'].includes(usuario?.rol);

  const [membresias, setMembresias] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [filtroCliente, setFiltroCliente] = useState('');
  const [formulario, setFormulario] = useState({
    id_cliente: '',
    id_tipo_membresia: '',
    fecha_inicio: '',
  });
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  async function cargarMembresias(cliente = '') {
    try {
      setMembresias(await api.listarMembresias(cliente || null));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    async function cargarOpciones() {
      try {
        const [listaClientes, listaTipos] = await Promise.all([
          api.listarClientes(),
          api.listarTiposMembresia(),
        ]);
        setClientes(listaClientes);
        setTipos(listaTipos.filter((t) => t.estado === 'activo'));
      } catch (e) {
        setError(e.message);
      }
    }
    cargarMembresias();
    cargarOpciones();
  }, []);

  function cambiarCampo(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setError('');
    setExito('');
    try {
      const datos = {
        id_cliente: Number(formulario.id_cliente),
        id_tipo_membresia: Number(formulario.id_tipo_membresia),
      };
      if (formulario.fecha_inicio) datos.fecha_inicio = formulario.fecha_inicio;
      const creada = await api.crearMembresia(datos);
      setExito(`Membresía registrada hasta el ${creada.fecha_fin}.`);
      setFormulario({ id_cliente: '', id_tipo_membresia: '', fecha_inicio: '' });
      await cargarMembresias(filtroCliente);
    } catch (e) {
      setError(e.message);
    }
  }

  /** Ejecuta una acción de ciclo de vida con confirmación previa. */
  async function ejecutarAccion(membresia, accion) {
    setError('');
    setExito('');
    const descripciones = {
      renovar: `¿Renovar la membresía #${membresia.id_membresia} de ${membresia.cliente_nombre} ${membresia.cliente_apellido}? Se cerrará la vigente y se creará el nuevo periodo.`,
      suspender: `¿Suspender la membresía #${membresia.id_membresia}? El cliente no podrá ingresar hasta reactivarla.`,
      reactivar: `¿Reactivar la membresía #${membresia.id_membresia}?`,
      cancelar: `¿CANCELAR la membresía #${membresia.id_membresia}? Esta acción no se puede deshacer.`,
    };
    if (!window.confirm(descripciones[accion])) return;

    try {
      if (accion === 'renovar') {
        const nueva = await api.renovarMembresia(membresia.id_membresia, {});
        setExito(`Membresía renovada hasta el ${nueva.fecha_fin}.`);
      } else if (accion === 'suspender') {
        await api.suspenderMembresia(membresia.id_membresia);
        setExito('Membresía suspendida.');
      } else if (accion === 'reactivar') {
        await api.reactivarMembresia(membresia.id_membresia);
        setExito('Membresía reactivada.');
      } else if (accion === 'cancelar') {
        await api.cancelarMembresia(membresia.id_membresia);
        setExito('Membresía cancelada.');
      }
      await cargarMembresias(filtroCliente);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <section className="tarjeta">
        <h1>Asignar membresía</h1>
        {error && <div className="mensaje mensaje-error" role="alert">{error}</div>}
        {exito && <div className="mensaje mensaje-exito" role="status">{exito}</div>}

        <form onSubmit={manejarEnvio}>
          <div className="fila">
            <div className="campo">
              <label className="etiqueta" htmlFor="mem-cliente">Cliente</label>
              <select
                id="mem-cliente"
                value={formulario.id_cliente}
                onChange={(e) => cambiarCampo('id_cliente', e.target.value)}
                required
              >
                <option value="">Seleccione un cliente</option>
                {clientes.map((c) => (
                  <option key={c.id_cliente} value={c.id_cliente}>
                    {c.nombre} {c.apellido}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label className="etiqueta" htmlFor="mem-tipo">Tipo de membresía</label>
              <select
                id="mem-tipo"
                value={formulario.id_tipo_membresia}
                onChange={(e) => cambiarCampo('id_tipo_membresia', e.target.value)}
                required
              >
                <option value="">Seleccione un tipo</option>
                {tipos.map((t) => (
                  <option key={t.id_tipo_membresia} value={t.id_tipo_membresia}>
                    {t.nombre} — {t.duracion} días — ${t.precio}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label className="etiqueta" htmlFor="mem-inicio">Fecha de inicio (opcional)</label>
              <input
                id="mem-inicio"
                type="date"
                value={formulario.fecha_inicio}
                onChange={(e) => cambiarCampo('fecha_inicio', e.target.value)}
              />
            </div>
          </div>
          <button type="submit">Asignar membresía</button>
        </form>
      </section>

      <section className="tarjeta">
        <h1>Membresías</h1>

        <div className="fila">
          <div className="campo">
            <label className="etiqueta" htmlFor="mem-filtro">Filtrar por cliente</label>
            <select
              id="mem-filtro"
              value={filtroCliente}
              onChange={(e) => {
                setFiltroCliente(e.target.value);
                cargarMembresias(e.target.value);
              }}
            >
              <option value="">Todos los clientes</option>
              {clientes.map((c) => (
                <option key={c.id_cliente} value={c.id_cliente}>
                  {c.nombre} {c.apellido}
                </option>
              ))}
            </select>
          </div>
        </div>

        <table className="tabla">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Estado</th>
              {puedeEscribir && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {membresias.length === 0 && (
              <tr>
                <td colSpan={puedeEscribir ? 6 : 5}>No hay membresías registradas.</td>
              </tr>
            )}
            {membresias.map((m) => (
              <tr key={m.id_membresia}>
                <td>{m.cliente_nombre} {m.cliente_apellido}</td>
                <td>{m.tipo_nombre}</td>
                <td>{m.fecha_inicio}</td>
                <td>{m.fecha_fin}</td>
                <td>{m.estado}</td>
                {puedeEscribir && (
                  <td>
                    <div className="fila">
                      {(m.estado === 'activa' || m.estado === 'vencida') && (
                        <button type="button" onClick={() => ejecutarAccion(m, 'renovar')}>
                          Renovar
                        </button>
                      )}
                      {esAdmin && m.estado === 'activa' && (
                        <button type="button" onClick={() => ejecutarAccion(m, 'suspender')}>
                          Suspender
                        </button>
                      )}
                      {esAdmin && m.estado === 'suspendida' && (
                        <button type="button" onClick={() => ejecutarAccion(m, 'reactivar')}>
                          Reactivar
                        </button>
                      )}
                      {esAdmin && m.estado !== 'cancelada' && (
                        <button type="button" onClick={() => ejecutarAccion(m, 'cancelar')}>
                          Cancelar
                        </button>
                      )}
                    </div>
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
