# Especificación de la función: Base del sistema, autenticación y gestión (Sprint 1)

**Rama de la función**: `001-sprint1-base-auth`

**Creada**: 2026-10-14

**Estado**: Borrador

**Entrada**: Descripción del usuario: "Genera la especificación del Sprint 1 de GymAccess:
base del sistema, autenticación, usuarios, roles, permisos, clientes y rediseño visual
del login. Respeta la arquitectura existente (React, Node.js, Express, JavaScript ES
Modules y MySQL), las reglas de seguridad y el diseño oscuro con acentos naranjas.
Limita el alcance al Sprint 1: sin membresías funcionales, pagos, reconocimiento
facial, control de acceso, rutinas ni dashboard."

## Escenarios de usuario y pruebas *(obligatorio)*

### Historia de usuario 1 - Inicio de sesión seguro (Prioridad: P1)

Como usuario registrado, quiero iniciar sesión con mi correo y contraseña para acceder
a las funciones que me corresponden según mi rol.

**Por qué esta prioridad**: sin inicio de sesión no existe acceso a ninguna otra
función privada del sistema; es la puerta de entrada de todos los roles y por tanto
la base mínima viable del sprint.

**Prueba independiente**: se puede probando únicamente con un usuario existente y
activo: enviar credenciales correctas y verificar que se establece la sesión, y enviar
credenciales incorrectas y verificar el rechazo.

**Escenarios de aceptación**:

1. **Dado** un usuario con cuenta activa y credenciales correctas, **Cuando** envía su
   correo y contraseña, **Entonces** se establece la sesión y puede acceder a las
   funciones de su rol.
2. **Dado** un usuario con contraseña incorrecta, **Cuando** envía el formulario,
   **Entonces** ve el mensaje `correo o contraseña incorrectos` y no se establece
   ninguna sesión.
3. **Dado** un correo inexistente, **Cuando** se envía con cualquier contraseña,
   **Entonces** se muestra exactamente el mismo mensaje del escenario anterior, sin
   revelar si el correo está registrado.
4. **Dado** una cuenta con 4 intentos fallidos consecutivos, **Cuando** falla el quinto
   intento, **Entonces** el inicio de sesión queda bloqueado durante 15 minutos y el
   mensaje informado no permite adivinar si el correo existe.
5. **Dado** una cuenta bloqueada, **Cuando** transcurren los 15 minutos, **Entonces**
   el sistema permite volver a intentar el inicio de sesión.
6. **Dado** un usuario con la cuenta desactivada, **Cuando** intenta iniciar sesión,
   **Entonces** el acceso se deniega.
7. **Dado** un correo escrito con espacios sobrantes o mezcla de mayúsculas y
   minúsculas, **Cuando** se usa para iniciar sesión, **Entonces** se compara de forma
   normalizada y el inicio de sesión funciona si la contraseña es correcta.
8. **Dado** una sesión vencida (mayor a 8 horas), **Cuando** el usuario intenta acceder
   a una función privada, **Entonces** se le exige autenticarse nuevamente.

---

### Historia de usuario 2 - Cierre de sesión (Prioridad: P2)

Como usuario autenticado, quiero cerrar mi sesión para impedir que otra persona utilice
mi cuenta desde el mismo equipo.

**Por qué esta prioridad**: protege la sesión en equipos compartidos del gimnasio; es
una acción pequeña pero necesaria para demostrar el ciclo completo de autenticación.

**Prueba independiente**: iniciar sesión, cerrar sesión y verificar que la aplicación
vuelve a exigir credenciales para cualquier función privada.

**Escenarios de aceptación**:

1. **Dado** un usuario autenticado, **Cuando** selecciona cerrar sesión, **Entonces** la
   sesión local se elimina y la aplicación vuelve a mostrar el inicio de sesión.
2. **Dado** una sesión cerrada, **Cuando** se intenta acceder a una función privada,
   **Entonces** el sistema exige autenticación de nuevo.
3. **Dado** un equipo compartido con la sesión cerrada, **Cuando** otra persona abre la
   aplicación, **Entonces** no encuentra ninguna información del usuario anterior.

---

### Historia de usuario 3 - Gestión de usuarios, roles y estados (Prioridad: P2)

