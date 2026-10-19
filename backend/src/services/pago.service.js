// services/pago.service.js
// Lógica de negocio de los pagos (FR-014, FR-015): pagos parciales, monto > 0
// y método del catálogo. La membresía debe existir y ser coherente con el
// cliente. No hay eliminación de pagos. Toda acción queda en auditoría
// (FR-037). ES Modules.

import * as modelo from '../models/pago.model.js';
import * as membresiaModelo from '../models/membresia.model.js';
import * as auditoria from './auditoria.service.js';
import { esMetodoPagoValido, METODOS_PAGO } from '../utils/catalogos.js';
import { ErrorServicio } from '../utils/errorServicio.js';

/** Lista pagos; filtro opcional por cliente. */
export async function listar({ idCliente = null } = {}) {
  return modelo.listar(idCliente);
}

/** Calcula el adeudo de una membresía: precio acordado − SUMA(pagos pagados)
 *  (FR-018, RN-006). Usa `precio_acordado` (capturado al asignar/renovar), no el
 *  precio vigente del catálogo: cambiar el catálogo no altera membresías ya
 *  emitidas (FR-005). Nunca devuelve negativo. */
export async function calcularAdeudo(idMembresia) {
  const membresia = await membresiaModelo.obtenerPorId(idMembresia);
  if (!membresia) {
    throw new ErrorServicio('Membresía no encontrada', 404);
  }
  const totalPagado = await modelo.sumarPagosPorMembresia(idMembresia);
  const precio = Number(membresia.precio_acordado);
  const adeudo = Math.max(0, precio - totalPagado);
  return {
    id_membresia: membresia.id_membresia,
    id_cliente: membresia.id_cliente,
    cliente: `${membresia.cliente_nombre} ${membresia.cliente_apellido}`,
    tipo: membresia.tipo_nombre,
    precio,
    total_pagado: totalPagado,
    adeudo,
    estado: membresia.estado,
  };
}

/** Devuelve el adeudo de todas las membresías (consulta del administrador, FR-019). */
export async function listarAdeudos() {
  const membresias = await membresiaModelo.listar(null);
  const resultados = [];
  for (const m of membresias) {
    const totalPagado = await modelo.sumarPagosPorMembresia(m.id_membresia);
    const precio = Number(m.precio_acordado);
    resultados.push({
      id_membresia: m.id_membresia,
      id_cliente: m.id_cliente,
      cliente: `${m.cliente_nombre} ${m.cliente_apellido}`,
      tipo: m.tipo_nombre,
      precio,
      total_pagado: totalPagado,
      adeudo: Math.max(0, precio - totalPagado),
      estado: m.estado,
      fecha_fin: m.fecha_fin,
    });
  }
  return resultados;
}

/** Devuelve los adeudos de las membresías del propio cliente (FR-020). */
export async function listarAdeudosPorCorreo(correo) {
  const { obtenerPorCorreo } = await import('../models/cliente.model.js');
  const cliente = await obtenerPorCorreo(correo);
  if (!cliente) return [];
  const membresias = await membresiaModelo.listar(cliente.id_cliente);
  const resultados = [];
  for (const m of membresias) {
    const totalPagado = await modelo.sumarPagosPorMembresia(m.id_membresia);
    const precio = Number(m.precio_acordado);
    resultados.push({
      id_membresia: m.id_membresia,
      id_cliente: m.id_cliente,
      cliente: `${m.cliente_nombre} ${m.cliente_apellido}`,
      tipo: m.tipo_nombre,
      precio,
      total_pagado: totalPagado,
      adeudo: Math.max(0, precio - totalPagado),
      estado: m.estado,
      fecha_fin: m.fecha_fin,
    });
  }
  return resultados;
}

/** Lista los pagos del propio cliente (por su correo de usuario). */
export async function listarPorCorreo(correo) {
  const { obtenerPorCorreo } = await import('../models/cliente.model.js');
  const cliente = await obtenerPorCorreo(correo);
  if (!cliente) return [];
  return modelo.listar(cliente.id_cliente);
}

/** Registra un pago con todas las reglas (FR-014) y protección de duplicados
 *  por id_operacion (FR-017, contracts/api-sprint2.md §1.2). */
export async function registrarPago({ idCliente, idMembresia, monto, metodoPago, idOperacion = null }, idUsuario = null) {
  // 1. Monto positivo.
  const montoNum = Number(monto);
  if (!(montoNum > 0)) {
    throw new ErrorServicio('El monto debe ser un número positivo', 400);
  }

  // 2. Método del catálogo (sin alterar la migración 002, research §7).
  if (!esMetodoPagoValido(metodoPago)) {
    throw new ErrorServicio(
      `El método de pago debe ser uno de: ${METODOS_PAGO.join(', ')}`,
      400
    );
  }

  // 3. La membresía debe existir y pertenecer al cliente indicado.
  const membresia = await membresiaModelo.obtenerPorId(idMembresia);
  if (!membresia) {
    throw new ErrorServicio('Membresía no encontrada', 404);
  }
  if (Number(membresia.id_cliente) !== Number(idCliente)) {
    throw new ErrorServicio('La membresía no pertenece a ese cliente', 400);
  }

  // 4. Protección de duplicados (FR-017): mismo (id_cliente, id_operacion) → 409.
  const operacion = idOperacion ? String(idOperacion).trim() : null;
  if (operacion) {
    const existe = await modelo.existeOperacion(Number(idCliente), operacion);
    if (existe) {
      throw new ErrorServicio(
        'Ya existe un pago registrado con ese id_operacion para este cliente',
        409
      );
    }
  }

  // 5. Registra el pago (permite parciales: no valida saldo restante).
  const id = await modelo.crear({
    idCliente: Number(idCliente),
    idMembresia: Number(idMembresia),
    monto: montoNum,
    metodoPago,
    idOperacion: operacion,
  });

  await auditoria.registrarAccion({
    idUsuario,
    accion: 'registrar_pago',
    modulo: 'pagos',
    resultado: 'exitoso',
    descripcion: `Pago #${id} de $${montoNum} (${metodoPago}) a la membresía #${idMembresia}`,
  });

  return modelo.obtenerPorId(id);
}
