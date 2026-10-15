<!--
Documento de entrada para /speckit.specify.
No guardar este archivo dentro de la carpeta specs/ generada por Spec Kit.
-->

# Insumo de especificación - Sprint 1: Base del sistema, usuarios y clientes

> **Referencias obligatorias para el agente:**
>
> - Contexto maestro: `docs/project-context.md`
> - Constitución técnica: `docs/reglas.md`
> - Este documento describe únicamente el alcance del Sprint 1.

## 1. Contexto

El Sprint 1 construirá la base segura del sistema del gimnasio. Se implementarán la autenticación, la gestión de usuarios y roles, el control de permisos y la administración de clientes. También se preparará la estructura mínima necesaria para que las siguientes etapas puedan incorporar membresías y pagos, sin desarrollar todavía sus operaciones funcionales.

La arquitectura debe respetar React en el frontend, Node.js + Express en el backend, MySQL en la base de datos y ES Modules en el backend.

## 2. Objetivo

Entregar una aplicación funcional en la que los usuarios puedan iniciar y cerrar sesión de forma segura, las funciones se restrinjan según el rol y el personal autorizado pueda gestionar usuarios y clientes, manteniendo los datos protegidos y consistentes.

## 3. Historias de usuario

### US-S1-01 — Inicio de sesión

Como usuario registrado, quiero iniciar sesión con mi correo y contraseña para acceder a las funciones que me corresponden.

### US-S1-02 — Cierre de sesión

Como usuario autenticado, quiero cerrar mi sesión para impedir que otra persona utilice mi cuenta desde el mismo equipo.

### US-S1-03 — Gestión de usuarios

Como administrador, quiero crear, consultar y modificar usuarios para controlar quién puede utilizar el sistema.

### US-S1-04 — Gestión de roles y estados

Como administrador, quiero asignar roles y activar o desactivar cuentas para controlar los permisos de acceso.

### US-S1-05 — Gestión de clientes

Como administrador o recepcionista autorizado, quiero registrar, consultar y modificar clientes para mantener actualizada la información del gimnasio.

### US-S1-06 — Vinculación de cuenta con cliente

Como administrador, quiero vincular una cuenta de usuario con un registro de cliente para que esa persona pueda consultar su propia información.

### US-S1-07 — Consulta del perfil

Como cliente autenticado, quiero consultar mi información personal para verificar los datos que tiene registrados el gimnasio.

## 4. Alcance funcional

### 4.1 Autenticación

- Inicio y cierre de sesión.
- Verificación de credenciales mediante bcrypt.
- Emisión de JWT con expiración de 8 horas.
- Bloqueo temporal de 15 minutos después de 5 intentos consecutivos fallidos.
- Mensaje genérico para credenciales incorrectas: `correo o contraseña incorrectos`.
- Rechazo de cuentas inactivas.
- Normalización del correo: eliminar espacios al inicio/final y realizar comparaciones sin distinguir mayúsculas/minúsculas.
- Protección de rutas privadas en el backend.

### 4.2 Usuarios

- Crear usuarios.
- Consultar listado y detalle de usuarios.
- Modificar los datos permitidos.
- Asignar uno de los cuatro roles válidos.
- Activar y desactivar usuarios.
- No mostrar hashes de contraseñas en las respuestas.
- No permitir la desactivación ni el cambio de rol del único administrador activo.
- No permitir eliminación física de usuarios desde la interfaz.

Los roles válidos son `administrador`, `recepcionista`, `entrenador` y `cliente`.

### 4.3 Clientes

- Registrar clientes.
- Consultar listado y detalle.
- Modificar datos personales mediante usuarios autorizados.
- Mantener la relación opcional entre cliente y cuenta de usuario.
- Evitar duplicidades según los campos únicos que se definan en el modelo.
- No eliminar físicamente clientes como operación normal.

### 4.4 Perfil del cliente

El cliente autenticado puede consultar únicamente:

- Nombre y apellidos.
- Correo.
- Teléfono.
- Dirección.
- Fecha de registro.
- Estado del cliente.

El cliente no puede editar su perfil durante este sprint. Un cliente inactivo que todavía tenga una cuenta de usuario activa podrá iniciar sesión y consultar su propia información, de acuerdo con la regla definida para Sprint 1.

