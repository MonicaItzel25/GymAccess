-- 003_crear_tablas_sprint2.sql
-- Estructura nueva del Sprint 2: rostros, accesos y auditoria.
-- NO altera ninguna tabla del Sprint 1 (FR-023); solo agrega tablas nuevas.
-- Fuente: specs/002-sprint-2-membresias-pagos-reconocimiento-acceso/data-model.md

USE gym_db;

-- ---------------------------------------------------------------------------
-- Tabla: rostros
-- Almacena el descriptor facial (vector de 128 números) de un cliente.
-- NUNCA almacena imágenes (FR-012). El descriptor NUNCA se devuelve por la API
-- (FR-020). Un solo registro activo por cliente (UNIQUE en id_cliente): la
-- re-registración actualiza en lugar de duplicar (US-S2-06.3).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rostros (
  id_rostro         INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente        INT NOT NULL,
  descriptor_facial JSON NOT NULL,
  fecha_registro    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado            ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  UNIQUE KEY uq_rostros_cliente (id_cliente),
  CONSTRAINT fk_rostros_cliente
    FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tabla: accesos
-- Registra TODOS los intentos de acceso, autorizados o rechazados (FR-018,
-- RN-10, RN-11). Sin eliminación ordinaria. id_cliente es NULL cuando el
-- rostro no fue identificado (FR-017).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accesos (
  id_acceso       INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente      INT NULL,
  fecha           DATE NOT NULL,
  hora            TIME NOT NULL,
  resultado       ENUM('autorizado','rechazado') NOT NULL,
  motivo_rechazo  VARCHAR(100) NULL,
  fecha_intento   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_accesos_fecha (fecha),
  KEY idx_accesos_cliente (id_cliente),
  CONSTRAINT fk_accesos_cliente
    FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tabla: auditoria
-- Registra las acciones del FR-021. id_usuario es NULL para acciones del
-- sistema (intentos de acceso del kiosco, sin usuario autenticado).
-- Sin eliminación ordinaria.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria (
  id_auditoria  INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario    INT NULL,
  accion        VARCHAR(100) NOT NULL,
  modulo        VARCHAR(50) NOT NULL,
  fecha         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resultado     ENUM('exitoso','rechazado','error') NOT NULL,
  descripcion   VARCHAR(255) NULL,
  KEY idx_auditoria_fecha (fecha),
  KEY idx_auditoria_usuario (id_usuario),
  CONSTRAINT fk_auditoria_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
