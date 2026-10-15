# Quickstart de validación — Sprint 1

**Función**: 001-sprint1-base-auth | **Fecha**: 2026-10-14

Guía de ejecución y comprobación del extremo a extremo. No incluye código de
implementación ni migraciones: esos detalles viven en `tasks.md` y en la fase de
implementación. Los contratos de respuesta citan
[contracts/api.md](contracts/api.md) y [contracts/permisos.md](contracts/permisos.md).

## Requisitos previos

- Node.js 20 LTS o superior (`node -v`).
- **MySQL local** en ejecución en `127.0.0.1:3306` (servicio del propio equipo;
  prohibidas las bases de datos en la nube y los servicios externos de datos, D17
  de [research.md](research.md)) con credenciales de un usuario con permisos de
  crear esquemas.
- Estructura `database/` disponible en la raíz: `migrations/`, `seeds/`,
  `migrate.mjs` y `README.md`. **A1 aprobada (2026-10-14)**: el código se
  consolidará aquí desde `C:\Users\moni2\Documents\gymAccess1` como tarea de la
  fase de implementación; hasta ejecutarla, `backend/`, `frontend/` y
  `database/` viven allí y el ejecutor se llama
  `database/scripts/ejecutar-migraciones.mjs` (adoptado como
  `database/migrate.mjs` por renombrado, ver D8 de [research.md](research.md)).
- Copia de `.env.example` (solo placeholders, **sin contraseñas reales**) como
  `.env` con `PORT`, `DB_*` y `JWT_SECRET` (ver D13 de
  [research.md](research.md)).

## Puesta en marcha

> **Estado real (2026-10-14)**: la base `gym_db` ya existe en `127.0.0.1:3306`
> con sus 5 migraciones/semillas ejecutadas y la estructura creada; ver
> [estado-repositorio.md](estado-repositorio.md). **No se crea, reinicia ni
> limpia la base de datos**: los pasos 1–3 de abajo solo aplican a una instalación
> nueva; en este entorno se omiten.

1. *(Solo instalación nueva)* Crear la base de datos del proyecto (una sola vez):
   `mysql -u root -p -e "CREATE DATABASE gym_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`
2. *(Solo instalación nueva)* Aplicar migraciones (registradas en la tabla
   `migraciones`): ejecutar `node database/migrate.mjs` (en el proyecto previo el
   mismo ejecutor se encuentra como `database/scripts/ejecutar-migraciones.mjs`;
   la adopción con el nombre estándar está aprobada con A1 y se ejecuta al
   consolidar); en
   este entorno ya debe listar `001_crear_base_datos`, `002_crear_tablas_sprint1`,
   `001_usuario_admin`, `003_crear_tablas_sprint2` y
   `002_tipos_membresia_ejemplo` como aplicadas.
3. *(Solo instalación nueva)* Cargar datos de prueba identificados: las semillas
   ya registradas crean el administrador (`admin@gimnasio.local`) y tipos de
   membresía de ejemplo; toda prueba posterior debe usar `gym_db_pruebas`, no
   `gym_db`.
4. Instalar y arrancar en dos terminales (**carpeta actual del código** hasta
   ejecutar la consolidación aprobada A1: `C:\Users\moni2\Documents\gymAccess1`):
   - `backend`: `npm install` y `npm run dev`
   - `frontend`: `npm install` y `npm run dev` (proxy `/api` hacia el backend)
5. Ejecutar pruebas automatizadas: `npm test` en `backend/` y en `frontend/`.

**Resultado esperado**: migraciones aplicadas sin errores, servidores en pie y
ambas suites en verde.

## Escenarios de validación manuales

### Autenticación (SC-001, SC-004, SC-005)

| # | Paso | Resultado esperado |
|---|---|---|
| A1 | Login con correo y contraseña válidos de un usuario activo | 200, sesión vigente y acceso a las funciones del rol en < 10 s |
| A2 | Login con contraseña incorrecta | 401 con `correo o contraseña incorrectos` (requiere el ajuste A8: hoy responde `Credenciales incorrectas`) |
| A3 | Login con correo inexistente | Mismo mensaje y mismo código que A2 |
| A4 | Repetir A2 cinco veces seguidas con el mismo correo | Al quinto fallo: 409 con `Cuenta bloqueada temporalmente por intentos fallidos`, idéntico exista o no la cuenta; el sexto intento inmediato también se bloquea aunque la contraseña sea correcta |
| A5 | Esperar 15 minutos (o ajustar reloj de prueba) y reintentar con credenciales válidas | Login exitoso y contador reiniciado |
| A6 | Login con cuenta `inactivo` y contraseña correcta | 401 con el mismo mensaje genérico `correo o contraseña incorrectos` (se niega sin revelar el estado) |
| A7 | Enviar correo con espacios y mayúsculas de una cuenta existente | Login exitoso (normalización) |
| A8 | Dejar expirar la sesión (8 h) o simular token vencido, luego usar una función privada | 401 y la aplicación exige autenticación de nuevo |
| A9 | Cerrar sesión y navegar a una ruta privada | Se exige iniciar sesión; en el equipo no queda información del usuario anterior |

