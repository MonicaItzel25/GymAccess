# Contrato de permisos y autorización — Sprint 1

**Función**: 001-sprint1-base-auth | **Fecha**: 2026-10-14

Fuente normativa: spec `FR-016`, `FR-017` y matriz del Sprint 1; constitución
sección V. **Alineado al backend existente verificado el 2026-10-14** (misma
decisión A7/A9 que [api.md](api.md)): los middlewares reales son
`middlewares/auth.js` (JWT) y `middlewares/authorize.js` (`autorizar(...)`). La
autorización se calcula en el servidor a partir de la sesión validada; la
interfaz solo oculta opciones como ayuda visual.

## Matriz de operaciones (comportamiento real del backend)

| Operación | Administrador | Recepcionista | Entrenador | Cliente |
|---|---|---|---|---|
| Iniciar/cerrar sesión | Sí | Sí | Sí | Sí |
| Gestionar usuarios y roles (listar, crear, modificar, asignar rol) | Sí | No | No | No |
| Activar/desactivar usuarios | Sí | No | No | No |
| Registrar y modificar clientes | Sí | Sí | No | No |
| Consultar clientes (listado/detalle) | Sí (completo) | Sí (completo) | **Solo datos básicos** (A16, aprobada 2026-10-14) | No |
| Consultar perfil propio | `GET /api/auth/me` | `GET /api/auth/me` | `GET /api/auth/me` | `GET /api/clientes/mio` |
| Modificar perfil propio | No | No | No | No |

- **Datos básicos del entrenador**: `id_cliente`, `nombre`, `apellido`,
  `telefono`, `estado` (el código aplica este recorte en
  `GET /api/clientes` y `GET /api/clientes/:id`).
- **A16 resuelta (2026-10-14)**: la matriz FR-017 del spec ya quedó ajustada a
  "Solo datos básicos" para el entrenador; este contrato documenta el
  comportamiento real del servidor.

## Reglas de aplicación en servidor

1. **R1 — Origen del rol**: el rol y el usuario se toman únicamente del token
   verificado (`req.usuario` poblado desde el payload del JWT); cualquier `rol`,
   `estado` o identificador de propietario enviado en el cuerpo o la URL se
   ignora salvo operación autorizada y validada explícitamente.
2. **R2 — Denegación uniforme**: operación sin permiso →
   `403 {"ok":false,"message":"No tienes permisos para realizar esta operación"}`,
   con la misma respuesta exista o no el recurso cuando revelarlo sería
   filtración (p. ej. un cliente consultando ids ajenos recibe `403`/`404` sin
   datos de terceros).
3. **R3 — Sesión**: sin token válido o vencido → `401` (`Autenticación
   requerida`, `Sesión expirada` o `Token inválido`). El middleware actual no
   reconsulta la fila del usuario en cada petición; la vigencia de la cuenta
   depende de la expiración del token (8 h) — comportamiento documentado en
   [api.md](api.md).
4. **R4 — Último administrador activo** (FR-014, **ajuste pendiente A10**): en
   `PUT /api/usuarios/:id` con el único campo `estado` (`inactivo`) o `rol`
   (distinto de `administrador`) se DEBE verificar en transacción que no
   resulten cero administradores activos; si se violaría → `409`. Hoy no está
   implementado; su implementación es tarea del Sprint 1.
5. **R5 — Confined del cliente**: el cliente con cuenta accede a su ficha solo
   por `GET /api/clientes/mio` (sin identificador en la URL: el vínculo se
   resuelve por su `correo`); nunca recorre recursos de otros clientes, y no
   existe `GET /api/perfil`.
6. **R6 — Vínculo cliente–cuenta** (FR-023 ajustada por A5): crear una cuenta
   con `rol: "cliente"` exige un `correo` que coincida con el de un cliente
   existente; no existe `clienteId`. **Ajuste pendiente A15**: la validación
   aún no está en el código (`usuario.service.crear`).
7. **R7 — Ocultación no es control**: la navegación visible por rol en el
   frontend no sustituye a R1–R6; cada endpoint aplica su propia verificación.

## Mapeo a middlewares reales (referencia para tasks)

| Endpoint | Verificación |
|---|---|
| `POST /api/auth/login` | Público; reglas de validación y bloqueo en memoria |
| `GET /api/auth/me` | `autenticar` + R3 |
| Rutas `GET/POST/PUT /api/usuarios*` | `autenticar` + `autorizar('administrador')`; R4 pendiente (A10) en mutaciones |
| `POST/PUT /api/clientes` | `autenticar` + `autorizar('administrador','recepcionista')` |
| `GET /api/clientes` y `GET /api/clientes/:id` | `autenticar` + `autorizar('administrador','recepcionista','entrenador')`; recorte básico para entrenador |
| `GET /api/clientes/mio` | `autenticar` + `autorizar('cliente')` + R5/R6 |
| Rutas desconocidas o `DELETE` | `404 {"ok":false,"message":"Recurso no encontrado"}` (no hay 405) |
| Endpoints de Sprint 2 montados | Fuera del alcance de este Sprint 1: no se modifican (A13) |

## Casos de prueba de referencia

- Recepcionista `GET /api/usuarios` → 403 con mensaje uniforme.
- Entrenador `POST /api/clientes` → 403.
- Entrenador `GET /api/clientes` → 200 con solo `id_cliente`, `nombre`,
  `apellido`, `telefono`, `estado` por registro (A16).
- Cliente `GET /api/clientes/2` → 403 o 404 sin datos de terceros.
- Cliente `GET /api/clientes/mio` con correo sin ficha asociada →
  404 `No existe un cliente asociado a esta cuenta`.
- Cliente con token alterado enviando `rol: administrador` → el rol de la
  sesión prevalece y la operación se deniega con 403.
- Único administrador activo: `PUT /api/usuarios/:id` con `{"estado":"inactivo"}`
  o `{"rol":"recepcionista"}` → `409` en ambos (**requiere A10**).
