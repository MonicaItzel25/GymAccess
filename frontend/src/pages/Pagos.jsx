// pages/Pagos.jsx
// Registro y consulta de pagos (US-S2-04). El administrador y el
// recepcionista registran pagos parciales con método del catálogo; el
// historial se muestra por cliente. No existe eliminación de pagos (FR-016).
// ES Modules (JSX).

import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const METODOS = ['efectivo', 'transferencia', 'tarjeta'];

const FORMULARIO_INICIAL = {
  id_cliente: '',
  id_membresia: '',
  monto: '',
  metodo_pago: 'efectivo',
};

export default function Pagos() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'administrador';

  const [pagos, setPagos] = useState([]);
  const [adeudos, setAdeudos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [membresias, setMembresias] = useState([]);
  const [filtroCliente, setFiltroCliente] = useState('');
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  async function cargarPagos(cliente = '') {
    try {
      setPagos(await api.listarPagos(cliente || null));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    api
      .listarClientes()
      .then(setClientes)
      .catch((e) => setError(e.message));
    cargarPagos();
    // La consulta de adeudos global es exclusiva del administrador (US-S2-05.3).
    if (esAdmin) {
      api
        .listarAdeudos()
        .then(setAdeudos)
        .catch((e) => setError(e.message));
    }
  }, [esAdmin]);

  async function cambiarCliente(evento) {
    const id = evento.target.value;
    setFormulario((actual) => ({ ...actual, id_cliente: id, id_membresia: '' }));
    if (!id) {
      setMembresias([]);
      return;
    }
    try {
      setMembresias(await api.listarMembresias(id));
    } catch (e) {
      setError(e.message);
    }
  }

  function cambiarCampo(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setError('');
    setExito('');
    try {
      const pago = await api.registrarPago({
        id_cliente: Number(formulario.id_cliente),
        id_membresia: Number(formulario.id_membresia),
        monto: Number(formulario.monto),
        metodo_pago: formulario.metodo_pago,
      });
      setExito(`Pago de $${pago.monto} registrado correctamente.`);
      setFormulario(FORMULARIO_INICIAL);
      setMembresias([]);
      await cargarPagos(filtroCliente);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <section className="tarjeta">
        <h1>Registrar pago</h1>
        {error && <div className="mensaje mensaje-error" role="alert">{error}</div>}
        {exito && <div className="mensaje mensaje-exito" role="status">{exito}</div>}

        <form onSubmit={manejarEnvio}>
          <div className="fila">
            <div className="campo">
              <label className="etiqueta" htmlFor="pago-cliente">Cliente</label>
              <select
                id="pago-cliente"
                value={formulario.id_cliente}
                onChange={cambiarCliente}
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
              <label className="etiqueta" htmlFor="pago-membresia">Membresía</label>
              <select
                id="pago-membresia"
                value={formulario.id_membresia}
                onChange={(e) => cambiarCampo('id_membresia', e.target.value)}
                required
                disabled={!formulario.id_cliente}
              >
                <option value="">Seleccione una membresía</option>
                {membresias.map((m) => (
                  <option key={m.id_membresia} value={m.id_membresia}>
                    #{m.id_membresia} — {m.tipo_nombre} ({m.estado})
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label className="etiqueta" htmlFor="pago-monto">Monto</label>
              <input
                id="pago-monto"
                type="number"
                min="0.01"
                step="0.01"
                value={formulario.monto}
                onChange={(e) => cambiarCampo('monto', e.target.value)}
                required
              />
            </div>
            <div className="campo">
              <label className="etiqueta" htmlFor="pago-metodo">Método de pago</label>
              <select
                id="pago-metodo"
                value={formulario.metodo_pago}
                onChange={(e) => cambiarCampo('metodo_pago', e.target.value)}
              >
                {METODOS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit">Registrar pago</button>
        </form>
      </section>

      <section className="tarjeta">
        <h1>Historial de pagos</h1>

        <div className="fila">
          <div className="campo">
            <label className="etiqueta" htmlFor="pago-filtro">Filtrar por cliente</label>
            <select
              id="pago-filtro"
              value={filtroCliente}
              onChange={(e) => {
                setFiltroCliente(e.target.value);
                cargarPagos(e.target.value);
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
              <th>Membresía</th>
              <th>Monto</th>
              <th>Método</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {pagos.length === 0 && (
              <tr>
                <td colSpan={6}>No hay pagos registrados.</td>
              </tr>
            )}
            {pagos.map((p) => (
              <tr key={p.id_pago}>
                <td>{p.cliente_nombre} {p.cliente_apellido}</td>
                <td>#{p.id_membresia}</td>
                <td>${p.monto}</td>
                <td>{p.metodo_pago}</td>
                <td>{p.fecha_pago}</td>
                <td>{p.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {esAdmin && (
        <section className="tarjeta">
          <h1>Adeudos por membresía</h1>
          <p className="etiqueta">
            Adeudo = precio acordado de la membresía − suma de pagos registrados (FR-018).
          </p>
          <table className="tabla">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Precio</th>
                <th>Pagado</th>
                <th>Adeudo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {adeudos.length === 0 && (
                <tr>
                  <td colSpan={6}>No hay membresías para calcular adeudos.</td>
                </tr>
              )}
              {adeudos.map((a) => (
                <tr key={a.id_membresia}>
                  <td>{a.cliente}</td>
                  <td>{a.tipo}</td>
                  <td>${a.precio}</td>
                  <td>${a.total_pagado}</td>
                  <td>{Number(a.adeudo) > 0 ? `$${a.adeudo}` : 'Sin deuda'}</td>
                  <td>{a.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
