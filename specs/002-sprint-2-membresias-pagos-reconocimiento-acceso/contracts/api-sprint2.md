# Contratos de interfaz — Sprint 2

Fecha: 2026-10-18. Contratos REST del Sprint 2 según `spec.md` y `data-model.md`.
Convención existente conservada: respuestas envueltas en `{ ok: boolean, message?: string, data: any }`,
autenticación `Authorization: Bearer <JWT>`, errores 400 (validación), 401 (sin
sesión), 403 (permiso), 404 (recurso inexistente), 409 (conflicto). El backend es la
única autoridad (constitución, principio II). Este documento describe interfaces; no
incluye implementación.

## 1. Endpoints nuevos

### 1.1 `POST /api/acceso/manual` — autorización manual de ingreso (FR-030, RN-017)

- **Autenticación**: requerida. **Permisos**: `administrador`, `recepcionista` (403
  para `entrenador` y `cliente`; matriz de permisos).
- **Petición** (`Content-Type: application/json`):

  ```json
  {
    "id_cliente": 12,
    "resultado": "autorizado",
    "motivo": null
  }
  ```

  | Campo | Tipo | Obligatorio | Reglas |
  |---|---|---|---|
  | `id_cliente` | entero > 0 | Sí | Debe existir en `clientes` (404 si no) |
  | `resultado` | `"autorizado"` \| `"rechazado"` | Sí | Catálogo fijo |
  | `motivo` | cadena ≤ 100 | Condicional | Obligatorio cuando `resultado="rechazado"`; opcional (null) cuando se autoriza |

- **Comportamiento del servidor** (no se confía en el cliente):
  1. Valida campos (400 con mensajes comprensibles).
  2. Verifica que el cliente exista (404).
  3. Si `resultado="autorizado"`, evalúa la membresía vigente con las MISMAS reglas
     del kiosco (fechas + estado). Si no está vigente → **409** con mensaje claro
     («La membresía no está vigente; no se autoriza el ingreso») y NO se crea registro
     autorizado.
  4. Inserta en `accesos` con `origen='manual'`, `id_usuario` = usuario de la sesión,
     `fecha`/`hora` actuales, `resultado` y `motivo` cuando aplique.
  5. Registra auditoría (acción de autorización manual, actor = usuario, resultado).
     Un fallo de auditoría no interrumpe la operación (FR-040).
- **Respuesta 201**:

  ```json
  {
    "ok": true,
    "message": "Acceso registrado",
    "data": {
      "id_acceso": 456,
      "id_cliente": 12,
      "resultado": "autorizado",
      "motivo_rechazo": null,
      "origen": "manual",
      "id_usuario": 2,
      "fecha": "2026-10-18",
      "hora": "10:15:00"
    }
  }
  ```

- **Garantías**: no se acepta `id_usuario`, `origen` ni biométricos del cliente; el
  registro nunca contiene datos biométricos (SC-011).

### 1.2 `POST /api/pagos` con `id_operacion` (FR-017) — cambio compatible

- Nuevo campo opcional en la petición: `"id_operacion": "cobro-2026-10-18-001"`
  (cadena ≤ 100).
- Si ya existe un pago con el mismo `(id_cliente, id_operacion)` → **409**:
  `{ "ok": false, "message": "Ya existe un pago registrado con ese id_operacion para este cliente" }`.
- Sin `id_operacion` el comportamiento es el actual (no regresión).

## 2. Endpoints existentes con cambios de respuesta (aditivos)

Todos los cambios son **aditivos**: no rompen contratos ya probados; los campos
nuevos se agregan a `data`.

### 2.1 `membresias` — `precio_acordado` (FR-005, FR-007, FR-011, FR-018)

- `POST /api/membresias` (asignar), `PUT /api/membresias/:id/renovar`,
  `GET /api/membresias` y `GET /api/membresias/:id`: cada objeto de membresía
  incluye ahora `"precio_acordado": "850.00"`.
- El precio acordado lo calcula el servidor desde el tipo vigente al momento de la
  operación; NO se acepta del cliente (400 si se envía el campo en la petición).

### 2.2 `adeudos` — cálculo sobre precio acordado (FR-018)

- `GET /api/adeudos` y `GET /api/adeudos/mio`: la
  estructura no cambia; el campo `adeudo` se calcula ahora como
  `max(0, precio_acordado − pagos válidos)` y queda inmutable ante cambios del
  catálogo.

### 2.3 `accesos` — origen y responsable (FR-034, SC-002)

- `GET /api/accesos` (con filtros `desde`, `hasta`, `cliente`) y `GET /api/accesos/mio`:
  cada registro incluye ahora `"origen": "kiosco" | "manual"` y
  `"id_usuario": null | <id>` (+ `usuario_nombre` para mostrarlo en el historial,
  sin exponer más datos del usuario).
- Permisos sin cambios: historial general admin/recepcionista/entrenador (E3);
  propio: cualquier rol autenticado sobre sus registros.

### 2.4 `POST /api/acceso/intento` — kiosco (FR-030) — sin cambios de contrato

- Sigue sin autenticación (E2), recibe solo `descriptor_facial` (128 números) y
  responde como hasta ahora. La rama de rostro no identificado responde con
  `motivo: "rostro no identificado"`; el mensaje «No se pudo identificar su rostro,
  acuda a recepción» lo muestra la interfaz del kiosco (FR-030), la cual NO expone
  ninguna operación de autorización propia.

## 3. Dashboard y estadísticas (US-S2-10, FR-042)

- La pantalla de inicio consume **endpoints existentes** según el rol (sin endpoints
  nuevos en este sprint):
  - `administrador`: `GET /api/clientes`, `GET /api/adeudos` (global), `GET /api/accesos`.
  - `recepcionista`: `GET /api/clientes`, `GET /api/accesos`, `GET /api/pagos`.
  - `entrenador`: `GET /api/membresias`, `GET /api/accesos` (E3).
  - `cliente`: `GET /api/pagos/mio`, `GET /api/accesos/mio`, `GET /api/adeudos/mio`
    (la consulta de membresías del cliente queda fuera de este sprint: excepción E4
    del spec).
- Las tarjetas muestran únicamente datos reales devueltos por la API; nada de datos
  ficticios presentados como reales (FR-042, constitución § Diseño visual, punto 10).

## 4. Fuera de contratos de este sprint

Reportes consolidados avanzados y su configuración (Sprint 3); asignación de
entrenadores a clientes (Sprint 3); pasarelas de pago; registro de salidas.