Como administrador, quiero crear, consultar, modificar usuarios, asignar roles y
activar o desactivar cuentas para controlar quién puede utilizar el sistema.

**Por qué esta prioridad**: sin usuarios administrables no hay forma de dar de alta al
resto de personal ni de sostener los permisos de los siguientes módulos.

**Prueba independiente**: crear un usuario con cada uno de los roles válidos, modificar
sus datos, desactivarlo y verificar que un usuario sin permisos es rechazado al
intentar las mismas operaciones.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado, **Cuando** crea un usuario con nombre,
   correo, contraseña y uno de los cuatro roles válidos (`administrador`,
   `recepcionista`, `entrenador`, `cliente`), **Entonces** el usuario queda guardado y
   aparece en el listado.
2. **Dado** un correo ya registrado (incluyendo variantes con espacios o distintas
   mayúsculas), **Cuando** se intenta crear otro usuario con ese correo, **Entonces** la
   operación se rechaza informando que el correo ya existe.
3. **Dado** un administrador autenticado, **Cuando** consulta el listado o el detalle de
   un usuario, **Entonces** nunca se muestra la contraseña ni su representación
   almacenada.
4. **Dado** un usuario con la cuenta activa, **Cuando** el administrador lo desactiva,
   **Entonces** ese usuario deja de poder iniciar sesión.
5. **Dado** un rol distinto de los cuatro válidos enviado en la solicitud, **Cuando** se
   procesa la operación, **Entonces** se rechaza y el rol no se modifica.
6. **Dado** que solo queda un administrador activo, **Cuando** se intenta desactivarlo o
   cambiarle el rol, **Entonces** la operación se rechaza con un mensaje claro.
7. **Dado** un usuario sin permisos de administración (recepcionista, entrenador o
   cliente), **Cuando** intenta una operación de gestión de usuarios, **Entonces**
   recibe acceso denegado aunque oculte o simule la interfaz.

---

### Historia de usuario 4 - Gestión de clientes (Prioridad: P3)

Como administrador o recepcionista autorizado, quiero registrar, consultar y modificar
clientes para mantener actualizada la información del gimnasio.

**Por qué esta prioridad**: los clientes son el registro central del negocio y
dependen de que existan usuarios y permisos; sin embargo, aún no requiere los módulos
de Sprint 2.

**Prueba independiente**: registrar un cliente desde cada rol autorizado, editarlo,
intentar la misma operación con un rol no autorizado y verificar el rechazo.

**Escenarios de aceptación**:

1. **Dado** un administrador o recepcionista autenticado, **Cuando** registra un cliente
   con sus datos personales, **Entonces** el cliente queda guardado y es consultable en
   el listado y en el detalle.
2. **Dado** un cliente ya registrado con datos que el modelo considera únicos,
   **Cuando** se intenta registrar un duplicado, **Entonces** la operación se rechaza
   informando el conflicto.
3. **Dado** un administrador o recepcionista autenticado, **Cuando** modifica los datos
   personales de un cliente, **Entonces** los cambios quedan guardados y son visibles
   en la consulta posterior.
4. **Dado** un entrenador o un cliente autenticado, **Cuando** intenta registrar o
   modificar clientes, **Entonces** recibe acceso denegado.
5. **Dado** un cliente registrado, **Cuando** se intenta eliminar físicamente,
   **Entonces** la operación no está disponible y el registro permanece en el sistema.

---

### Historia de usuario 5 - Vinculación de cuenta con cliente y perfil propio (Prioridad: P3)

Como administrador, quiero vincular una cuenta de usuario con un registro de cliente, y
como cliente autenticado, quiero consultar mi propia información para verificar los
datos que tiene registrados el gimnasio.

**Por qué esta prioridad**: habilita la consulta propia del cliente, requisito de los
permisos del sistema, y garantiza la coherencia entre cuentas y registros de cliente.

**Prueba independiente**: vincular una cuenta con rol `cliente` a un registro de
cliente, iniciar sesión con esa cuenta y verificar que solo se muestran los campos
propios del cliente.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado y un cliente sin cuenta, **Cuando** crea la
   cuenta con rol `cliente` vinculándola a ese registro, **Entonces** la cuenta queda
   asociada al cliente correcto.
