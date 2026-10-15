-- 001_usuario_admin.sql
-- Usuario administrador inicial del sistema.
-- Contraseña: GymAdmin2026 (almacenada con hash bcrypt, nunca en texto plano)
-- Cambiarla tras el primer inicio de sesión en un entorno real.

USE gym_db;

INSERT INTO usuarios (nombre, correo, password, rol, estado)
SELECT 'Administrador', 'admin@gimnasio.local',
       '$2b$10$HfG18d965Uc7i3RJFowbN.TG06S3fcBvOTR4REwvGwCOEjCIpW1N6',
       'administrador', 'activo'
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios WHERE correo = 'admin@gimnasio.local'
);
