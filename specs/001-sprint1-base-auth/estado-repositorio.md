# Verificación del estado real del repositorio y de la base de datos

**Función**: 001-sprint1-base-auth | **Fecha**: 2026-10-14
**Alcance de esta acción**: solo inspección de solo lectura. No se creó, modificó ni
eliminó ninguna tabla, archivo de código, migración ni dato. La base de datos no se
reinició y las migraciones ejecutadas permanecen intactas.

## 1. Repositorio de trabajo actual (`C:\Users\moni2\gymAccess`)

Confirmado por inventario completo de archivos: **no contiene código de la
aplicación**. Solo hay documentación (`docs/`, `AGENTS.md`), especificaciones de
Spec Kit (`specs/001-sprint1-base-auth/`, `.specify/`) y comandos
(`.opencode/`). No hay carpetas `frontend/`, `backend/` ni `database/`.

## 2. Código previo identificado (trabajo real del proyecto)

**Ubicación**: `C:\Users\moni2\Documents\gymAccess1`
(hay una copia de seguridad en `C:\Users\moni2\Documents\gymAccess1 - copia`
con los mismos archivos de `database/`).

### Backend (`gymAccess1\backend`)

- `package.json` con `"type": "module"` (ES Modules), scripts
  `start`/`dev`/`test`/`migrar`; dependencias: `express`, `mysql2`, `bcrypt`,
  `jsonwebtoken`, `express-validator`, `dotenv`, `face-api.js`; dev:
  `vitest`, `supertest`, `@vitest/coverage-v8`.
- Estructura: `src/{config,controllers,middlewares,models,routes,services,utils,validators}`
  (patrón MVC por capas), con `app.js` montando todas las rutas bajo `/api`.
- Módulos **ya implementados de Sprint 1**: `auth` (`POST /login`,
  `GET /me`), `usuarios` (listar, obtener, crear, modificar con
  `rol`/`estado`), `clientes` (crear, editar, `GET /mio`, listar, obtener).
- Módulos **ya implementados de Sprint 2** (fuera del alcance de esta función):
  `tipos-membresia`, `membresias` (asignar/renovar/suspender/reactivar/cancelar),
  `pagos`, `adeudos`, `rostro` (captura facial), `acceso` (intento de kiosco),
  `accesos` (consulta), `auditoria` (solo administrador).
- Pruebas: `tests/{unit,integration,contract}` con Vitest + supertest para
  ambos sprints.

### Frontend (`gymAccess1\frontend`)

- React 18 + Vite + `react-router-dom`; Vitest + React Testing Library.
- Páginas existentes: `Login`, `Inicio`, `Usuarios`, `Clientes`, `MiPerfil`,
  `Membresias`, `TiposMembresia`, `Pagos`, `MisPagos`, `Accesos`, `MisAccesos`,
  `PuntoAcceso`, `RegistrarRostro`; contexto `AuthContext`, `Layout`,
  `services/api.js`.
- **El rediseño visual del login NO está hecho**: `Login.jsx` usa una tarjeta
  simple (`.pagina-login` / `.tarjeta`); no existen referencias a la paleta
  `#0a0b0e` / `#0f1117` / `#f05a24`, al split 50/50, ni a
  `prefers-reduced-motion` en `frontend/src`.

### Especificaciones previas

- `gymAccess1\specs\001-sprint-1-base-usuarios-clientes` (con `tasks.md`) y
  `gymAccess1\specs\002-sprint-2-membresias-pagos-reconocimiento-acceso`
  (con `tasks.md`): ambos sprints ya pasaron por Spec Kit allí.

## 3. Base de datos MySQL (inspección de solo lectura)

- Servicio `MySQL2610` (MySQL Server 26.10) en ejecución, `127.0.0.1:3306`.
  Credenciales en `gymAccess1\backend\.env` (`DB_USER=root`, `DB_NAME=gym_db`);
  el secreto no se reproduce en este documento.
- Bases de datos del proyecto: **`gym_db`** (principal) y **`gym_db_pruebas`**
  (misma estructura, usada por las pruebas automatizadas).

