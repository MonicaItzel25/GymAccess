// pages/AutorizarIngreso.jsx
// Autorización manual de ingreso en recepción (US-S2-08, FR-030, RN-017).
// Procedimiento alternativo cuando el kiosco no identifica el rostro: el
// recepcionista o administrador verifica identidad y vigencia en pantalla y
// registra la decisión. El SERVIDOR es la única autoridad: la vigencia se
// evalúa en backend aunque se muestre aquí; si no está vigente, el backend
// responde 409 y no se crea registro autorizado.
// ES Modules (JSX).

import { useEffect, useState } from 'react';
import { api } from '../services/api';

/** Motivos sugeridos para un rechazo (catálogo del backend, research R10). */
const MOTIVOS_SUGERIDOS = ['identidad no verificable', 'membresia no vigente'];

export default function AutorizarIngreso() {
  const [clientes, setClientes] = useState([]);
  const [idCliente, setIdCliente] = useState('');
  const [membresias, setMembresias] = useState([]);
  const [resultado, setResultado] = useState('autorizado');
  const [motivo, setMotivo] = useState('');
  const [mensaje, setMensaje] = useState(null); // { tipo: 'exito' | 'error', texto }
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api
      .listarClientes()
      .then(setClientes)
      .catch((e) => setMensaje({ tipo: 'error', texto: e.message }));
  }, []);

  // Al elegir un cliente, muestra su membresía vigente para que el personal
  // verifique en pantalla; la decisión final la toma el servidor.
  useEffect(() => {
    setMembresias([]);
    if (!idCliente) return;
    api
      .listarMembresias(idCliente)
      .then(setMembresias)
      .catch(() => setMembresias([]));
  }, [idCliente]);

  async function enviar(e) {
    e.preventDefault();
    setMensaje(null);

    if (resultado === 'rechazado' && !motivo.trim()) {
      setMensaje({ tipo: 'error', texto: 'El motivo es obligatorio al rechazar el ingreso.' });
      return;
    }

    setEnviando(true);
    try {
      await api.accesoManual({
        id_cliente: Number(idCliente),
        resultado,
        motivo: resultado === 'rechazado' ? motivo.trim() : null,
      });
      setMensaje({
        tipo: 'exito',
        texto:
          resultado === 'autorizado'
            ? 'Ingreso autorizado y registrado con su responsable.'
            : 'Rechazo registrado con su motivo y responsable.',
      });
      setMotivo('');
    } catch (err) {
      // Se muestran los mensajes del servidor (p. ej. 409 de membresía no
      // vigente o 404 de cliente inexistente).
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  }

  const clienteElegido = clientes.find((c) => String(c.id_cliente) === String(idCliente));

  return (
    <section className="tarjeta">
      <h1>Autorizar ingreso manual</h1>
      <p className="etiqueta">
        Procedimiento alternativo cuando el rostro no se identifica en el kiosco (FR-030).
        Verifique la identidad y la vigencia; el servidor valida y registra la decisión.
      </p>

      {mensaje && (
        <div
          className={`mensaje ${mensaje.tipo === 'exito' ? 'mensaje-exito' : 'mensaje-error'}`}
          role="alert"
        >
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={enviar}>
        <div className="campo">
          <label className="etiqueta" htmlFor="am-cliente">Cliente</label>
          <select
            id="am-cliente"
            value={idCliente}
            onChange={(e) => setIdCliente(e.target.value)}
            required
          >
            <option value="">Seleccione un cliente…</option>
            {clientes.map((c) => (
              <option key={c.id_cliente} value={c.id_cliente}>
                {c.nombre} {c.apellido}
              </option>
            ))}
          </select>
        </div>

        {clienteElegido && (
          <div className="tarjeta">
            <p className="etiqueta">Membresía registrada (informativa; la vigencia la valida el servidor)</p>
            {membresias.length === 0 ? (
              <p>Este cliente no tiene membresías registradas.</p>
            ) : (
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                  </tr>
                </thead>
                <tbody>
                  {membresias.map((m) => (
                    <tr key={m.id_membresia}>
                      <td>{m.estado}</td>
                      <td>{m.fecha_inicio}</td>
                      <td>{m.fecha_fin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="campo">
          <span className="etiqueta">Resultado</span>
          <label htmlFor="am-autorizado">
            <input
              id="am-autorizado"
              type="radio"
              name="resultado"
              value="autorizado"
              checked={resultado === 'autorizado'}
              onChange={() => setResultado('autorizado')}
            />{' '}
            Autorizar ingreso
          </label>
          <label htmlFor="am-rechazado">
            <input
              id="am-rechazado"
              type="radio"
              name="resultado"
              value="rechazado"
              checked={resultado === 'rechazado'}
              onChange={() => setResultado('rechazado')}
            />{' '}
            Rechazar ingreso
          </label>
        </div>

        {resultado === 'rechazado' && (
          <div className="campo">
            <label className="etiqueta" htmlFor="am-motivo">Motivo del rechazo (obligatorio)</label>
            <input
              id="am-motivo"
              type="text"
              maxLength={100}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Escriba el motivo del rechazo"
              required
            />
            <div className="fila">
              {MOTIVOS_SUGERIDOS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="secundario"
                  onClick={() => setMotivo(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <button type="submit" disabled={enviando || !idCliente}>
          {enviando ? 'Registrando…' : 'Registrar decisión'}
        </button>
      </form>
    </section>
  );
}
