# Contrato API REST — Sprint 1

**Función**: 001-sprint1-base-auth | **Fecha**: 2026-10-14

Contrato de la interfaz que el backend expone al frontend, **alineado al código
existente verificado** el 2026-10-14 (decisión A7/A9 aprobada: se documenta el
comportamiento real; no se refactoriza código hacia el contrato anterior). Todo el
tráfico vive bajo `/api` y usa JSON; la autorización se resuelve siempre en el
servidor ([permisos.md](permisos.md)); ninguna respuesta incluye `password`,
contraseñas ni datos internos.

## Convenciones

- **Envoltura de respuesta** (`backend/src/utils/response.js`):
  - Éxito: `{ "ok": true, "data": <payload> }` (`200`, o `201` en creaciones).
  - Error: `{ "ok": false, "message": "<texto en español sin detalles internos>" }`.
- **Autenticación**: cabecera `Authorization: Bearer <token>` con JWT vigente
  (expiración por defecto 8 horas, `JWT_EXPIRACION_HORAS`). Sin cabecera o mal
  formada → `401 {"ok":false,"message":"Autenticación requerida"}`; token vencido
  → `401 ... "Sesión expirada"`; token ilegible/firmado por otro secreto →
  `401 ... "Token inválido"`.
- **Autorización**: rol no permitido → `403 {"ok":false,"message":"No tienes
  permisos para realizar esta operación"}`.
- **Validación** (`express-validator`): `400` con el **primer** mensaje en
  español de las reglas violadas (sin listado de campos).
- **404 global**: cualquier ruta o método no montado (incluido `DELETE` sobre
  usuarios/clientes) → `404 {"ok":false,"message":"Recurso no encontrado"}`.
  **No existe manejo de `405`** en el backend.
- **500**: `{"ok":false,"message":"Error interno del servidor"}`; el detalle solo
  se registra en el log del servidor.
- **Nombres**: los campos de respuesta usan `snake_case` real de la base
  (`id_usuario`, `id_cliente`, `fecha_registro`, `fecha_creacion`).
- **Correos**: se recortan espacios extremos; la unicidad y la comparación son
  insensibles a mayúsculas por la colación `utf8mb4_unicode_ci`.
- No existe endpoint de logout: el cierre de sesión es eliminación del token en
  el cliente (D10 de [research.md](research.md)).

## Autenticación

### `POST /api/auth/login` — público

Entrada: `{ "correo": "  Ana.Garcia@Gimnasio.mx ", "password": "Secreta123" }`.

| Escenario | Código | Salida |
|---|---|---|
| Credenciales correctas y cuenta activa | 200 | `{"ok":true,"data":{"token":"<jwt>","usuario":{"id_usuario":1,"nombre":"Ana García","correo":"ana.garcia@gimnasio.mx","rol":"administrador"}}}` |
| Credenciales incorrectas (correo inexistente o contraseña errónea) | 401 | `{"ok":false,"message":"correo o contraseña incorrectos"}` — idéntico en ambos casos (FR-005) |
| Cuenta `inactivo` con contraseña correcta | 401 | Mismo mensaje genérico de la fila anterior: se niega sin revelar el estado |
| 5 fallos consecutivos con el mismo correo (cuenta exista o no) | 409 | `{"ok":false,"message":"Cuenta bloqueada temporalmente por intentos fallidos"}` |
| Campos faltantes o formato inválido | 400 | `{"ok":false,"message":"<primer mensaje de validación>"}` |

Notas:

- El payload del JWT contiene únicamente `id_usuario`, `nombre`, `correo`, `rol`
  y `exp`; nunca la contraseña.
- El bloqueo se evalúa **antes** de comparar contraseñas; un intento durante el
  bloqueo se rechaza aunque la contraseña sea correcta, y su mensaje no revela si
  el correo existe.
- **Bloqueo en memoria** (decisión A6 aprobada): los contadores viven en el
  proceso del backend y **se pierden al reiniciar el servidor**; válido por el
  supuesto de una sola computadora e instancia única.
- **Ajuste pendiente A8**: hoy el código responde `Credenciales incorrectas`
  (401); el texto exigido por el spec es `correo o contraseña incorrectos` y su
  adopción queda como tarea del Sprint 1.

### `GET /api/auth/me` — cualquier rol autenticado

- `200` con `data` = datos de la sesión: `{ "id_usuario": 1, "nombre": "Ana
  García", "correo": "ana.garcia@gimnasio.mx", "rol": "administrador" }`
  (proviene del token, sin consulta a la base; no incluye `estado`).
- `401` con cualquiera de los mensajes de autenticación de arriba.
- **No existe `GET /api/perfil`**: el perfil propio del personal es este
  endpoint; el de un cliente con cuenta es `GET /api/clientes/mio`.

## Usuarios — solo rol `administrador`