### Migraciones registradas en `gym_db.migraciones` (5, ya ejecutadas)

| # | nombre | fecha_ejecucion |
|---|---|---|--
| 1 | 001_crear_base_datos.sql | 2026-10-07 13:25:20 |
| 2 | 002_crear_tablas_sprint1.sql | 2026-10-07 13:25:20 |
| 3 | 001_usuario_admin.sql (semilla) | 2026-10-07 13:25:20 |
| 4 | 003_crear_tablas_sprint2.sql | 2026-10-12 17:08:50 |
| 5 | 002_tipos_membresia_ejemplo.sql (semilla) | 2026-10-12 17:08:50 |

**Ninguna de estas cinco entradas puede editarse ni reejecutarse**; cualquier cambio
futuro debe ser una migración **nueva** con numeración posterior (004+).

### Tablas existentes en `gym_db`

`usuarios` (1 fila: `admin@gimnasio.local`, rol `administrador`, activo),
`clientes`, `tipos_membresia` (datos de ejemplo de la semilla),
`membresias`, `pagos`, `rostros`, `accesos`, `auditoria`, `migraciones`.

### Esquema relevante del Sprint 1 (real, no el del plan)

| Tabla | Columnas observadas |
|---|---|-
| `usuarios` | `id_usuario` PK, `nombre`, `correo` UNI, `password` VARCHAR(255) (hash), `rol` ENUM(4), `estado` ENUM, `fecha_creacion` |
| `clientes` | `id_cliente` PK, `nombre`, `apellido`, `correo` UNI NULL, `telefono`, `direccion`, `fecha_registro`, `estado` |

- **No existe columna ni tabla de vínculo** usuario↔cliente: el enlace se resuelve
  por coincidencia de `correo` (`cliente.service.js`: “Relación usuario↔cliente por
  coincidencia de correo”).
- **No existe tabla de intentos de login**: el bloqueo de 5 intentos/15 minutos se
  lleva en memoria (`auth.service.js`, `Map` por correo normalizado).
- `auditoria` existe, pero **solo los servicios de Sprint 2** (membresías, pagos,
  rostros, accesos) la usan; `usuario.service.js` y `cliente.service.js` no
  registran auditoría.

## 4. Diferencias con el plan y ajustes necesarios (todos ejecutados o resueltos)

> **Actualización 2026-10-15 (T032)**: los ajustes de código A1, A8, A10, A11,
> A12 y A15 quedaron ejecutados durante la implementación del Sprint 1 y
> verificados con los escenarios del `quickstart.md` (T030, ver
> [validacion-manual.md](validacion-manual.md)) y con las suites completas
> (T031: backend 221/221, frontend 10/10). Cada fila indica su commit y su
> evidencia. Las decisiones A5, A6, A7/A9 y A16 ya estaban resueltas el
> 2026-10-14 (sección 6).