2. **Dado** un registro de cliente ya vinculado a otra cuenta, **Cuando** se intenta
   vincular una segunda cuenta, **Entonces** la operación se rechaza.
3. **Dado** un usuario con rol `cliente` sin vínculo a un registro de cliente,
   **Cuando** se intenta crear o activar esa cuenta, **Entonces** la operación se
   rechaza hasta que se seleccione un cliente válido.
4. **Dado** un cliente autenticado, **Cuando** consulta su perfil, **Entonces** ve
   únicamente nombre y apellidos, correo, teléfono, dirección, fecha de registro y
   estado del cliente.
5. **Dado** un cliente autenticado, **Cuando** intenta modificar su perfil o cambiar el
   identificador de la solicitud para consultar los datos de otro cliente, **Entonces**
   la modificación no está disponible y la consulta ajena se deniega.
6. **Dado** un cliente sin cuenta de usuario, **Cuando** se revisa su registro,
   **Entonces** permanece visible para los roles autorizados sin requerir una cuenta.

---

### Historia de usuario 6 - Rediseño visual del inicio de sesión (Prioridad: P4)

Como usuario del sistema, quiero una pantalla de inicio de sesión clara, accesible y
coherente con la estética oscura con acentos naranjas del producto, sin perder las
funciones de autenticación existentes.

**Por qué esta prioridad**: mejora la percepción y la accesibilidad del producto, pero
no bloquea ninguna funcionalidad; debe entregarse sin alterar el comportamiento
probado de la autenticación.

**Prueba independiente**: abrir la pantalla en escritorio y en pantalla pequeña,
verificar la maquetación, el mostrar/ocultar contraseña, el uso con teclado y que el
inicio de sesión sigue funcionando igual que antes.

**Escenarios de aceptación**:

1. **Dado** el sistema abierto en una pantalla de escritorio, **Cuando** se carga el
   inicio de sesión, **Entonces** se muestran dos paneles de ancho equivalente: panel de
   presentación a la izquierda y formulario a la derecha, sobre fondo `#0a0b0e` con el
   formulario sobre `#0f1117` y acentos en `#f05a24`.
2. **Dado** el panel izquierdo, **Cuando** se muestra, **Entonces** presenta marca,
   título principal con el resaltado naranja, tarjeta compacta de reconocimiento facial
   con estado visual y puntos indicadores decorativos, sin presentar el estado
   “Acceso autorizado” como resultado real de una verificación.
3. **Dado** el formulario, **Cuando** se interactúa con el campo de contraseña,
   **Entonces** el control de mostrar/ocultar contraseña funciona y los estados de
   foco, validación y error son visibles y legibles.
4. **Dado** una pantalla de hasta 768 px de ancho, **Cuando** se carga el inicio de
   sesión, **Entonces** el panel de presentación queda oculto, el formulario se centra a
   pantalla completa y no existe desbordamiento horizontal.
5. **Dado** un usuario que navega solo con teclado, **Cuando** recorre el formulario,
   **Entonces** alcanza todos los controles en orden lógico con foco visible.
6. **Dado** el sistema operativo con preferencia de movimiento reducido activa,
   **Cuando** se carga la pantalla, **Entonces** las animaciones se desactivan o reducen
   y ningún error queda oculto por animación.
7. **Dado** el formulario rediseñado, **Cuando** se envían credenciales válidas o
   inválidas, **Entonces** el resultado de autenticación, los mensajes y el manejo de la
   sesión son idénticos a los del comportamiento previo.

---

### Casos límite

- ¿Qué ocurre cuando se superan los 5 intentos fallidos con correos inexistentes? El
  bloqueo se aplica igualmente y el mensaje no revela si el correo existe.
- ¿Qué ocurre cuando el bloqueo de 15 minutos está activo y se reintenta antes de
  tiempo? Se deniega el intento con un mensaje que no filtre información de la cuenta.
- ¿Qué ocurre cuando el administrador intenta desactivarse a sí mismo siendo el único
  activo? La operación se rechaza y su sesión continúa.
- ¿Qué ocurre cuando se envía un rol o un identificador de propietario directamente en
  la solicitud desde el cliente? El sistema lo ignora o lo rechaza y aplica únicamente
  la sesión y los permisos persistidos.
