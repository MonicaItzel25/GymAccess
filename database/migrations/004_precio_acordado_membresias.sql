-- 004_precio_acordado_membresias.sql
-- Migración correctiva del Sprint 2. Agrega `membresias.precio_acordado`, el
-- precio congelado al momento de asignar o renovar una membresía (FR-005,
-- FR-007, FR-011, FR-018; decisión de precio acordado, 2026-10-15). Sin este
-- campo, los adeudos se calculan con el precio vigente del catálogo y un cambio
-- de precio altera retroactivamente membresías ya emitidas (comportamiento no
-- deseado, RN-016).
--
-- NOTA DE ENTORNO (importante): esta migración NO incluye `USE gym_db;` a
-- propósito. El runner `database/migrate.mjs` selecciona la base destino al
-- conectar (`gym_db` en producción, o `gym_db_pruebas` cuando se inyecta
-- `.env.test`); al omitir el `USE` fijo, el script se aplica a la base que el
-- runner tenga seleccionada. Las migraciones 001–003 sí llevan `USE gym_db;` y
-- NO se modifican (quedan intactas); en el entorno de pruebas se omiten porque
-- ya están registradas en `migraciones`, por lo que su `USE` jamás se ejecuta.
-- Fuente: data-model.md §3.1, research.md R6.

-- 1. Columna nullable para poder backfillear antes de imponer NOT NULL.
ALTER TABLE membresias
  ADD COLUMN precio_acordado DECIMAL(10,2) NULL;

-- 2. Backfill con el precio vigente del tipo.
--    LIMITACIÓN DOCUMENTADA (research.md R6): no existe historial de precios, por
--    lo que para las membresías cuyo tipo cambió de precio antes de esta
--    migración el valor registrado será el precio ACTUAL del tipo, no el
--    histórico. Es la única reconstrucción posible. Las membresías creadas o
--    renovadas DESDE ESTA MIGRACIÓN sí capturan su precio al momento del evento.
--    La FK fk_membresias_tipo (ON DELETE RESTRICT) garantiza que cada membresía
--    tiene un tipo válido, por lo que el JOIN cubre todas las filas.
UPDATE membresias m
  JOIN tipos_membresia t ON t.id_tipo_membresia = m.id_tipo_membresia
   SET m.precio_acordado = t.precio
 WHERE m.precio_acordado IS NULL;

-- 3. Precio acordado pasa a ser obligatorio.
ALTER TABLE membresias
  MODIFY precio_acordado DECIMAL(10,2) NOT NULL;
