-- 002_crear_tablas_sprint1.sql
-- Estructura del Sprint 1: usuarios y clientes funcionales; tipos_membresia,
-- membresias y pagos como estructura inicial sin funcionalidad.
-- NO se crean rostros, accesos ni auditoria (pertenecen al Sprint 2).

USE gym_db;

-- ---------------------------------------------------------------------------
-- Tabla: usuarios
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario     INT AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL,
  correo         VARCHAR(150) NOT NULL,
  password       VARCHAR(255) NOT NULL,
  rol            ENUM('administrador','recepcionista','entrenador','cliente')
                   NOT NULL DEFAULT 'cliente',
  estado         ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_usuarios_correo (correo)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tabla: clientes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
  id_cliente      INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL,
  apellido        VARCHAR(100) NOT NULL,
  correo          VARCHAR(150) NULL,
  telefono        VARCHAR(20) NULL,
  direccion       VARCHAR(200) NULL,
  fecha_registro  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado          ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  UNIQUE KEY uq_clientes_correo (correo)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tabla: tipos_membresia (estructura inicial, funcionalidad en Sprint 2)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tipos_membresia (
  id_tipo_membresia INT AUTO_INCREMENT PRIMARY KEY,
  nombre             VARCHAR(100) NOT NULL,
  descripcion        VARCHAR(255) NULL,
  duracion           INT NOT NULL,
  precio             DECIMAL(10,2) NOT NULL,
  estado             ENUM('activo','inactivo') NOT NULL DEFAULT 'activo'
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tabla: membresias (estructura inicial, funcionalidad en Sprint 2)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS membresias (
  id_membresia       INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente         INT NOT NULL,
  id_tipo_membresia  INT NOT NULL,
  fecha_inicio       DATE NOT NULL,
  fecha_fin          DATE NOT NULL,
  estado             ENUM('activa','vencida','suspendida','cancelada')
                       NOT NULL DEFAULT 'activa',
  CONSTRAINT fk_membresias_cliente
    FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_membresias_tipo
    FOREIGN KEY (id_tipo_membresia) REFERENCES tipos_membresia (id_tipo_membresia)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tabla: pagos (estructura inicial, funcionalidad en Sprint 2)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pagos (
  id_pago       INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente    INT NOT NULL,
  id_membresia  INT NOT NULL,
  monto         DECIMAL(10,2) NOT NULL,
  fecha_pago    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metodo_pago   VARCHAR(50) NOT NULL,
  estado        ENUM('pagado','pendiente','cancelado') NOT NULL DEFAULT 'pagado',
  CONSTRAINT fk_pagos_cliente
    FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_pagos_membresia
    FOREIGN KEY (id_membresia) REFERENCES membresias (id_membresia)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tabla: migraciones (control de scripts aplicados por el script ejecutor)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS migraciones (
  id_migracion    INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(255) NOT NULL,
  fecha_ejecucion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_migraciones_nombre (nombre)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
