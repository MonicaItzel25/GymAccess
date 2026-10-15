// services/rostro.service.js
// Lógica de negocio de la información facial: registro y consulta de
// metadatos, con las reglas de protección de datos biométricos (FR-011,
// FR-020). El descriptor NUNCA sale de aquí hacia la API. ES Modules.

import * as modelo from '../models/rostro.model.js';
import * as clienteModelo from '../models/cliente.model.js';
import * as auditoria from './auditoria.service.js';
import { ErrorServicio } from '../utils/errorServicio.js';
import { distancia, obtenerUmbral } from '../utils/matchRostro.js';

/** Registra o actualiza el descriptor facial de un cliente existente (FR-011).
 *  Devuelve solo metadatos; nunca el descriptor (FR-020). */
export async function registrarRostro(idCliente, descriptor, idUsuario = null) {
  // El cliente debe existir antes de asociar información facial (FR-011).
  const cliente = await clienteModelo.obtenerPorId(idCliente);
  if (!cliente) {
    throw new ErrorServicio('Cliente no encontrado', 404);
  }

  const esCreacion = await modelo.registrarOActualizar(idCliente, descriptor);

  await auditoria.registrarAccion({
    idUsuario,
    accion: esCreacion ? 'registrar_rostro' : 'actualizar_rostro',
    modulo: 'rostros',
    resultado: 'exitoso',
    descripcion: `Rostro ${esCreacion ? 'registrado' : 'actualizado'} del cliente #${idCliente}`,
  });

  const estado = await obtenerEstadoRostro(idCliente);
  return { ...estado, es_creacion: esCreacion };
}

/** Devuelve los metadatos del rostro de un cliente (sin el descriptor). */
export async function obtenerEstadoRostro(idCliente) {
  const metadatos = await modelo.obtenerMetadatos(idCliente);
  if (!metadatos) {
    return { tiene_rostro: false, fecha_registro: null, estado: null };
  }
  return {
    tiene_rostro: true,
    fecha_registro: metadatos.fecha_registro,
    estado: metadatos.estado,
  };
}

/** Compara un descriptor contra los descriptores activos registrados y
 *  devuelve el cliente identificado, o null si ninguno coincide (FR-014).
 *  Uso interno del backend; la comparación se hace en memoria (research §2).
 *  Permite inyectar `comparar` y `umbral` para las pruebas. */
export async function identificarCliente(descriptor, { comparar = distancia, umbral = obtenerUmbral() } = {}) {
  const descriptores = await modelo.listarDescriptoresActivos();

  let mejor = null;
  let mejorDistancia = Infinity;

  for (const registro of descriptores) {
    const almacenado = typeof registro.descriptor_facial === 'string'
      ? JSON.parse(registro.descriptor_facial)
      : registro.descriptor_facial;
    const distancia = comparar(descriptor, almacenado);
    if (distancia < mejorDistancia) {
      mejorDistancia = distancia;
      mejor = registro;
    }
  }

  if (mejor && mejorDistancia <= umbral) {
    return {
      id_cliente: mejor.id_cliente,
      nombre: mejor.nombre,
      apellido: mejor.apellido,
      distancia: mejorDistancia,
    };
  }
  return null;
}
