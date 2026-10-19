# Validación manual — Sprint 1 (`001-sprint1-base-auth`)

Registro de los escenarios manuales del `quickstart.md` ejecutados contra la pila
real en ejecución (backend `127.0.0.1:3001` **sin `--watch`**, base **`gym_db_pruebas`**
con `DB_NAME` fijada en el entorno del proceso; `gym_db` intacta). Fecha de esta
tanda: **2026-10-15** (T030).

> **Metodología**: los escenarios de API se ejecutaron reproduciendo exactamente
> las llamadas que haría un cliente HTTP (scripts temporales de Node 20 con
> `fetch`, no versionados) contra la pila real, verificando códigos y mensajes
> exactos. El backend se arrancó sin `--watch` porque los reinicios automáticos
> interferían con las secuencias (bloqueo por intentos).
>
> **Limitación de entorno**: el navegador de escritorio no está conectado a esta
> sesión; los escenarios de UI (R1–R7 y la parte visual de A9) se ejecutarán al
> conectarse. A9 se verificó replayando las llamadas de la interfaz
> (`POST /api/auth/login`, `GET /api/auth/me` con/sin `Authorization`) más la
> verificación automatizada del lado del cliente (`frontend/src/services/api.test.js`
> y `AuthContext`).

## Autenticación (SC-001, SC-004, SC-005)

| # | Estado | Evidencia |
|---|--------|-----------|--
| A1 | **PASA** | `POST /api/auth/login` con `admin@manual.com` → 200 con token JWT y usuario activo. |
| A2 | **PASA** | Contraseña incorrecta → 401 con mensaje exacto `correo o contraseña incorrectos` (ajuste A8 verificado). |
| A3 | **PASA** | Correo inexistente → 401 con el mismo mensaje que A2 (sin revelar existencia). |
| A4 | **PASA** | Cuenta existente dedicada (`a4-bloqueo@prueba.com`): fallo previo equivalente a A2 y cinco repeticiones con el mismo correo — fallos 1–5 → 401 con mensaje genérico (el quinto **activa** el bloqueo, FR-004 y escenario 4 del spec), **quinta repetición → 409** `Cuenta bloqueada temporalmente por intentos fallidos` e intento inmediato posterior **con la contraseña correcta → 409**. Variante A4b con correo inexistente (`fantasma-bloqueo2@prueba.com`): comportamiento idéntico → el bloqueo no revela si la cuenta existe. |
| A5 | **PENDIENTE** | Requiere la espera de 15 minutos (el bloqueo usa `Date.now()` en memoria; no hay reloj de prueba). `a4-bloqueo@prueba.com` quedó bloqueado a las ~14:32 de 2026-10-15; se reintentará con credenciales válidas al cierre de esta tanda y se actualizará esta fila. |
| A6 | **PASA** | Cuenta `inactivo` con contraseña correcta → 401 con el mismo mensaje genérico (se niega sin revelar el estado). |
| A7 | **PASA** | `  ADMIN@MANUAL.COM  ` (espacios y mayúsculas) → 200: la normalización funciona. |
| A8 | **PASA** | Token firmado con el secreto real y expiración `-1h` → 401 en `GET /api/auth/me`; se exige autenticación de nuevo. |
| A9 | **PASA** | Ver tabla detallada más abajo (parte backend/UI replayada; el clicado visual queda para el navegador). |

### A9 — Cerrar sesión y navegar a una ruta privada

| Paso | Acción | Resultado esperado | Resultado |
|------|--------|--------------------|-----------|--
| 1 | `POST /api/auth/login` con cuenta activa | 200 con token | ✓ 200, token emitido |
| 2 | `GET /api/auth/me` con `Authorization` | 200, datos del usuario | ✓ 200 (`sesion@prueba.com`) |
| 3 | Cierre de sesión: `cerrarSesionLocal()` elimina `token` y `usuario` | sin datos locales | ✓ verificado en `AuthContext`/`api.js` (T013) y `api.test.js` (T014) |
| 4 | Navegar a ruta privada: la app valida con `GET /api/auth/me` **sin** cabecera | se exige iniciar sesión | ✓ 401 `Autenticación requerida` → `RutaProtegida` redirige a `/login` |
| 5 | Sin rastros del usuario anterior | `localStorage` limpio | ✓ sin claves `token`/`usuario`; la petición sale sin `Authorization` (prueba automatizada) |

## Usuarios y permisos (SC-002, SC-003, SC-005)

| # | Estado | Evidencia |
|---|--------|-----------|-
| U1 | **PASA** | El administrador creó un usuario por cada rol → 201 en recepcionista, entrenador, cliente (con ficha previa) y administrador; los cuatro correos aparecen en `GET /api/usuarios`. |
| U2 | **PASA** | Listado y detalle inspeccionados: ni la clave `password` ni subcadenas `$2b$` en ninguna respuesta. |
| U3 | **PASA** | Duplicado con variación de mayúsculas y espacios (`  ENTRENADOR-NUEVO@PRUEBA.COM  `) → 409 `El correo ya está registrado` (unicidad case-insensitive). |
| U4 | **PASA** | Rol `superusuario` → 400 y el registro no existe en la base (verificado por SQL). |
| U5 | **PASA** | Desactivar (`estado: inactivo`) y degradar (`rol: entrenador`) al único administrador activo → 409 `no se puede modificar al único administrador activo` en ambos casos. |
| U6 | **PASA** | Recepcionista autenticado → 403 en `GET`, `POST` y `PUT /api/usuarios`. |
| U7 | **PASA** | `DELETE /api/usuarios/999999` y `DELETE /api/clientes/:id` → 404 (la ruta no existe); los registros permanecen (sin borrado físico). |
| U8 | **PASA** | Tabla `auditoria`: 7 filas de `modulo='usuarios'` con actor (`id_usuario`), `accion`, `modulo`, `fecha`, `resultado` y `descripcion`; incluye filas `rechazado` (U5/U3); ninguna contiene hashes ni contraseñas (ajuste A11 verificado). |