### 4.5 Preparación para Sprint 2

Se pueden definir las decisiones y relaciones necesarias para las entidades de tipos de membresía, membresías y pagos, pero no se desarrollarán sus operaciones de negocio en este sprint.

Fuera del alcance de Sprint 1:

- Crear y configurar tipos de membresía desde la interfaz.
- Asignar, renovar o cancelar membresías.
- Calcular adeudos.
- Registrar pagos.
- Reconocimiento facial y control de acceso.
- Dashboard, reportes y seguimiento de entrenamiento.

## 4.6 Rediseño visual de inicio de sesión

Rediseñar `frontend/src/pages/LoginPage.jsx` o el componente equivalente y sus estilos en `styles.css`, manteniendo intacta la lógica de autenticación y la integración con el backend.

### Maquetación en escritorio

- Contenedor principal de alto completo, `min-height: 100vh`, `display: flex`, `overflow: hidden` y fondo `#0a0b0e`.
- Distribución Split-Screen 50/50.
- Panel izquierdo `.login-hero-section` con `flex: 1`, distribución vertical, `justify-content: space-between` y padding aproximado de `4rem 3.5rem`.
- Panel derecho `.login-form-section` con `flex: 1`, centrado vertical y horizontalmente sobre `#0f1117` o un fondo oscuro equivalente.

### Panel izquierdo

- Branding con icono y nombre `GYM ACCESS` o `ACCESS GYM`.
- Título: **“Controla quién entra, sin filas.”**, resaltando “sin filas.” con `#f05a24`.
- Tarjeta compacta de presentación con glassmorphism discreto, borde suave y radio aproximado de 20 px.
- La tarjeta incluirá un marco o icono ilustrativo de escaneo facial y un indicador visual “Acceso autorizado”. Este indicador es únicamente demostrativo del diseño y no debe presentarse como resultado real de una verificación.
- Incluir puntos indicadores decorativos, con el punto activo en naranja. No deben aparentar ser un carrusel funcional si no existe esa funcionalidad.

### Panel derecho

- Título: **“Iniciar sesión en Access Gym”** y subtítulo breve en gris tenue.
- Campos de correo electrónico y contraseña con fondos oscuros, bordes suaves y estados de foco claros.
- Control para mostrar u ocultar la contraseña.
- Botón principal de ancho completo, naranja `#f05a24`, esquinas redondeadas y texto **“Iniciar sesión →”**.
- Enlace secundario de soporte o contacto, sin inventar una dirección de correo o URL si no está definida en el proyecto.

### Responsividad y animaciones

- En `@media (max-width: 768px)`, ocultar `.login-hero-section` y centrar el formulario a pantalla completa.
- Evitar desbordamiento horizontal y conservar una experiencia usable en pantallas pequeñas.
- Se permiten animaciones suaves de entrada, transición de opacidad/posición y microinteracciones en botones o tarjeta.
- Respetar `prefers-reduced-motion`.
- No retrasar el inicio de sesión ni cambiar la lógica de envío, validación, autenticación, sesión, tokens, llamadas a la API o mensajes de error existentes.

### Criterios de aceptación visual

- La pantalla de escritorio presenta dos paneles de ancho equivalente.
- La paleta, jerarquía tipográfica y espaciado se mantienen coherentes con la estética solicitada.
- El formulario conserva las funciones existentes de autenticación.
- Mostrar/ocultar contraseña funciona.
- En pantallas de hasta 768 px, el panel izquierdo queda oculto y el formulario ocupa el espacio disponible.
- La interfaz puede utilizarse con teclado y presenta estados de foco visibles.
- Las animaciones son discretas y se reducen cuando el sistema solicita movimiento reducido.

## 5. Roles y permisos del Sprint 1

| Operación | Administrador | Recepcionista | Entrenador | Cliente |
|-----------------------|---|---|---|
| Iniciar/cerrar sesión | Sí | Sí | Sí | Sí |
| Gestionar usuarios y roles | Sí | No | No | No |
| Activar/desactivar usuarios | Sí | No | No | No |
| Registrar y modificar clientes | Sí | Sí | No | No |
| Consultar clientes para tareas operativas | Sí | Sí | No en este sprint | No |
| Consultar perfil propio | Sí, si aplica | Sí, si aplica | Sí, si aplica | Sí |
| Modificar perfil propio | No mediante este módulo | No mediante este módulo | No mediante este módulo | No |
| Consultar información de otro cliente | Según permisos administrativos | Según permisos operativos | No | No |