- ¿Qué ocurre cuando la sesión expira (8 horas) en pleno uso? La siguiente acción
  privada exige autenticarse de nuevo.
- ¿Qué ocurre cuando un cliente con la cuenta de usuario activa pero el registro de
  cliente inactivo inicia sesión? Puede iniciar sesión y consultar su propia
  información, conforme a la regla definida para el Sprint 1.
- ¿Qué ocurre cuando dos administradores intentan modificar al mismo tiempo el último
  administrador activo? Cualquier resultado que desactive o degrada al último
  administrador activo debe ser rechazado.
- ¿Qué ocurre cuando la consulta de perfil recibe un identificador distinto al del
  usuario autenticado? Se deniega sin filtrar datos de terceros.
- ¿Qué ocurre cuando un correo duplicado llega tras la normalización de espacios y
  mayúsculas? Se detecta como duplicado y se rechaza.
- ¿Qué ocurre cuando la operación falla por un error inesperado? Se devuelve un mensaje
  comprensible y un código de error apropiado, sin mostrar detalles internos.

## Requisitos *(obligatorio)*

### Requisitos funcionales

**Autenticación**

- **FR-001**: El sistema DEBE permitir iniciar sesión únicamente con correo y
  contraseña de una cuenta existente y activa.
- **FR-002**: Las contraseñas DEBEN guardarse de forma irreversible (hash seguro) y
  NUNCA devolverse ni mostrarse en ninguna respuesta ni interfaz.
- **FR-003**: La sesión DEBE expirar a las 8 horas y toda función privada DEBE exigir
  una sesión válida; ante un token inválido o vencido el acceso se DENIEGA.
- **FR-004**: Tras 5 intentos consecutivos fallidos, el inicio de sesión DEBE quedar
  bloqueado durante 15 minutos para esa cuenta, y el mensaje emitido NO DEBE revelar
  si el correo existe.
- **FR-005**: Ante credenciales incorrectas el sistema DEBE mostrar exclusivamente el
  mensaje `correo o contraseña incorrectos`.
- **FR-006**: Una cuenta con estado inactivo NO DEBE poder iniciar sesión.
- **FR-007**: El correo DEBE normalizarse eliminando espacios al inicio y al final y
  comparándose sin distinguir mayúsculas/minúsculas tanto al iniciar sesión como al
  crear o modificar usuarios.
- **FR-008**: El cierre de sesión DEBE eliminar la sesión en el dispositivo y la
  aplicación DEBE volver a exigir autenticación para acceder a funciones privadas.
- **FR-009**: NO DEBE habilitarse registro público de cuentas ni recuperación de
  contraseña por correo en este sprint.
- **FR-010**: Un cliente con cuenta de usuario activa pero registro de cliente
  inactivo DEBE poder iniciar sesión y consultar su propia información, conforme a la
  regla del Sprint 1.

**Usuarios, roles y permisos**

- **FR-011**: El administrador DEBE poder crear, consultar (listado y detalle) y
  modificar los datos permitidos de los usuarios.
- **FR-012**: El sistema DEBE admitir únicamente los roles `administrador`,
  `recepcionista`, `entrenador` y `cliente`; el rol SOLO DEBE asignarse mediante una
  operación autorizada del administrador.
- **FR-013**: El administrador DEBE poder activar y desactivar cuentas; NO DEBE existir
  eliminación física de usuarios desde la interfaz.
- **FR-014**: El sistema DEBE impedir desactivar o cambiar el rol del único
  administrador activo.
- **FR-015**: El correo DEBE ser único por cuenta según la normalización definida.
- **FR-016**: Toda operación privada DEBE validar sesión y permisos en el servidor;
  el rol, el estado privilegiado o los identificadores de propietario enviados por el
  cliente NO DEBEN aceptarse sin autorización y validación explícitas.
