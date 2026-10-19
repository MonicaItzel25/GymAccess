-- 007_crear_tablas_sprint3.sql
-- Sprint 3: 7 tablas nuevas del módulo de entrenamiento y del dashboard.
-- Fuente: specs/003-sprint-3-entrenadores-rutinas-dashboard/data-model.md §1–§6
--
-- NOTA DE ENTORNO (patrón de 004–006): esta migración NO incluye `USE gym_db;`
-- a propósito. El destino lo decide la base seleccionada por
-- `database/migrate.mjs` (`gym_db_pruebas` cuando se inyecta `backend/.env.test`
-- con `node --env-file=.env.test ../database/migrate.mjs` desde `backend/`).
-- Las migraciones 001–003 sí llevan `USE gym_db;` y NO se modifican (FR-037).
--
-- Convenciones (data-model §0): InnoDB, utf8mb4_unicode_ci, PK `id_<entidad>`,
-- FK `ON DELETE RESTRICT ON UPDATE CASCADE` (sin borrados físicos, FR-036) y
-- `KEY idx_*` para las consultas frecuentes (constitución III).
--
-- Unicidad de «asignación vigente» y «rutina activa» (research R-03): las
-- columnas generadas `esta_vigente` y `esta_activa` valen 1 solo cuando la fila
-- está vigente/activa y NULL en caso contrario; como MySQL considera distintos
-- los valores NULL dentro de un índice único, el UNIQUE permite muchas filas
-- finalizadas/inactivas pero SOLO UNA vigente/activa por cliente, incluso ante
-- concurrencia. Mismo criterio semántico documentado en la migración 006.

