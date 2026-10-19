-- 006_pagos_id_operacion.sql
-- Migración correctiva del Sprint 2. Agrega `pagos.id_operacion`, el identificador
-- de la operación externa (referencia de transferencia o ticket de tarjeta) que
-- permite detectar y rechazar pagos duplicados (FR-017). El índice único compuesto
-- hace que la base devuelva el error que el servicio traduce a un 409.
--
-- Semántica del índice ante NULL: en MySQL, los valores NULL se consideran
-- distintos dentro de un índice único, por lo que los pagos SIN id_operacion
-- (p. ej. efectivo) no colisionan entre sí; solo colisionan dos registros con el
-- MISMO (id_cliente, id_operacion), que es exactamente el duplicado a rechazar.
--
-- NOTA DE ENTORNO (importante): esta migración NO incluye `USE gym_db;` a
-- propósito, igual que 004 y 005. Se aplica a la base que el runner tenga
-- seleccionada (`gym_db_pruebas` con `.env.test`). Fuente: data-model.md §3.3,
-- research.md R3, contrato §2.3.

ALTER TABLE pagos
  ADD COLUMN id_operacion VARCHAR(100) NULL,
  ADD UNIQUE KEY uq_pagos_cliente_operacion (id_cliente, id_operacion);
