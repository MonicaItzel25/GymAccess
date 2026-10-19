# Quickstart de validación: Sprint 3 — Entrenadores, rutinas, catálogo de ejercicios y dashboard administrativo

**Fecha**: 2026-10-19 | **Plan**: [plan.md](./plan.md) | **Contratos**: [contracts/api.md](./contracts/api.md) | **Modelo**: [data-model.md](./data-model.md)

Guía de ejecución y comprobación extremo a extremo. No contiene código de implementación: los detalles de esquema y respuestas están en los documentos enlazados.

## 1. Prerrequisitos

- MySQL 5.7+ o 8.x activo en `127.0.0.1:3306` (credenciales de `backend/.env.test`).
- Node.js 20+ con `npm install` ejecutado en `backend/` y `frontend/`.
- Archivo `backend/.env.test` apuntando a **`gym_db_pruebas`** (nunca `gym_db`).
- Rama `003-sprint-3-entrenadores-rutinas-dashboard` activa.

## 2. Preparación del entorno de pruebas

Desde `backend/`:

```powershell
# 1) Aplicar la migración del sprint SOLO en gym_db_pruebas (.env.test gana prioridad sobre backend/.env)
node --env-file=.env.test ../database/migrate.mjs
# Salida esperada: "+ Aplicado: 007_crear_tablas_sprint3.sql" (y "= Omitido (ya aplicado)" para 001–006 y semillas)

# 2) Re-siembrar datos operativos de prueba
node --env-file=.env.test validate-sprint2.mjs
```

**Advertencias**:

- Ejecutar `npm run migrar` SIN `.env.test` conecta con `backend/.env` → `gym_db` de producción. **Prohibido en este sprint** (FR-037).
- Verificación de no afectación: en `gym_db`, la tabla `migraciones` NO debe contener `007_crear_tablas_sprint3.sql` ni ninguna fila nueva.

## 3. Arranque

```powershell
# Terminal 1 — backend (puerto 3001)
cd backend
node --env-file=.env.test src/server.js

# Terminal 2 — frontend
cd frontend
npm run dev
```

Abrir la URL de Vite (usualmente `http://localhost:5173`).

## 4. Validación automatizada

```powershell
cd backend && npm test    # Vitest + supertest con .env.test
cd frontend && npm test   # Vitest + Testing Library
```

**Esperado**: 100% de las suites nuevas (éxito, validación, permisos por rol, denegaciones — FR-038) y 100% de las suites existentes de los Sprints 1 y 2, sin regresiones (SC-008, SC-010).

**Importante**: `npm test` vacía `gym_db_pruebas`. Tras cada ejecución, volver al paso 2 (`validate-sprint2.mjs`) antes de la validación manual. Si `007` figura como aplicada en `migraciones`, no hace falta repetir el migrador.

## 5. Comprobación rápida de permisos por API (SC-002)

Obtener un token por rol con `POST /api/auth/login` (contraseña `Prueba1234`):

| Correo de prueba | Rol |
|---|---|
| `admin-validacion@prueba.com` | administrador |
| `recep-validacion@prueba.com` | recepcionista |
| `entrenador-validacion@prueba.com` | entrenador |
| `cliente-a@prueba.com` | cliente |

Con cada token, comprobar la matriz de la sección 10 de [contracts/api.md](contracts/api.md). Ejemplos mínimos esperados:

- `POST /api/entrenadores` con token de recepcionista → `403 { ok: false, message: … }`.
- `POST /api/ejercicios` con token de entrenador → `403`.
- `GET /api/dashboard` con token de recepcionista → `403`.
- `GET /api/auditoria` con token de entrenador → `403`.
- `POST /api/rutinas` con token de entrenador SIN asignación vigente → `403` (relación), con asignación vigente → `201`.
- `GET /api/mi-entrenamiento/rutina` con token de administrador → `403`.
- `PUT /api/asignaciones/:id/finalizar` sobre una asignación ya finalizada → `400`.

## 6. Recorrido manual completo (SC-001: menos de 15 minutos)