-- ---------------------------------------------------------------------------
-- Tabla: entrenadores
-- Perfil profesional en exclusiva a una cuenta con rol `entrenador` (FR-001,
-- RN-002). El nombre completo NO se duplica: procede de `usuarios.nombre`.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entrenadores (
  id_entrenador   INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario      INT NOT NULL,
  especialidad    VARCHAR(150) NULL,
  telefono        VARCHAR(20) NULL,
  estado          ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  fecha_creacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_entrenadores_usuario (id_usuario),
  CONSTRAINT fk_entrenadores_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tabla: asignaciones_entrenador
-- Relación entrenador–cliente por periodo de seguimiento (US-S3-02). Un cliente
-- puede tener varias en el historial, como máximo una vigente (FR-006, RN-003).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asignaciones_entrenador (
  id_asignacion   INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente      INT NOT NULL,
  id_entrenador   INT NOT NULL,
  fecha_inicio    DATE NOT NULL,
  fecha_fin       DATE NULL,
  estado          ENUM('vigente','finalizada') NOT NULL DEFAULT 'vigente',
  esta_vigente    INT AS (CASE WHEN estado = 'vigente' AND fecha_fin IS NULL
                               THEN 1 ELSE NULL END) STORED,
  fecha_creacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_asignaciones_entrenador (id_entrenador),
  KEY idx_asignaciones_cliente (id_cliente),
  KEY idx_asignaciones_inicio (fecha_inicio),
  UNIQUE KEY uq_asignaciones_vigente (id_cliente, esta_vigente),
  CONSTRAINT fk_asignaciones_cliente
    FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_asignaciones_entrenador
    FOREIGN KEY (id_entrenador) REFERENCES entrenadores (id_entrenador)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tabla: ejercicios
-- Catálogo independiente y reutilizable por múltiples rutinas (US-S3-08,
-- FR-010). Nombre único para evitar duplicados en el catálogo compartido.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ejercicios (
  id_ejercicio    INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL,
  descripcion     VARCHAR(255) NOT NULL,
  grupo_muscular  VARCHAR(50) NULL,
  estado          ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  fecha_creacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ejercicios_nombre (nombre)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tabla: rutinas
-- Plan de entrenamiento con historial de versiones y una única versión activa
-- por cliente (FR-015, Clarification Q5). `id_entrenador` conserva la autoría
-- histórica aunque el cliente sea reasignado (Clarification Q1).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rutinas (
  id_rutina           INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente          INT NOT NULL,
  id_entrenador       INT NOT NULL,
  nombre              VARCHAR(100) NOT NULL,
  estado              ENUM('activa','inactiva') NOT NULL DEFAULT 'inactiva',
  fecha_creacion      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME NULL,
  esta_activa         INT AS (CASE WHEN estado = 'activa' THEN 1 ELSE NULL END) STORED,
  fecha_activacion    DATETIME NULL,
  KEY idx_rutinas_cliente_estado (id_cliente, estado),
  KEY idx_rutinas_entrenador (id_entrenador),
  UNIQUE KEY uq_rutinas_activa (id_cliente, esta_activa),
  CONSTRAINT fk_rutinas_cliente
    FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_rutinas_entrenador
    FOREIGN KEY (id_entrenador) REFERENCES entrenadores (id_entrenador)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tabla: ejercicio_rutina
-- Aparición concreta de un ejercicio del catálogo dentro de una rutina, con
-- sus parámetros (FR-016, RN-007). La PK surrogate permite apariciones
-- repetidas del mismo ejercicio dentro de una rutina.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ejercicio_rutina (
  id_rutina_ejercicio  INT AUTO_INCREMENT PRIMARY KEY,
  id_rutina            INT NOT NULL,
  id_ejercicio         INT NOT NULL,
  orden                SMALLINT NOT NULL,
  series               INT NOT NULL,
  repeticiones         INT NOT NULL,
  peso_recomendado     DECIMAL(6,2) NULL,
  descanso_segundos    INT NULL,
  instrucciones        TEXT NULL,
  KEY idx_rutina_ejercicios_rutina (id_rutina),
  KEY idx_rutina_ejercicios_ejercicio (id_ejercicio),
  CONSTRAINT fk_rutina_ejercicios_rutina
    FOREIGN KEY (id_rutina) REFERENCES rutinas (id_rutina)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_rutina_ejercicios_ejercicio
    FOREIGN KEY (id_ejercicio) REFERENCES ejercicios (id_ejercicio)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tabla: objetivos
-- Meta deportiva de un cliente registrada por el entrenador (US-S3-04, FR-019).
-- Se registran por cliente, no por rutina. Sin borrado físico (RN-009).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS objetivos (
  id_objetivo     INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente      INT NOT NULL,
  meta            VARCHAR(255) NOT NULL,
  unidad          VARCHAR(30) NULL,
  fecha_objetivo  DATE NOT NULL,
  estado          ENUM('activo','alcanzado','cerrado') NOT NULL DEFAULT 'activo',
  fecha_registro  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre    DATETIME NULL,
  KEY idx_objetivos_cliente (id_cliente),
  KEY idx_objetivos_estado (estado),
  CONSTRAINT fk_objetivos_cliente
    FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tabla: progresos
-- Entrada periódica de evolución del cliente (US-S3-04, FR-020). Historial
-- completo sin modificaciones destructivas (FR-021, RN-009). `id_objetivo` es
-- opcional (supuesto del spec).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS progresos (
  id_progreso      INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente       INT NOT NULL,
  id_objetivo      INT NULL,
  fecha            DATE NOT NULL,
  valor_numerico   DECIMAL(8,2) NULL,
  avance           VARCHAR(150) NULL,
  comentario       VARCHAR(255) NULL,
  fecha_registro   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_progresos_cliente_fecha (id_cliente, fecha),
  KEY idx_progresos_fecha (fecha),
  KEY idx_progresos_objetivo (id_objetivo),
  CONSTRAINT fk_progresos_cliente
    FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_progresos_objetivo
    FOREIGN KEY (id_objetivo) REFERENCES objetivos (id_objetivo)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
