# Contratos de API: Sprint 3 — Entrenadores, rutinas, catálogo de ejercicios y dashboard administrativo

**Fecha**: 2026-10-19 | **Plan**: [plan.md](./plan.md) | **Espec**: [spec.md](./spec.md) | **Modelo de datos**: [data-model.md](./data-model.md)

Contratos REST/JSON de los endpoints nuevos y del endpoint existente ampliado. Patrón común a todos (research R-07):

- **Autenticación**: cabecera `Authorization: Bearer <JWT>` (8 h) en todos los endpoints salvo indicación.
- **Éxito**: `{ "ok": true, "data": … }` (`utils/response.js`). **Error**: `{ "ok": false, "message": "…" }` en español, sin detalles internos.
- **Códigos**: `200` consulta, `201` creación, `400` validación de campos o regla de negocio, `401` sin sesión, `403` rol o relación sin permiso (matriz de permisos), `404` recurso inexistente, `500` error controlado.
- **Autorización**: `autenticar` + `autorizar(...roles)` y, cuando se indica, validación de la relación (asignación vigente o ficha propia) en servidor (FR-032, research R-02). La interfaz solo oculta opciones.
- Las rutas sin método definido no existen: ninguna operación `DELETE` sobre estas entidades (FR-036, SC-004) y ninguna operación de escritura sobre auditoría (FR-031).

## 1. Entrenadores — `/api/entrenadores`

| Método y ruta | Roles permitidos | Descripción |
|---|---|---|
| `GET /api/entrenadores` | `administrador`, `recepcionista` | Lista perfiles con nombre (desde la cuenta), especialidad, estado y carga de clientes asignados vigentes (US-S3-07.1, FR-008) |
| `GET /api/entrenadores/:id` | `administrador`, `recepcionista` | Detalle de un entrenador; `404` si no existe |
| `POST /api/entrenadores` | `administrador` | Crea el perfil vinculado a una cuenta existente (FR-001) |
| `PUT /api/entrenadores/:id` | `administrador` | Modifica `especialidad` y `telefono` (FR-002) |
| `PUT /api/entrenadores/:id/estado` | `administrador` | Cambia `estado` a `activo` o `inactivo` (FR-002) |

**`POST /api/entrenadores`**

- Cuerpo: `{ "id_usuario": 12, "especialidad": "Fuerza y acondicionamiento", "telefono": "555-1234" }` (`especialidad` y `telefono` opcionales).
- Validaciones: `id_usuario` entero > 0 (400); cuenta existe (404); `rol = 'entrenador'` (400: «La cuenta debe tener el rol entrenador»); sin perfil previo (400: «La cuenta ya tiene un perfil de entrenador»).
- `201` → `data: { id_entrenador, id_usuario, nombre, especialidad, telefono, estado }`.
- Auditoría: `accion = 'crear entrenador'`, `modulo = 'entrenadores'`, `resultado = 'exitoso' | 'rechazado'` (FR-004).

**`PUT /api/entrenadores/:id/estado`** — cuerpo `{ "estado": "inactivo" }`; con `inactivo` no recibe nuevas asignaciones ni escribe en módulos de entrenamiento (FR-003). Auditoría obligatoria (FR-004).

## 2. Asignaciones — `/api/asignaciones`

| Método y ruta | Roles permitidos | Descripción |
|---|---|---|
| `GET /api/asignaciones?entrenador=:id&vigentes=true` | `administrador`, `recepcionista`, `entrenador` | Consulta asignaciones; con `vigentes=true` solo las vigentes (FR-008). El entrenador autenticado solo recibe las suyas (ignora cualquier `entrenador` distinto del suyo y nunca expone asignaciones de terceros; sin parámetro `vigentes`, recibe solo las suyas vigentes y con `vigentes=false` también su histórico finalizado, siempre solo suyo, matriz: «Solo sus asignados»); la respuesta incluye el nombre del cliente para poblar listados |
| `POST /api/asignaciones` | `administrador`, `recepcionista` | Asigna un entrenador a un cliente (FR-005) |
| `PUT /api/asignaciones/:id/finalizar` | `administrador`, `recepcionista` | Finaliza una asignación vigente (FR-007) |

**`POST /api/asignaciones`**