| # | Elemento | Plan / spec actual | Estado real | Ajuste necesario |
|---|---|---|---|---|-
| A1 | Supuesto de partida | “Repositorio verde, sin código ni migraciones” (plan.md, D1 de research.md) | Código completo del Sprint 1 (+ Sprint 2) en `Documents\gymAccess1`; 5 migraciones/semillas ejecutadas en `gym_db` | **EJECUTADO 2026-10-15** (T001–T005, commit `1820d3e`): `backend/`, `frontend/` y `database/` consolidados aquí y ejecutor adoptado como `database/migrate.mjs`; verificación: E2 del quickstart (dos corridas sin reaplicar, 5 filas intactas) |
| A2 | Migraciones | Plan proponía crear `001_crear_usuarios.sql` … `004_crear_auditoria.sql` desde cero | `001`–`003` ya ejecutadas y registradas | **No recrear nada**; renumerar cualquier migración nueva desde `004_…` y solo si una decisión lo exige (ver A5, A6) |
| A3 | Estructura del backend | Plan: `src/modules/<entidad>/{routes,controller,service}` | Código: `src/{routes,controllers,services,models}` | Conservar la estructura existente (regla de no reescribir trabajo); corregir el árbol del plan |
| A4 | Nombres de campos | `password_hash`, `apellidos`, `creado_en`, `id` | `password`, `apellido`, `fecha_creacion`, `id_usuario`/`id_cliente` | Actualizar `data-model.md` a los nombres reales; **prohibido renombrar columnas** de tablas ya ejecutadas |
| A5 | Vinculación cuenta–cliente | FR-023: `clienteId` obligatorio al crear cuenta `cliente` | Enlace por coincidencia de `correo` entre `usuarios` y `clientes` | **Resuelta 2026-10-14 (A5 aprobada: opción (a))**: se acepta el enlace por correo; FR-023 ajustado y contratos alineados; un cliente sin `correo` no puede tener cuenta; nuevo ajuste de código **A15** |
| A6 | Bloqueo de login | D5: tabla `intentos_login` persistente | `Map` en memoria, 5 fallos/15 min, clave por correo (cubre correos inexistentes) | **Resuelta 2026-10-14 (A6 aprobada: opción (a))**: se acepta el bloqueo en memoria y se documenta que se pierde al reiniciar el servidor; sin migración |
| A7 | Contrato API | `contracts/api.md`: envelope `{mensaje}`, `GET /api/perfil`, `PATCH .../estado`, `PUT .../rol`, errores 423/405 | Código: envelope `{ ok, data \| message }` (`utils/response.js`), `GET /api/auth/me`, `GET /api/clientes/mio`, cambios de rol/estado vía `PUT /api/usuarios/:id` con un solo campo, 404 catch-all | **Resuelta 2026-10-14 (A7/A9 aprobadas: opción (a))**: `contracts/api.md` y `contracts/permisos.md` reescritos al API existente |
| A8 | Mensaje genérico de login | FR-005: texto exacto `correo o contraseña incorrectos` | Código responde `Credenciales incorrectas` (401) | **EJECUTADO y verificado 2026-10-15**: `auth.service.js` responde el texto exacto (ya consolidado en `1820d3e`); evidencia: A2/A3/A6 de `validacion-manual.md` (401 con mensaje exacto, también para cuenta inactiva) y la prueba de contrato de autenticación (T031) |
| A9 | Código del bloqueo | Contrato: 423 con mensaje único | Código: 409 `Cuenta bloqueada temporalmente por intentos fallidos` | **Resuelta 2026-10-14 junto con A7 (opción (a))**: el contrato documenta el `409` existente; el comportamiento de “mensaje idéntico exista o no el correo” ya se cumple |
| A10 | Último administrador activo | FR-014 / SC-002: prohibido desactivar o degradar al único admin activo | **No implementado** (sin coincidencias en backend) | **EJECUTADO 2026-10-15** (US3, commit `ef32d71`): `aplicarCambioBloqueado` con transacción y `SELECT … FOR UPDATE` en `cambiarEstado`/`cambiarRol`; evidencia: U5 (409 `no se puede modificar al único administrador activo` en estado y rol) y pruebas de contrato (T031) |
| A11 | Auditoría de Sprint 1 | Constitución X.1: registrar cambios de usuarios y clientes | Tabla y ruta `/api/auditoria` existen, pero `usuario.service` y `cliente.service` no llaman a `auditoria.service` | **EJECUTADO 2026-10-15** (US3/US4, commits `ef32d71` y `058d95b`): wrapper `conAuditoria` con acciones `crear/modificar/cambiar_rol/cambiar_estado` de usuarios y `crear/modificar` de clientes; evidencia: U8 (filas con actor, resultado `exitoso`/`rechazado` y sin credenciales) |
| A12 | Rediseño visual del login | FR-027 a FR-033, historia 6, SC-007 | No realizado (login actual sin paleta oscura/naranja) | **EJECUTADO 2026-10-15** (US6, commit `d32de19`): `frontend/src/styles/estilos.css` (split 50/50, paleta `#0a0b0e`/`#0f1117`/`#f05a24`, panel oculto ≤768 px, foco visible, `prefers-reduced-motion`) y `Login.jsx` con panel presentacional; evidencia: 5 pruebas de componente (T031, frontend 10/10) y flujo intacto; **R1–R7 quedan por verificar en navegador de escritorio** |
| A13 | Tablas de Sprint 2 en la BD | Plan (D12): “no crear tablas de membresías/pagos” | Ya existen (`membresias`, `pagos`, `rostros`, `accesos`, `tipos_membresia`) con migración 003 ejecutada | No tocarlas ni implementar lógica nueva sobre ellas; el alcance del Sprint 1 se cumple **no ampliando** esos módulos |
| A14 | Pruebas y seeds | Quickstart proponía seeds nuevos | Ya existen seeds administrador y tipos de ejemplo, y suites de pruebas de ambos sprints | Reutilizar `gym_db_pruebas` y las suites existentes; no duplicar seeds |
| A15 | Vínculo al crear cuenta `cliente` (derivado de A5, aprobada) | FR-023 ajustada exige `correo` coincidente con un `clientes.correo` | `usuario.service.crear` no valida el vínculo | **EJECUTADO 2026-10-15** (US5, commit `64b1e8f`): `crear` exige `modeloCliente.obtenerPorCorreo`; evidencia: C4 (400 `el correo no coincide con ningún cliente registrado`, con la unicidad de correo respondiendo antes) y pruebas de contrato (T031) |
| A16 | Permisos del entrenador (detectado al alinear los contratos) | Spec FR-017: entrenador "No" en "Consultar clientes operativos" | El código permite `GET /api/clientes` y `GET /api/clientes/:id` al entrenador con campos básicos (`id_cliente`, `nombre`, `apellido`, `telefono`, `estado`) | **Resuelta 2026-10-14 (A16 aprobada: opción (a))**: la matriz FR-017 del spec ya quedó ajustada a "Solo datos básicos"; los contratos documentan el comportamiento real |