| Método y ruta | Propósito | Éxito |
|---|---|---|
| `GET /api/usuarios` | Listado (sin datos de credenciales) | 200 `{"ok":true,"data":[{...}]}` |
| `GET /api/usuarios/:id` | Detalle de un usuario | 200 · 404 `"Usuario no encontrado"` |
| `POST /api/usuarios` | Crear usuario | 201 `{"ok":true,"data":{...}}` |
| `PUT /api/usuarios/:id` | Modificar según los campos enviados (ver abajo) | 200 |

Reglas del contrato:

- `POST /api/usuarios`: campos `nombre`, `correo`, `password`, `rol`
  obligatorios; `estado` opcional (default `activo`). La contraseña se guarda
  **solo como hash bcrypt** y jamás se devuelve (SC-003).
- `PUT /api/usuarios/:id` **despacha por los campos del cuerpo**: si el único
  campo es `rol` → cambio de rol; si el único campo es `estado` → activación o
  desactivación; cualquier otro conjunto de campos → modificación de
  `nombre`/`correo`/`password`.
- Correo duplicado tras la unicidad → `409 {"ok":false,"message":"El correo ya
  está registrado"}` (también en modificación).
- `rol` fuera de los cuatro valores → `400` (validación).
- **Ajuste pendiente A10**: degradar o desactivar al único administrador activo
  DEBE responder `409` con mensaje de último administrador activo (FR-014); hoy
  no está implementado y su implementación es tarea del Sprint 1.
- **Sin borrado físico**: no hay ruta `DELETE`; cualquier intento → `404`
  catch-all y los registros permanecen.
- **Ajuste pendiente A11**: los cambios de aquí deben registrarse en
  `auditoria` (actor, acción, fecha, resultado), sin credenciales.

## Clientes — escritura: `administrador` y `recepcionista`; consulta: + `entrenador`

| Método y ruta | Propósito | Éxito |
|---|---|---|
| `GET /api/clientes?buscar=<texto>` | Listado/búsqueda | 200; el `entrenador` solo recibe `id_cliente`, `nombre`, `apellido`, `telefono`, `estado` (consulta básica, decisión A16 aprobada 2026-10-14, ver [permisos.md](permisos.md)) |
| `GET /api/clientes/:id` | Detalle | 200 (con el mismo recorte para `entrenador`) · 404 `"Cliente no encontrado"` |
| `POST /api/clientes` | Registrar cliente | 201 |
| `PUT /api/clientes/:id` | Modificar datos personales | 200 · 404 · 409 |
| `GET /api/clientes/mio` | Ficha propia del cliente autenticado (rol `cliente`) | 200 · 404 `"No existe un cliente asociado a esta cuenta"` |

Reglas del contrato:

- Cuerpo de creación: `nombre` y `apellido` obligatorios; `correo`, `telefono`,
  `direccion` y `estado` opcionales (`correo` puede ser `NULL`; si se envía, es
  único → `409` con el mismo mensaje de duplicado que usuarios).
- Respuesta de cliente: `id_cliente`, `nombre`, `apellido`, `correo`,
  `telefono`, `direccion`, `fecha_registro`, `estado`.
- `GET /api/clientes/mio` resuelve el vínculo **por coincidencia de correo**
  entre `usuarios.correo` y `clientes.correo` (decisión A5 aprobada): no existe
  `clienteId` ni columna FK. Un cliente sin `correo` no puede tener cuenta.
- No hay operación de borrado (mismo tratamiento `404` que usuarios).
- **Ajuste pendiente A11**: altas y modificaciones de clientes también deben
  escribir en `auditoria`.

## Vínculo cuenta `cliente` ↔ ficha de cliente (FR-023 ajustada por A5)

- Al crear una cuenta con `rol: "cliente"` en `POST /api/usuarios`, el `correo`
  enviado **debe coincidir con el `correo` de un cliente existente**; en caso
  contrario → `400`. Un cliente no puede tener dos cuentas (el `correo` ya es
  único en `usuarios`).
- **Ajuste pendiente A15**: esta validación aún no existe en el código
  (`usuario.service.crear` no verifica el vínculo); su implementación es tarea
  del Sprint 1, sin migración.

## Matriz de permisos

Ver [permisos.md](permisos.md) para la matriz completa; este contrato asume en
cada endpoint las autorizaciones declaradas allí y ejecutadas por el middleware
`autorizar(...)`.

## Fuerza fuera de contrato

- Los endpoints de Sprint 2 ya montados en el backend (`/api/membresias`,
  `/api/tipos-membresia`, `/api/pagos`, `/api/adeudos`, `/api/acceso`,
  `/api/accesos`, `/api/auditoria`, `/api/clientes/:id/rostro`) quedan **fuera
  del alcance de este Sprint 1**: este contrato no los describe, no se modifican
  y la función no implementa lógica nueva sobre ellos (ajuste A13).
- No existen endpoints de registro público ni de recuperación de contraseña.
- Los campos `rol` o `estado` enviados por un usuario sin permiso de
  administrador no llegan a la lógica de negocio: el middleware responde `403`
  (la sesión validada manda, nunca la interfaz).