- Cuerpo: `{ "id_cliente": 5, "id_entrenador": 3, "fecha_inicio": "2026-10-19" }` (`fecha_inicio` opcional; por defecto hoy).
- Validaciones: cliente existe (404) y `estado = 'activo'` (400); entrenador registrado y `activo` (404/400); sin asignación vigente previa del cliente (400: «El cliente ya tiene un entrenador asignado vigente», FR-006 — reforzado por índice único, data-model §2).
- `201` → `data: { id_asignacion, id_cliente, id_entrenador, fecha_inicio, fecha_fin: null, estado: "vigente" }`.
- Auditoría: `accion = 'asignar entrenador'`, `modulo = 'asignaciones'` (FR-009).

**`PUT /api/asignaciones/:id/finalizar`**

- Cuerpo opcional: `{ "fecha_fin": "2026-10-31" }` (por defecto hoy).
- Validaciones: existe (404); `estado = 'vigente'` (400: «La asignación ya está finalizada»).
- `200` → `data` con `estado: "finalizada"` y `fecha_fin`. Efecto: el entrenador deja de gestionar al cliente, pero las rutinas activas del cliente permanecen para el próximo entrenador (Clarification Q1, FR-017).
- Auditoría: `accion = 'finalizar asignacion'` (FR-009).

## 3. Catálogo de ejercicios — `/api/ejercicios`

| Método y ruta | Roles permitidos | Descripción |
|---|---|---|
| `GET /api/ejercicios?estado=activo\|inactivo\|todos` | `administrador`, `entrenador` | Lista el catálogo; el entrenador solo recibe `activo` (FR-012); por defecto `activo` |
| `POST /api/ejercicios` | `administrador` | Crea un ejercicio (FR-011) |
| `PUT /api/ejercicios/:id` | `administrador` | Modifica `nombre`, `descripcion`, `grupo_muscular` (FR-011) |
| `PUT /api/ejercicios/:id/estado` | `administrador` | Activa o desactiva (FR-011) |

**`POST /api/ejercicios`**

- Cuerpo: `{ "nombre": "Press de banca", "descripcion": "Empuje horizontal con barra", "grupo_muscular": "Pecho" }` (`grupo_muscular` opcional).
- Validaciones: `nombre` y `descripcion` no vacíos (400); `nombre` único (400: «Ya existe un ejercicio con ese nombre»).
- `201` → `data: { id_ejercicio, nombre, descripcion, grupo_muscular, estado: "activo" }`.
- Auditoría: `accion = 'crear ejercicio'`, `modulo = 'ejercicios'` (FR-013).
- **Denegaciones**: `recepcionista` y `cliente` → 403 en escritura (US-S3-08.4); `entrenador` en escritura → 403 (US-S3-08.5, Clarification Q2).

**Efecto de desactivación** (RN-008): el ejercicio `inactivo` no puede agregarse a rutinas nuevas (400 en `POST /api/rutinas`), pero las rutinas existentes lo conservan intactos.

## 4. Rutinas — `/api/rutinas` (entrenador)

| Método y ruta | Roles permitidos | Descripción |
|---|---|---|
| `GET /api/rutinas?cliente=:id` | `entrenador` | Lista rutinas de sus clientes asignados vigentemente (incluye las creadas por otro entrenador, FR-017); con `cliente=:id` filtra |
| `GET /api/rutinas/:id` | `entrenador` | Detalle con ejercicios y parámetros; exige asignación vigente con el cliente de la rutina (403 si no) |
| `POST /api/rutinas` | `entrenador` | Crea una rutina con sus ejercicios (FR-014, FR-016) |
| `PUT /api/rutinas/:id` | `entrenador` | Modifica nombre y/o lista de ejercicios (FR-017) |
| `PATCH /api/rutinas/:id/estado` | `entrenador` | Activa o desactiva la rutina (FR-015, Clarification Q5) |

**`POST /api/rutinas`**

- Cuerpo:
  ```json
  {
    "id_cliente": 5,
    "nombre": "Semana 1 - Empuje",
    "ejercicios": [
      { "id_ejercicio": 1, "orden": 1, "series": 4, "repeticiones": 8,
        "peso_recomendado": 60, "descanso_segundos": 90,
        "instrucciones": "Bajar controlado hasta el pecho" }
    ]
  }
  ```
- Validaciones: asignación vigente del entrenador con `id_cliente` (403: «No tienes una asignación vigente con este cliente»); `nombre` no vacío (400); `ejercicios` con al menos una fila (400); cada `id_ejercicio` existe (404) y está `activo` (400: «El ejercicio está desactivado y no puede agregarse a rutinas nuevas»); `series`/`repeticiones` ≥ 1 (400); `peso_recomendado` ≥ 0 (400); `descanso_segundos` ≥ 0 (400); `instrucciones` no vacío si se envía (400).
- `201` → `data: { id_rutina, id_cliente, id_entrenador, nombre, estado, fecha_creacion, ejercicios: [...] }`.
- Auditoría: `accion = 'crear rutina'`, `modulo = 'rutinas'` (FR-018).

