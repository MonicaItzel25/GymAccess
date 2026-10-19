-- 005_accesos_autorizacion_manual.sql
-- Migración correctiva del Sprint 2. Agrega a `accesos` el usuario responsable
-- (`id_usuario`) y el origen de la decisión (`origen`) para la autorización
-- manual en recepción (FR-030, FR-034; RN-017). El kiosco deja `id_usuario`
-- NULL; la autorización manual registra al recepcionista o administrador que
-- verificó identidad y vigencia.
-- `accesos` NO almacena datos biométricos ni descriptores faciales (FR-020,
-- FR-027) y esta migración no añade ninguno.
--
-- NOTA DE ENTORNO (importante): esta migración NO incluye `USE gym_db;` a
-- propósito, igual que 004. Se aplica a la base que el runner tenga
-- seleccionada (`gym_db_pruebas` con `.env.test`). Fuente: data-model.md §3.2.

-- 1. Columnas nuevas. `origen` por defecto 'kiosco' para que el backfill
--    implícito describa correctamente los registros existentes.
ALTER TABLE accesos
  ADD COLUMN id_usuario INT NULL,
  ADD COLUMN origen ENUM('kiosco','manual') NOT NULL DEFAULT 'kiosco',
  ADD KEY idx_accesos_usuario (id_usuario),
  ADD CONSTRAINT fk_accesos_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill implícito: los registros previos son intentos del kiosco, por lo que
-- quedan con `origen='kiosco'` (DEFAULT) e `id_usuario` NULL. No se requiere
-- UPDATE adicional.