## 5. Resumen de pendientes (manteniendo el alcance del Sprint 1)

> **Actualización 2026-10-15**: los puntos 1 y 2 quedaron **ejecutados** durante
> la implementación del Sprint 1 (ver sección 4).

1. ~~**Consolidación de código**~~ **EJECUTADA 2026-10-15** (A1, T001–T005,
   commit `1820d3e`): `backend/`, `frontend/` y `database/` consolidados aquí y
   ejecutor renombrado a `database/migrate.mjs`.
2. ~~**Ajustes de código del Sprint 1**~~ **EJECUTADOS 2026-10-15**: A8
   (`1820d3e`), A10 y A11 de usuarios (`ef32d71`), A11 de clientes (`058d95b`),
   A15 (`64b1e8f`) y A12 (`d32de19`).
3. **Decisión A16 resuelta** (sección 7): la consulta básica de clientes del
   entrenador quedó reconocida en la matriz FR-017 del spec.
4. **Documentos alineados el 2026-10-14**: `plan.md`, `research.md`
   (D1/D5/D7/D8/D12/D15 con notas de revisión), `data-model.md`,
   `quickstart.md`, `contracts/api.md` y `contracts/permisos.md` (reescritos al
   API existente), y el `spec.md` (FR-023 ajustado por A5 y matriz FR-017
   ajustada por A16).

## 6. Decisiones resueltas (aprobadas por el usuario el 2026-10-14)

Las cuatro decisiones abiertas quedaron **aprobadas con la opción recomendada**
el 2026-10-14. Esta sección conserva las opciones estudiadas y registra lo
aprobado; la ejecución se reparte entre esta ronda documental (contratos,
especificación y plan ya alineados) y las tareas del Sprint 1 pendientes de
`/speckit.tasks` (consolidación de archivos, A8, A10, A11, A12, A15).

### 6.1 — A1: ubicación del código — **APROBADO: (a) consolidar aquí**