**`PATCH /api/rutinas/:id/estado`**

- Cuerpo: `{ "estado": "activa" }`.
- Validaciones: asignación vigente (403); al activar, la rutina activa anterior del cliente pasa a `inactiva` en la misma transacción (una sola activa por cliente, UNIQUE, data-model §4.1).
- `200` → `data` con el nuevo estado.

**Denegaciones**: `recepcionista` y `cliente` → 403 en todas las operaciones de este recurso (US-S3-03.5, matriz de permisos); sin `DELETE` (FR-017).

## 5. Objetivos — `/api/objetivos`

| Método y ruta | Roles permitidos | Descripción |
|---|---|---|
| `GET /api/objetivos?cliente=:id` | `entrenador` | Objetivos de sus clientes asignados vigentes (RN-005); `403` si el cliente no está asignado |
| `POST /api/objetivos` | `entrenador` | Registra un objetivo (FR-019) |
| `PUT /api/objetivos/:id` | `entrenador` | Modifica `meta`, `unidad`, `fecha_objetivo` si `estado = 'activo'` (400 si está cerrado) |
| `PATCH /api/objetivos/:id/estado` | `entrenador` | Cierra o marca alcanzado: `{ "estado": "alcanzado" \| "cerrado" }` (rellena `fecha_cierre`) |

**`POST /api/objetivos`**

- Cuerpo: `{ "id_cliente": 5, "meta": "Bajar a 85 kg", "unidad": "kg", "fecha_objetivo": "2026-12-31" }` (`unidad` opcional).
- Validaciones: asignación vigente (403); `meta` no vacía (400); `fecha_objetivo` válida (400).
- `201` → `data: { id_objetivo, id_cliente, meta, unidad, fecha_objetivo, estado: "activo", fecha_registro }`.
- Auditoría: `accion = 'crear objetivo'`, `modulo = 'objetivos'` (FR-022).

**Denegaciones**: `recepcionista` y `cliente` → 403 (US-S3-04.5); `administrador` → 403 en detalle individual (Clarification Q4: solo agregados).

## 6. Progresos — `/api/progresos`

| Método y ruta | Roles permitidos | Descripción |
|---|---|---|
| `GET /api/progresos?cliente=:id&desde=&hasta=` | `entrenador` | Entradas de sus clientes asignados vigentes, ordenadas por fecha ascendente |
| `POST /api/progresos` | `entrenador` | Registra una entrada (FR-020) |

**`POST /api/progresos`**

- Cuerpo: `{ "id_cliente": 5, "id_objetivo": 2, "fecha": "2026-10-19", "valor_numerico": 87.4, "avance": null, "comentario": "Buena sesión" }` (`id_objetivo` y `comentario` opcionales).
- Validaciones: asignación vigente (403); al menos uno entre `valor_numerico` y `avance` (400: «Indica un valor o un avance medido»); si `id_objetivo` se envía, existe (404) y pertenece al mismo cliente (400); `valor_numerico` ≥ 0 (400).
- `201` → `data: { id_progreso, id_cliente, id_objetivo, fecha, valor_numerico, avance, comentario, fecha_registro }`.
- Auditoría: `accion = 'registrar progreso'`, `modulo = 'progresos'` (FR-022).
- **Denegaciones**: `recepcionista` y `cliente` → 403 (US-S3-04.5). Las entradas no se borran ni se sobrescriben (FR-021).

## 7. Mi entrenamiento (cliente) — `/api/mi-entrenamiento`

Recurso de solo consulta del cliente sobre SUS datos, resolviendo la ficha por `correo` de la sesión (RN-006, FR-023).

| Método y ruta | Roles permitidos | Descripción |
|---|---|---|
| `GET /api/mi-entrenamiento/rutina` | `cliente` | Su rutina activa con ejercicios y parámetros; sin rutina activa → `200 { ok: true, data: null }` (FR-024) |
| `GET /api/mi-entrenamiento/objetivos` | `cliente` | Su historial de objetivos; sin registros → `data: []` |
| `GET /api/mi-entrenamiento/progresos` | `cliente` | Sus entradas de progreso ordenadas en el tiempo; sin registros → `data: []` |

