-- 001_crear_base_datos.sql
-- Crea la base de datos del proyecto con la codificación requerida.
-- Motor InnoDB y utf8mb4 exigidos por la constitución (principio III y IV).

CREATE DATABASE IF NOT EXISTS gym_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