La autorización se debe aplicar en el backend, no solamente en la interfaz. Las rutas y consultas deben impedir que un cliente consulte datos de otra persona.

## 6. Reglas de negocio

1. El correo es obligatorio y debe ser único conforme a la normalización definida.
2. Las contraseñas se almacenan únicamente como hash bcrypt.
3. Un usuario inactivo no puede iniciar sesión.
4. Los intentos fallidos se contabilizan consecutivamente y se aplica el bloqueo temporal definido en `docs/reglas.md`.
5. Los mensajes de credenciales incorrectas no deben indicar si el correo existe.
6. El sistema no debe devolver el campo `password` en ninguna respuesta de usuario.
7. No se puede desactivar ni cambiar el rol del único administrador activo.
8. Una cuenta con rol `cliente` debe estar vinculada a un registro de `clientes`.
9. Puede existir un cliente sin cuenta de usuario.
10. Un cliente solo consulta su propia información.
11. El usuario cliente no puede modificar los datos de su perfil durante este sprint.
12. No se habilitan registro público ni recuperación de contraseña por correo.
13. Las operaciones críticas deben validar permisos en backend.

## 7. Criterios de aceptación

### Autenticación

- Un usuario activo con credenciales válidas puede iniciar sesión.
- Las credenciales incorrectas producen el mensaje genérico definido.
- Un usuario inactivo no puede iniciar sesión.
- Después de 5 intentos consecutivos fallidos se aplica un bloqueo de 15 minutos.
- El JWT expira a las 8 horas y las rutas protegidas rechazan tokens inválidos o vencidos.
- El cierre de sesión elimina la sesión local/token del cliente y la aplicación exige autenticación para acceder nuevamente a rutas privadas.

### Usuarios y roles

- El administrador puede crear, consultar y modificar usuarios.
- Los roles guardados pertenecen al conjunto permitido.
- Un usuario sin permisos recibe una respuesta de acceso denegado al intentar ejecutar una operación restringida.
- Las contraseñas no aparecen en respuestas de la API.
- El único administrador activo no puede desactivarse ni cambiarse a otro rol.
- Los correos se comparan sin distinguir mayúsculas/minúsculas y se eliminan espacios al inicio/final.

### Clientes

- Un usuario autorizado puede registrar, consultar y modificar clientes.
- La aplicación evita guardar relaciones con usuarios inexistentes.
- Un cliente con cuenta puede consultar únicamente los campos permitidos de su propio perfil.
- Un cliente no puede modificar su información desde el perfil.
- Un cliente no puede consultar la información de otro cliente modificando un identificador en la solicitud.

## 8. Entidades principales

El diseño debe contemplar, como mínimo:

- `usuarios`
- `clientes`

Las relaciones y restricciones deben documentarse en el modelo de datos y las migraciones. Las tablas de membresías y pagos pueden prepararse para los siguientes sprints, pero no deben convertirse en funciones de negocio dentro de este sprint.

## 9. Entregables

- Inicio y cierre de sesión.
- Middleware de autenticación y autorización.
- Gestión de usuarios, roles y estados.
- Gestión de clientes.
- Consulta del perfil del cliente.
- Migraciones de base de datos del sprint.
- Validaciones y manejo de errores.
- Pruebas de autenticación, permisos y operaciones de clientes.
- Documentación de las rutas y decisiones relevantes.

## 10. Fuera de alcance

- Membresías y pagos funcionales.
- Reconocimiento facial.
- Registro de entradas y salidas.
- Auditoría funcional completa de operaciones de Sprint 2 y 3.
- Rutinas, entrenadores asignados, progreso y dashboard.
- Registro público y recuperación por correo.
- Aplicación móvil y múltiples sucursales.

## 11. Cierre del sprint

El Sprint 1 se considera terminado cuando todos los criterios de aceptación estén probados, los cambios de base de datos se encuentren en migraciones versionadas, los permisos se verifiquen en backend y la aplicación pueda iniciar y cerrar sesión y gestionar usuarios y clientes de forma consistente.
