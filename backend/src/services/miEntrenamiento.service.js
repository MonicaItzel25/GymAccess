// services/miEntrenamiento.service.js
// Consulta propia de rutina y progreso del cliente (Sprint 3, US-S3-05).
// La ficha se resuelve SIEMPRE por el correo de la sesión (RN-006): ninguna
// función recibe identificadores de la petición, de modo que no es posible
// consultar a un tercero (FR-023). Sin registros se devuelven estados vacíos
// (`null` o `[]`), no errores (FR-024). Solo lectura: no escribe ni audita.
// ES Modules.

import * as rutinaModelo from '../models/rutina.model.js';
import * as objetivoModelo from '../models/objetivo.model.js';
import * as progresoModelo from '../models/progreso.model.js';
import { obtenerPorCorreoUsuario } from './cliente.service.js';

/** Identificador de la ficha vinculada a la cuenta; 404 si no existe. */
async function idClientePropio(usuario) {
  const cliente = await obtenerPorCorreoUsuario(usuario.correo);
  return cliente.id_cliente;
}

/** Rutina activa con ejercicios y parámetros, o null. */
export async function obtenerRutina(usuario) {
  return rutinaModelo.obtenerActivaPorCliente(await idClientePropio(usuario));
}

/** Historial de objetivos, del más antiguo al más reciente. */
export async function listarObjetivos(usuario) {
  return objetivoModelo.listar({ idCliente: await idClientePropio(usuario) });
}

/** Historial de progreso en orden cronológico ascendente. */
export async function listarProgresos(usuario) {
  return progresoModelo.listar({ idCliente: await idClientePropio(usuario) });
}