- **FR-017**: El sistema DEBE responder con acceso denegado ante cualquier operación
  realizada por un rol sin permiso, según la matriz de permisos del Sprint 1:

  | Operación | Administrador | Recepcionista | Entrenador | Cliente |
  |---|---|---|---|---|
  | Iniciar/cerrar sesión | Sí | Sí | Sí | Sí |
  | Gestionar usuarios y roles | Sí | No | No | No |
  | Activar/desactivar usuarios | Sí | No | No | No |
  | Registrar y modificar clientes | Sí | Sí | No | No |
  | Consultar clientes operativos | Sí (completo) | Sí (completo) | Solo datos básicos | No |
  | Consultar perfil propio | Sí, si aplica | Sí, si aplica | Sí, si aplica | Sí |
  | Modificar perfil propio | No | No | No | No |

  *(Ajustado el 2026-10-14 por la decisión A16 aprobada: el entrenador sí puede
  consultar el listado y el detalle de clientes con un recorte estricto de
  campos — `id_cliente`, `nombre`, `apellido`, `telefono`, `estado` — sin acceso
  a correo, dirección ni historial; se alinea así con el comportamiento existente
  del backend verificado.)*

- **FR-018**: Los mensajes de error DEBEN ser comprensibles, usar códigos apropiados y
  NO DEBEN exponer consultas, trazas ni detalles internos.

**Clientes**

- **FR-019**: El administrador y el recepcionista DEBEN poder registrar, consultar y
  modificar clientes.
- **FR-020**: El sistema DEBE rechazar el guardado de clientes duplicados conforme a
  los campos únicos definidos en el modelo y las relaciones con usuarios inexistentes.
- **FR-021**: NO DEBE existir eliminación física de clientes como operación normal.
- **FR-022**: Un registro de cliente DEBE poder existir sin cuenta de usuario
  vinculada.
- **FR-023**: Toda cuenta con rol `cliente` DEBE usar un `correo` que coincida con
  el de un registro de cliente existente al crearse, y NO DEBEN permitirse vínculos
  duplicados: un cliente no puede tener más de una cuenta. *(Ajustado el
  2026-10-14 por la decisión A5 aprobada: el modelo real no tiene `clienteId` ni
  clave foránea; el vínculo se resuelve por coincidencia de `correo` entre
  `usuarios` y `clientes`, y un cliente sin `correo` no puede tener cuenta.)*
- **FR-024**: El cliente autenticado DEBE consultar únicamente su propio perfil con los
  campos: nombre y apellidos, correo, teléfono, dirección, fecha de registro y estado,
  y NO DEBE poder modificarlo durante este sprint.
- **FR-025**: El sistema DEBE denegar la consulta de datos de otro cliente cuando el
  identificador de la solicitud no corresponde al usuario autenticado.

**Preparación del modelo**

- **FR-026**: El modelo DEBE contemplar las entidades mínimas `usuarios` y `clientes`
  con sus relaciones y restricciones documentadas; las entidades de membresías y
  pagos SOLO podrán prepararse estructuralmente, sin operaciones de negocio, conforme
  al alcance del Sprint 1.

**Rediseño visual del inicio de sesión**

- **FR-027**: En escritorio la pantalla DEBE mostrar una distribución dividida 50/50:
  panel de presentación a la izquierda y formulario a la derecha, con fondo base
  `#0a0b0e`, fondo de formulario `#0f1117` y acento naranja `#f05a24`.
- **FR-028**: El panel izquierdo DEBE incluir marca, título principal con resaltado
  naranja, tarjeta compacta de reconocimiento facial con estado visual y puntos
  indicadores decorativos; el indicador “Acceso autorizado” SOLO DEBE presentarse como
  demostración visual, nunca como resultado real de una verificación.
- **FR-029**: El formulario DEBE incluir correo, contraseña, control para mostrar u
  ocultar la contraseña, botón principal de envío y un enlace de soporte o contacto
  cuyo texto NO DEBE inventar direcciones o URLs no definidas en el proyecto.
- **FR-030**: En pantallas de hasta 768 px DEBE ocultarse el panel de presentación, el
  formulario DEBE centrarse a pantalla completa y NO DEBE haber desbordamiento
  horizontal.
- **FR-031**: Los campos DEBEN tener etiquetas accesibles, estados de foco visibles,
  mensajes de validación legibles y contraste suficiente; la pantalla DEBE poder usarse
  con teclado.
- **FR-032**: Las animaciones DEBEN ser sutiles y breves, NO DEBEN ocultar errores ni
  retrasar el envío del formulario, y DEBEN respetar la preferencia de movimiento
  reducido del sistema.