- **Opción recomendada (a) [APROBADA y EJECUTADA 2026-10-15]**: consolidar
  `Documents\gymAccess1` en este workspace (`C:\Users\moni2\gymAccess`) como base
  única de trabajo — copiar `backend/`, `frontend/` y `database/` aquí sin
  eliminar el original, y adoptar el ejecutor como `database/migrate.mjs`
  (renombrado descrito en D8 de [research.md](research.md), sin cambiar su
  comportamiento ni las 5 filas registradas). **Hecho en T001–T005** (commit
  `1820d3e`); verificado con E2 del quickstart (dos corridas sin reaplicar).
- **Opción (b) [descartada]**: mantener el código en `Documents\gymAccess1`.

### 6.2 — A5: vinculación cuenta (`usuarios`) ↔ cliente (`clientes`) — **APROBADO: (a) enlace por correo**

- **Opción recomendada (a) [APROBADA]**: aceptar el enlace existente por
  coincidencia de `correo`; `contracts/api.md` y `contracts/permisos.md` ya
  quedaron alineados y el **FR-023 del spec ya fue ajustado** (2026-10-14) para
  exigir un `clientes.correo` coincidente al crear cuenta `cliente`. **Nuevo
  ajuste de código A15** registrado abajo: validar el vínculo en
  `usuario.service.crear` (sin migración).
- **Opción (b) [descartada]**: migración nueva `004_…` con `clientes.id_usuario`
  (INT NULL, UNIQUE, FK) y migración de datos por correo.

### 6.3 — A6: persistencia del bloqueo de login — **APROBADO: (a) en memoria**

- **Opción recomendada (a) [APROBADA]**: aceptar el bloqueo **en memoria** (Map
  en `auth.service.js`) documentando que los contadores se pierden al reiniciar
  el servidor (supuesto: una sola computadora e instancia única). La limitación
  ya quedó escrita en `contracts/api.md` y en D5 de `research.md`.
- **Opción (b) [descartada]**: migración nueva `004_…` con tabla persistente de
  intentos.

### 6.4 — A7/A9: alineación del contrato API — **APROBADO: (a) contrato al API existente**

- **Opción recomendada (a) [APROBADA]**: **reescribir `contracts/api.md` al API
  existente** (envelope `{ ok, data | message }`, `GET /api/auth/me`,
  `GET /api/clientes/mio`, cambios de `rol`/`estado` por `PUT /api/usuarios/:id`,
  bloqueo en `409`, sin `405`). **Ejecutado el 2026-10-14**: `api.md` y
  `permisos.md` ya describen el comportamiento real verificado.
- **Opción (b) [descartada]**: refactorizar el código hacia el contrato anterior
  (`GET /api/perfil`, `PATCH`/`PUT` separados, `423`), por añadir trabajo fuera
  del alcance mínimo y poder romper el frontend existente.

> **Relación con A8/A9 (estado tras la aprobación)**: con la opción 6.4(a)
> aprobada y ejecutada, el bloqueo ya quedó descrito como `409` en el contrato y
> el ajuste de código **A8, que siguió siendo obligatorio, quedó ejecutado y
> verificado el 2026-10-15** (el texto exacto `correo o contraseña incorrectos`
> viaja desde la consolidación `1820d3e`; evidencia en A2/A3/A6 de
> `validacion-manual.md`); no se requiere cambiar el código a `423`.

## 7. Diferencia adicional detectada — **RESUELTA (aprobada 2026-10-14)**

### A16 — Entrenador y consulta de clientes

**Detección (2026-10-14)**: al alinear `contracts/api.md` y
`contracts/permisos.md` con el backend verificado, se observó que la matriz del
spec **FR-017** marcaba al entrenador como sin permiso de "Consultar clientes
operativos", pero el código sí le permite `GET /api/clientes` y
`GET /api/clientes/:id` **con un recorte estricto de campos** (`id_cliente`,
`nombre`, `apellido`, `telefono`, `estado`; nada de correo, dirección ni
historial).

- **Opción recomendada (a) [APROBADA y ejecutada el 2026-10-14]**: la matriz
  FR-017 del spec ya quedó ajustada con "Solo datos básicos" para el entrenador
  y con la nota de la decisión; los contratos ya documentaban el comportamiento
  real.
- **Opción (b) [descartada]**: restringir el código a `403` para el entrenador.
