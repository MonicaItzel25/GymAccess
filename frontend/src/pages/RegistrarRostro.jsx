// pages/RegistrarRostro.jsx
// Registro de información facial de un cliente (US-S2-06). El administrador o
// el recepcionista seleccionan un cliente, capturan su rostro y el descriptor
// se envía al backend. Confirma con fecha al registrarse. ES Modules (JSX).

import { useEffect, useState } from 'react';
import { api } from '../services/api';
import CapturaRostro from '../components/CapturaRostro';

export default function RegistrarRostro() {
  const [clientes, setClientes] = useState([]);
  const [idCliente, setIdCliente] = useState('');
  const [estadoRostro, setEstadoRostro] = useState(null);
  const [descriptor, setDescriptor] = useState(null);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api
      .listarClientes()
      .then(setClientes)
      .catch((e) => setError(e.message));
  }, []);

  async function seleccionarCliente(evento) {
    const id = evento.target.value;
    setIdCliente(id);
    setDescriptor(null);
    setExito('');
    setError('');
    setEstadoRostro(null);
    if (!id) return;
    try {
      setEstadoRostro(await api.obtenerEstadoRostro(id));
    } catch (e) {
      setError(e.message);
    }
  }

  async function manejarRegistro(desc) {
    setDescriptor(desc);
    setGuardando(true);
    setError('');
    setExito('');
    try {
      const resultado = await api.registrarRostro(Number(idCliente), desc);
      const fecha = new Date(resultado.fecha_registro).toLocaleDateString('es-MX');
      setExito(`Rostro registrado correctamente. Fecha: ${fecha}.`);
      setEstadoRostro(resultado);
      setDescriptor(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="tarjeta">
      <h1>Registrar rostro</h1>
      {error && <div className="mensaje mensaje-error" role="alert">{error}</div>}
      {exito && <div className="mensaje mensaje-exito" role="status">{exito}</div>}

      <div className="fila">
        <div className="campo">
          <label className="etiqueta" htmlFor="rostro-cliente">Cliente</label>
          <select id="rostro-cliente" value={idCliente} onChange={seleccionarCliente} required>
            <option value="">Seleccione un cliente</option>
            {clientes.map((c) => (
              <option key={c.id_cliente} value={c.id_cliente}>
                {c.nombre} {c.apellido}
              </option>
            ))}
          </select>
        </div>
      </div>

      {idCliente && estadoRostro?.tiene_rostro && (
        <p className="etiqueta">
          Este cliente ya tiene rostro registrado (fecha:{' '}
          {new Date(estadoRostro.fecha_registro).toLocaleDateString('es-MX')}). Si captura de
          nuevo, se actualizará sin duplicar.
        </p>
      )}

      {idCliente && (
        <CapturaRostro onDescriptor={manejarRegistro} activo={!guardando} />
      )}

      {guardando && <p className="etiqueta">Guardando descriptor…</p>}
    </section>
  );
}