- **FR-033**: El rediseño NO DEBE modificar la autenticación existente: rutas,
  nombres de campos, validaciones, comunicación con el servidor, almacenamiento de sesión,
  tokens y mensajes de error permanecen operativamente idénticos.

### Entidades clave

- **Usuario**: persona con cuenta de acceso al sistema; identificado por correo
  normalizado y único, con contraseña almacenada de forma irreversible, nombre, rol
  (uno de los cuatro válidos) y estado activo/inactivo. Se relaciona, cuando su rol es
  `cliente`, con un registro de cliente.
- **Cliente**: persona atendida por el gimnasio; datos personales (nombre y apellidos,
  correo, teléfono, dirección), fecha de registro y estado. Puede existir sin cuenta y
  como máximo mantiene una cuenta vinculada.
- **Rol y permisos**: clasificación (`administrador`, `recepcionista`, `entrenador`,
  `cliente`) que determina las operaciones permitidas; se deriva de la sesión
  validada, nunca de datos enviados por el cliente.
- **Registro de sesión**: evidencia de la autenticación vigente con expiración de 8
  horas y ciclo de inicio/cierre; respeta el bloqueo temporal por intentos fallidos.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **SC-001**: El 100% de los usuarios activos con credenciales correctas completa el
  inicio de sesión en menos de 10 segundos desde el envío del formulario.
- **SC-002**: El 100% de las operaciones realizadas por roles sin permiso son rechazadas
  en las pruebas de autorización del sprint, incluidas las intentadas cambiando
  identificadores en la solicitud.
- **SC-003**: Cero contraseñas o equivalentes almacenados aparecen en el 100% de las
  respuestas y pantallas que muestran datos de usuarios.
- **SC-004**: El 100% de los escenarios con 5 intentos fallidos consecutivos activa el
  bloqueo de 15 minutos, y el 100% de los mensajes de credenciales incorrectas es
  idéntico, sin revelar la existencia del correo.
- **SC-005**: El 100% de los criterios de aceptación de autenticación, usuarios,
  clientes y perfil propio pasan sus pruebas antes de declarar terminado el sprint.
- **SC-006**: Al menos el 95% de los usuarios de prueba completa el inicio de sesión en
  el primer intento durante la demostración del sprint.
- **SC-007**: La pantalla de inicio de sesión es usable sin desbordamiento horizontal
  desde 320 px de ancho hasta pantallas de escritorio, y completa el envío del
  formulario solo con teclado en el 100% de las pruebas de accesibilidad planificadas.
- **SC-008**: Cero funcionalidades de membresías, pagos, reconocimiento facial, control
  de acceso, rutinas o dashboard se entregan o interfieren en el alcance del Sprint 1.

## Supuestos

- El bloqueo por intentos fallidos se aplica por cuenta (correo normalizado); no se
  define control por dirección de red en este sprint.
- Puede existir más de un administrador; solo se protege al último administrador
  activo.
- El estado de la cuenta de usuario (activa/inactiva) es independiente del estado del
  registro de cliente; por eso un cliente con cuenta activa y registro inactivo puede
  iniciar sesión (regla Sprint 1), mientras una cuenta inactiva no puede.
- La relación entre cuenta y cliente es de uno a uno: un cliente como máximo tiene una
  cuenta vinculada y una cuenta cliente pertenece a un solo cliente.
- Los campos únicos de clientes (además del correo normalizado cuando aplique) se
  definen en el modelo de datos durante la fase de planificación.
- El cierre de sesión elimina la sesión en el dispositivo; no se exige invalidación
  global anticipada del token antes de su expiración de 8 horas.
- Las entidades de tipos de membresía, membresías y pagos solo se preparan
  estructuralmente para el Sprint 2, sin catálogos ni operaciones visibles.
- El enlace de soporte del formulario se muestra solo si el proyecto define una
  dirección real; en caso contrario se usa texto de contacto sin destino inventado.
- La auditoría completa de operaciones queda para el Sprint 2; este sprint solo
  necesita los registros estrictamente necesarios de los flujos aquí descritos.
- No se realiza ningún trabajo de implementación en esta fase: esta función genera
  únicamente los archivos de especificación de Spec Kit.