## Clientes y perfil (SC-002, SC-005)

| # | Estado | Evidencia |
|---|--------|-----------|-
| C1 | **PASA** | Administrador registra cliente → 201; recepcionista lo modifica → 200 con el teléfono persistido. |
| C2 | **PASA** | Entrenador (`POST`) y cliente (`PUT`) → 403. |
| C3 | **PASA** | Correo de cliente ya existente → 409 por unicidad. |
| C4 | **PASA** | Cuenta `rol: cliente` sin ficha coincidente → 400 `el correo no coincide con ningún cliente registrado` (ajuste A15/FR-023 verificado). |
| C5 | **PASA** | `GET /api/clientes/mio` → 200 con exactamente los 8 campos propios (`id_cliente`, `nombre`, `apellido`, `correo`, `telefono`, `direccion`, `fecha_registro`, `estado`); el personal usa `GET /api/auth/me` → 200; `GET /api/perfil` → 404 (no existe). |
| C6 | **PASA** | Cliente autenticado consulta a otro cliente por id → 403 sin datos de terceros. |
| C7 | **PASA** | Registro de cliente `inactivo` con cuenta `activa` → login 200 y `GET /api/clientes/mio` 200 con `estado: inactivo` (regla Sprint 1). |
| C8 | **PASA** | Cliente sin cuenta → 401 `correo o contraseña incorrectos`; su registro sigue visible para el personal autorizado (`GET /api/clientes` del recepcionista lo incluye). |

## Rediseño visual del login (SC-007) — pendiente de navegador

Los escenarios **R1–R7** requieren el navegador de escritorio de la sesión, que
sigue **desconectado**. Pasos para ejecutarlos al conectar (frontend en
`localhost:5173`, login en `/login`):

| # | Qué verificar a mano |
|---|----------------------|-
| R1 | En escritorio (≥1024 px): split 50/50, paleta `#0a0b0e` / `#0f1117` / `#f05a24`, panel con marca, título, tarjeta demostrativa y puntos indicadores. |
| R2 | Reducir la ventana a ≤768 px: el panel de presentación se oculta, el formulario queda centrado y no hay desbordamiento horizontal desde 320 px. |
| R3 | Alternar el control «mostrar/ocultar contraseña»: visibilidad alterna sin perder el valor. |
| R4 | Recorrer el formulario solo con teclado: foco visible en orden lógico y envío posible. |
| R5 | Activar «reducir movimiento» del sistema: animaciones desactivadas/reducidas; ningún error oculto por animación. |
| R6 | Login antes/después del rediseño: flujo idéntico (mismos campos, validaciones, llamadas, mensajes y manejo de sesión, FR-033). |
| R7 | La tarjeta «Acceso autorizado» del panel izquierdo es solo demostrativa, nunca un resultado real. |

## Alcance (SC-008)

| # | Estado | Evidencia |
|---|--------|-----------|-
| E1 | **PASA** | Con sesión de administrador: `GET /api/membresias`, `GET /api/pagos`, `GET /api/accesos` y `GET /api/clientes/235/rostro` (facial) → 200, intactos y sin lógica nueva del Sprint 1 (A13); `GET /api/rutinas` y `GET /api/dashboard` → 404 (siguen inexistentes). |
| E2 | **PASA** | `node database/migrate.mjs` ejecutado dos veces con `DB_NAME=gym_db_pruebas`: ambas corridas informan `Scripts aplicados en esta ejecución: 0.`, todo omitido por «Ya estaba aplicado», y la tabla `migraciones` conserva sus 5 filas sin duplicados. `gym_db` no se tocó. |
| E3 | **PASA** | `backend/src/config/db.js` usa `127.0.0.1:3306` por defecto; `.env.example` contiene solo placeholders (`cambia_esta_contraseña`, `genera_aqui_un_secreto_largo_y_aleatorio`); ninguna referencia a proveedores de nube ni servicios externos de datos en el código (los únicos «aws» del repositorio son la dependencia transitoria `aws-ssl-profiles` de mysql2 en `package-lock.json` y PlanetScale mencionado en `research.md` como alternativa **descartada**). |

## Criterio de cierre del sprint

| Bloque | Estado |
|--------|--------|-
| A1–A9 | 8 PASA; A5 pendiente de la espera de 15 minutos (fila actualizada al cierre). |
| U1–U8 | 8/8 PASA. |
| C1–C8 | 8/8 PASA. |
| R1–R7 | 0/7 — pendientes del navegador de escritorio (instrucciones arriba). |
| E1–E3 | 3/3 PASA. |
| Suites `npm test` | Ver T031: backend y frontend en verde con la cadena `gym_db_pruebas` verificada. |