- Cuentas sin ficha vinculada → `404` con mensaje genérico.
- Ningún parámetro permite consultar a otro cliente: cualquier parámetro de identificación de cliente (`cliente`, `id_cliente`, `id`) se rechaza con `403` (US-S3-05.4, hace observable la denegación sin exponer datos).
- **Denegaciones**: cualquier otro rol → 403.

## 8. Dashboard — `/api/dashboard`

| Método y ruta | Roles permitidos | Descripción |
|---|---|---|
| `GET /api/dashboard?desde=YYYY-MM-DD&hasta=YYYY-MM-DD` | `administrador` | Indicadores consolidados del periodo (FR-025); sin parámetros: mes en curso (supuesto) |

- Validación: `desde <= hasta` y fechas bien formadas (400: «El periodo de fechas es inválido», FR-026, US-S3-06.3).
- `200` → `data` con grupos (nombres usados también por la interfaz):
  ```json
  {
    "periodo": { "desde": "2026-10-01", "hasta": "2026-10-31" },
    "clientes": { "totales": 0, "activos": 0, "nuevos": 0 },
    "membresias": { "vigentes": 0, "porVencer": 0, "vencidas": 0 },
    "pagos": { "cantidad": 0, "ingresos": 0, "adeudosPendientes": 0 },
    "accesos": { "intentos": 0, "autorizados": 0, "rechazados": 0 },
    "entrenamiento": {
      "entrenadoresActivos": 0, "rutinasActivas": 0,
      "clientesSinRutinaActiva": 0, "objetivosActivos": 0,
      "progresosEnPeriodo": 0, "cargaPorEntrenador": [
        { "id_entrenador": 0, "nombre": "", "clientes": 0 }
      ]
    }
  }
  ```
- Sin datos en el periodo → todos los conteos en `0` (US-S3-06.4; nunca valores ficticios, SC-006).
- **Denegaciones**: cualquier rol distinto de `administrador` → 403 en el servidor (US-S3-06.5).
- `porVencer` = `fecha_fin` dentro de los próximos 7 días (Clarification Q3, FR-025).

## 9. Auditoría — `/api/auditoria` (existente, ampliado con filtros)

| Método y ruta | Roles permitidos | Descripción |
|---|---|---|
| `GET /api/auditoria?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&modulo=&actor=` | `administrador` | Registros de auditoría filtrados; filtros opcionales (FR-030) |

- Comportamiento existente conservado: sin parámetros, responde la lista completa como hasta ahora (compatibilidad con las pruebas del Sprint 2).
- Filtros: `desde`/`hasta` (rango sobre `fecha`), `modulo` o entidad (coincidencia), `actor` (id o nombre de usuario cuando aplique). `desde > hasta` → 400.
- `200` → `data: [{ id_auditoria, actor, accion, modulo, fecha, resultado, descripcion }]`.
- Mapeo de «entidad» (FR-004, RN-010, SC-005): `modulo` es la entidad afectada (nombre técnico del módulo: `asignaciones`, `rutinas`, `objetivos`, `progresos`, `entrenadores`, `ejercicios`, `dashboard`, `auditoria`); el detalle de la entidad concreta (p. ej. el id del recurso) viaja en `descripcion`.
- **Solo lectura**: no existe ningún `POST`, `PUT` ni `DELETE` en este recurso (FR-031, SC-007).
- **Denegaciones**: cualquier rol distinto de `administrador` → 403 (US-S3-09.4).

## 10. Matriz de denegaciones verificable

Cada fila es una prueba automatizada esperada (SC-002):

| Recurso | recepcionista | entrenador | cliente | administrador |
|---|---|---|---|---|
| `POST/PUT /api/entrenadores` | 403 | 403 | 403 | permitido |
| `POST /api/asignaciones`, `PUT …/finalizar` | permitido | 403 | 403 | permitido |
| `POST/PUT /api/ejercicios` | 403 | 403 | 403 | permitido |
| `GET /api/ejercicios` | 403 | permitido (solo activos) | 403 | permitido |
| `POST/PUT/PATCH /api/rutinas` | 403 | con asignación vigente; si no, 403 | 403 | 403 |
| `POST/PUT/PATCH /api/objetivos`, `POST /api/progresos` | 403 | con asignación vigente; si no, 403 | 403 | 403 |
| `GET /api/mi-entrenamiento/*` | 403 | 403 | permitido (solo lo propio) | 403 |
| `GET /api/dashboard` | 403 | 403 | 403 | permitido |
| `GET /api/auditoria` | 403 | 403 | 403 | permitido |