### Usuarios y permisos (SC-002, SC-003, SC-005)

| # | Paso | Resultado esperado |
|---|---|---|
| U1 | Administrador crea un usuario por cada rol | 201 y los cuatro usuarios en el listado |
| U2 | Inspeccionar las respuestas de listado y detalle | Cero contraseñas o hashes (SC-003) |
| U3 | Crear usuario con correo duplicado variando mayúsculas/espacios | 409 `El correo ya está registrado` |
| U4 | Enviar un rol fuera de los cuatro válidos | 400 y rol sin cambios |
| U5 | Desactivar al único administrador activo, o cambiarle el rol | 409 con el mensaje de último administrador activo |
| U6 | Recepcionista llama a cualquier ruta `/api/usuarios` | 403 (misma respuesta con cualquier simulación desde la interfaz) |
| U7 | Intentos de eliminación de usuarios o clientes (DELETE) | 404 `Recurso no encontrado` (la ruta no existe); los registros permanecen (sin borrado físico) |
| U8 | Revisar la tabla `auditoria` tras U1–U5 | Registros con actor (`id_usuario`), `accion`, `modulo`, `fecha`, `resultado` y `descripcion`, sin credenciales (requiere el ajuste A11) |

### Clientes y perfil (SC-002, SC-005)

| # | Paso | Resultado esperado |
|---|---|---|
| C1 | Administrador y recepcionista registran y modifican un cliente | 201/200 con datos guardados |
| C2 | Entrenador o cliente autenticado intenta registrar/modificar clientes | 403 |
| C3 | Registrar cliente con correo ya existente | 409 por unicidad |
| C4 | Crear cuenta con rol `cliente` cuyo `correo` no coincide con ningún `clientes.correo` | 400 (requiere el ajuste A15; FR-023 ajustada por la decisión A5) |
| C5 | Cliente con cuenta consulta `GET /api/clientes/mio` | Solo su propia ficha (`id_cliente`, `nombre`, `apellido`, `correo`, `telefono`, `direccion`, `fecha_registro`, `estado`); el personal consulta su sesión con `GET /api/auth/me` (no existe `/api/perfil`) |
| C6 | Cliente con cuenta intenta consultar datos de otro cliente alterando el identificador | 403/404 sin datos de terceros |
| C7 | Cliente con registro `inactivo` pero cuenta `activa` inicia sesión | Login exitoso y perfil consultable (regla Sprint 1) |
| C8 | Cliente sin cuenta | No puede iniciar sesión; su registro sigue visible para personal autorizado |

### Rediseño visual del login (SC-007)

| # | Paso | Resultado esperado |
|---|---|---|
| R1 | Abrir el login en escritorio (≥1024 px) | Split 50/50, paleta `#0a0b0e` / `#0f1117` / `#f05a24`, panel con marca, título, tarjeta demostrativa y puntos indicadores |
| R2 | Reducir la ventana a ≤768 px | Panel de presentación oculto, formulario centrado, sin desbordamiento horizontal (desde 320 px) |
| R3 | Activar el control de mostrar/ocultar contraseña | La contraseña alterna visibilidad sin perder el valor |
| R4 | Recorrer el formulario solo con teclado | Foco visible en orden lógico y envío posible |
| R5 | Activar `prefers-reduced-motion` | Animaciones desactivadas o reducidas; ningún error oculto por animación |
| R6 | Comparar el flujo de login antes/después del rediseño | Idéntico: mismos campos, validaciones, llamadas, mensajes y manejo de sesión (FR-033) |
| R7 | Revisar la tarjeta del panel izquierdo | El estado “Acceso autorizado” aparece solo como elemento demostrativo, nunca como resultado real |

### Alcance (SC-008)

| # | Paso | Resultado esperado |
|---|---|---|
| E1 | Solicitar rutas o revisar pantallas de membresías, pagos, facial, acceso, rutinas o dashboard | Membresías, pagos, facial y acceso ya montados por el Sprint 2 quedan intactos y sin lógica nueva del Sprint 1 (A13); rutinas y dashboard siguen inexistentes (`404`) |
| E2 | Ejecutar el ejecutor de migraciones dos veces (`node database/migrate.mjs`; hasta ejecutar la consolidación A1, `database/scripts/ejecutar-migraciones.mjs`) | La segunda no reaplica nada y la tabla `migraciones` no duplica registros (5 filas existentes intactas) |
| E3 | Revisar la configuración de conexión y el esquema de red del entorno | La app solo habla con `127.0.0.1:3306`; `.env.example` no contiene contraseñas reales; ninguna referencia a proveedores de nube o servicios externos de datos |

## Criterio de cierre

El sprint está validado cuando A1–A9, U1–U8, C1–C8, R1–R7 y E1–E3 pasan, las suites
`npm test` de backend y frontend están en verde, y los criterios SC-001 a SC-008 del
spec quedan evidenciados por estos resultados.