| # | Paso (rol) | Resultado esperado |
|---|---|---|
| 1 | Administrador → **Entrenadores**: crear perfil desde la cuenta existente con rol `entrenador` | Perfil guardado y listado (US-S3-01.1); intento con cuenta de otro rol → rechazo con mensaje (US-S3-01.2) |
| 2 | Administrador/Recepción → **Asignaciones**: asignar un cliente activo a ese entrenador | Asignación `vigente` con fecha de inicio (US-S3-02.1); segunda asignación del mismo cliente → rechazo (US-S3-02.2, SC-003) |
| 3 | Entrenador → **Ejercicios**: consultar el catálogo; intentar crear uno | Solo lectura completa de activos (US-S3-08.2); intento de escritura → 403 (US-S3-08.5) |
| 4 | Administrador → **Ejercicios**: crear ejercicio y desactivarlo después | Crea y lista; al desactivarlo desaparece del uso en rutinas nuevas, pero una rutina existente que lo use lo conserva (US-S3-08.3, RN-008) |
| 5 | Entrenador → **Rutinas**: crear rutina con ejercicios del catálogo y activarla | Rutina guardada con parámetros y estado `activa` (US-S3-03.1); un ejercicio inactivo en rutina nueva → rechazo (US-S3-03.3) |
| 6 | Entrenador → **Objetivos y progreso**: registrar objetivo con meta/fecha y una entrada de progreso | Ambos en el historial (US-S3-04.1–2); entradas anteriores intactas (US-S3-04.4) |
| 7 | Cliente → **Mi rutina** / **Mi progreso** | Ve su rutina activa con ejercicios/parámetros y su evolución (US-S3-05.1–2); sin rutina → estado vacío sin errores (US-S3-05.3) |
| 8 | Cliente → intentar consultar datos de otro cliente (parámetro ajeno o endpoint con id distinto) | 403 en servidor, sin datos de terceros (US-S3-05.4) |
| 9 | Administrador → **Dashboard** | Indicadores reales del periodo (US-S3-06.1); cambiar periodo recalcula (US-S3-06.2); fechas invertidas → validación (US-S3-06.3); período vacío → ceros, sin datos ficticios (US-S3-06.4) |
| 10 | Administrador → **Auditoría** | Registros con actor/acción/entidad/fecha/resultado (US-S3-09.1); filtros acotan la lista (US-S3-09.2); cero controles de edición/borrado (US-S3-09.3, SC-007); estado vacío sin error si no hay coincidencias (US-S3-09.5) |
| 11 | Administrador/Recepción → **Personal asignado** | Cada entrenador con su cantidad de clientes y lista de asignados; entrenador sin asignados con carga 0 (US-S3-07.1–2) |
| 12 | Administrador → **Asignaciones**: finalizar la asignación y reasignar a otro entrenador | Historial conserva ambas, solo la nueva vigente; el nuevo entrenador consulta y continúa las rutinas activas del cliente (Clarification Q1, FR-017) |
| 13 | Entrenador → crear una segunda rutina y activarla | La anterior pasa a inactiva automáticamente; solo una activa por cliente (Clarification Q5, SC-003) |

## 7. Verificaciones transversales

- **Auditoría (SC-005)**: tras los pasos 1–6 y 12–13, en la pantalla de auditoría aparecen las acciones con actor, acción, fecha/hora, entidad y resultado; no hay contraseñas, tokens ni datos biométricos (RN-010).
- **Sin borrados físicos (SC-004)**: desactivar/finalizar/cerrar y comprobar que el historial sigue consultable; ninguna operación expone `DELETE`.
- **Dashboard coherente (SC-006)**: los totales coinciden con los registros existentes al momento de la consulta para el periodo filtrado (verificar «clientes activos» contra membresías vigentes por fechas).
- **Regresiones (SC-010)**: login, usuarios, clientes, membresías, pagos, reconocimiento facial, kiosco y autorización manual operan igual que al cierre del Sprint 2.
- **Responsividad (SC-009)**: recorrer las pantallas nuevas en escritorio y a 768 px sin desbordamiento horizontal; con `prefers-reduced-motion` activo no hay animaciones continuas.
- **E3 intacta (FR-039)**: la consulta del historial general de accesos del entrenador conserva el comportamiento del Sprint 2; no se añade ninguna restricción nueva.

## 8. Solución de problemas

| Síntoma | Causa probable | Acción |
|---|---|---|
| `Unknown column …` al usar la API | Falta la migración 007 en `gym_db_pruebas` | Ejecutar el paso 2.1 (con `.env.test`) |
| Tablas vacías tras ejecutar pruebas | `npm test` vació la BD de pruebas | Re-ejecutar `validate-sprint2.mjs` (paso 2.2) |
| La API responde con tablas antiguas o errores de columnas de 004–006 | Se arrancó el backend con `backend/.env` (producción) | Usar siempre `node --env-file=.env.test src/server.js` |
| `007` aparece en `gym_db.migraciones` | Se ejecutó el migrador sin `.env.test` | **Detenerse y escalar**: `gym_db` no debe operarse en este sprint (FR-037) |
