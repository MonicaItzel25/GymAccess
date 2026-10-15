-- 002_tipos_membresia_ejemplo.sql
-- Semilla opcional de tipos de membresía para demostración y pruebas del
-- Sprint 2. Permite probar la asignación de membresías (US-S2-02) sin depender
-- de que el administrador cree los tipos por la interfaz primero.
-- Idempotente: solo inserta si el nombre no existe ya.

USE gym_db;

INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado)
SELECT * FROM (
  SELECT 'Mensual' AS nombre, 'Acceso por 30 dias' AS descripcion, 30 AS duracion, 500.00 AS precio, 'activo' AS estado
  UNION ALL SELECT 'Trimestral', 'Acceso por 90 dias', 90, 1350.00, 'activo'
  UNION ALL SELECT 'Anual', 'Acceso por 365 dias', 365, 5000.00, 'activo'
) AS nuevos
WHERE NOT EXISTS (
  SELECT 1 FROM tipos_membresia t WHERE t.nombre = nuevos.nombre
);
