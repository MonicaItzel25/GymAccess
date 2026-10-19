# Especificación de la función: Membresías, pagos, reconocimiento facial y accesos (Sprint 2)

**Rama de la función**: `002-sprint-2-membresias-pagos-reconocimiento-acceso`

**Creada**: 2026-10-15

**Estado**: Borrador

**Entrada**: Descripción del usuario: "Crear la especificación del Sprint-2 de GymAccess
utilizando exclusivamente los documentos de C:\Users\moni2\gymAccess. Usar como fuentes
principales: docs/sprint-2.md, docs/project-context.md, docs/reglas.md,
.specify/memory/constitution.md y la especificación existente del Sprint 1 en
specs/001-sprint1-base-auth/. Incluir las historias US-S2-01 a US-S2-09, los requisitos,
reglas de negocio, criterios de aceptación, permisos por rol, seguridad, privacidad
biométrica y pruebas. Resolver las contradicciones de alcance según las decisiones
confirmadas por el usuario. No duplicar las funcionalidades del Sprint 1. Reutilizar los
módulos que ya existen y especificar los cambios que realmente faltan."

## Escenarios de usuario y pruebas *(obligatorio)*

### Historia de usuario 1 - Gestión de tipos de membresía (US-S2-01) (Prioridad: P1)

Como administrador, quiero crear, consultar, modificar y activar o desactivar tipos de
membresía para definir las opciones disponibles en el gimnasio (nombre, descripción,
duración, precio y estado).

**Por qué esta prioridad**: los tipos de membresía son el catálogo sobre el que se
construyen todas las operaciones del sprint (asignaciones, renovaciones, adeudos y
decisiones de acceso); sin catálogo no existe el resto del alcance.

**Prueba independiente**: crear un tipo con duración y precio válidos, consultarlo en el
listado, modificar su precio, desactivarlo y verificar que ya no puede seleccionarse para
nuevas asignaciones.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado, **Cuando** crea un tipo de membresía con nombre,
   duración y precio válidos, **Entonces** el tipo queda registrado con estado activo y
   aparece en el catálogo.
2. **Dado** un tipo con duración o precio igual a cero o negativo, **Cuando** se intenta
   guardarlo, **Entonces** el sistema lo rechaza con un mensaje comprensible y no crea el
   registro.
3. **Dado** un tipo de membresía existente con membresías ya asignadas, **Cuando** el
   administrador modifica su precio, **Entonces** el cambio se aplica solo al catálogo:
   las membresías ya asignadas conservan su precio acordado y sus adeudos no cambian.
4. **Dado** un tipo desactivado, **Cuando** se intenta asignar a un cliente, **Entonces**
   el sistema rechaza la asignación; las membresías existentes que lo referencian siguen
   consultables.
5. **Dado** un recepcionista autenticado, **Cuando** intenta crear o modificar un tipo de
   membresía, **Entonces** el sistema deniega la operación.

---

### Historia de usuario 2 - Asignación de membresía (US-S2-02) (Prioridad: P2)

Como administrador o recepcionista autorizado, quiero asignar una membresía a un cliente
para registrar su periodo de vigencia y condiciones.

**Por qué esta prioridad**: es la operación central del negocio: sin membresía asignada
no hay cobros, ni vigencia, ni decisiones de acceso; además habilita la prueba del flujo
financiero completo.

**Prueba independiente**: con un cliente existente y un tipo activo, asignar una
membresía, verificar el cálculo de fechas y el estado inicial, y verificar el rechazo
ante un tipo desactivado o un cliente inexistente.

**Escenarios de aceptación**:

1. **Dado** un cliente válido y un tipo de membresía activo con precio determinado,
   **Cuando** el personal autorizado asigna la membresía con una fecha de inicio,
   **Entonces** la fecha de fin se calcula a partir de la duración del tipo, la
   membresía queda registrada conservando el precio acordado al momento de la
   asignación.
2. **Dado** un tipo de membresía desactivado, **Cuando** se intenta asignar, **Entonces**
   la operación se rechaza.
3. **Dado** un cliente que ya tiene una membresía vigente, **Cuando** se intenta asignar
   una segunda, **Entonces** el sistema impide que coexistan dos membresías vigentes.
4. **Dado** un cliente inexistente, **Cuando** se intenta asignar una membresía,
   **Entonces** el sistema rechaza la operación sin crear registros.
5. **Dado** una asignación exitosa, **Cuando** se consulta la auditoría, **Entonces**
   aparece la acción con el actor, la entidad y el resultado.

---

### Historia de usuario 3 - Consulta y estados de membresía (US-S2-03) (Prioridad: P3)

Como personal autorizado, quiero consultar el estado y las fechas de las membresías para
saber si están vigentes, y distinguir suspendidas, vencidas o canceladas.

**Por qué esta prioridad**: la consulta de estado es necesaria para operar el gimnasio y
para que la validación de acceso sea coherente, aunque depende de tener membresías
asignadas.

**Prueba independiente**: asignar una membresía, consultarla por cliente y por estado,
suspenderla, reactivarla y cancelarla, verificando cada transición y sus rechazos.

**Escenarios de aceptación**:

1. **Dado** un cliente con una membresía asignada, **Cuando** el personal autorizado
   consulta sus membresías, **Entonces** ve fechas de inicio, fin y estado coherentes.
2. **Dado** una membresía activa, **Cuando** el administrador la suspende, **Entonces**
   cambia a suspendida y así se refleja en la consulta.
3. **Dado** una membresía suspendida, **Cuando** el administrador la reactiva, **Entonces**
   vuelve a activa.
4. **Dado** una membresía activa con la fecha de fin ya vencida, **Cuando** se consulta,
   **Entonces** el sistema la presenta como vencida: la vigencia se determina por fechas
   y estado, no solo por el texto del estado.
5. **Dado** un recepcionista, **Cuando** intenta suspender o cancelar una membresía,
   **Entonces** el sistema deniega la operación.

---

### Historia de usuario 4 - Renovación de membresía (US-S2-04) (Prioridad: P4)

Como administrador o recepcionista autorizado, quiero renovar una membresía para mantener
actualizado el periodo de servicio del cliente.

**Por qué esta prioridad**: sostiene la relación continua con el cliente, pero es
operable sobre membresías ya existentes, por lo que sigue en importancia a la asignación
y los cobros.

**Prueba independiente**: renovar una membresía vigente, verificar que se cierra el
periodo anterior y nace el nuevo de forma continua, y verificar el rechazo cuando el tipo
dejó de estar activo.

**Escenarios de aceptación**:

1. **Dado** una membresía vigente, **Cuando** el personal autorizado la renueva,
   **Entonces** la membresía anterior se cierra y se crea el nuevo periodo iniciando al
   día siguiente del fin anterior, con la duración del tipo y registrando el precio
   acordado correspondiente al nuevo periodo (el precio del tipo vigente al momento de
   la renovación).
2. **Dado** una renovación con un tipo de membresía actualmente desactivado, **Cuando**
   se intenta guardar, **Entonces** el sistema la rechaza.
3. **Dado** una membresía ya renovada, **Cuando** se consulta el historial del cliente,
   **Entonces** se observan ambos periodos sin solapamiento de vigencias.
4. **Dado** una renovación exitosa, **Cuando** se consulta la auditoría, **Entonces**
   queda registrada la acción con su actor y resultado.

---

### Historia de usuario 5 - Registro de pago (US-S2-05) (Prioridad: P3)

Como recepcionista o administrador autorizado, quiero registrar los pagos de un cliente
para conservar el historial financiero del gimnasio.

**Por qué esta prioridad**: es el pilar del control financiero del sprint y es
independientemente testeable con un cliente y una membresía existentes.

**Prueba independiente**: registrar un pago válido contra la membresía de un cliente,
verificar el historial y los rechazos por importe inválido o relaciones inexistentes.

**Escenarios de aceptación**:

1. **Dado** un cliente con una membresía, **Cuando** el personal autorizado registra un
   pago con importe positivo y método de pago válido, **Entonces** el pago queda guardado
   asociado a la membresía con su fecha.
2. **Dado** un pago con importe cero o negativo, **Cuando** se intenta registrar,
   **Entonces** el sistema lo rechaza.
3. **Dado** un pago con un cliente o membresía inexistente, **Cuando** se intenta
   registrar, **Entonces** el sistema rechaza la relación inválida sin crear el registro.
4. **Dado** una corrección de un pago registrado, **Cuando** el personal autorizado la
   realiza, **Entonces** se conserva el historial: no existe borrado físico de pagos como
   mecanismo normal.
5. **Dado** un entrenador autenticado, **Cuando** intenta registrar un pago, **Entonces**
   el sistema deniega la operación.

---

### Historia de usuario 6 - Consulta de pagos y adeudos (US-S2-06) (Prioridad: P4)

Como usuario autorizado, quiero consultar los pagos registrados y el saldo pendiente de
un cliente para dar seguimiento a su situación, y como cliente consultar los míos.

**Por qué esta prioridad**: completa el control financiero una vez existen pagos; los
casos propios del cliente son simples y dependen del registro de pagos.

**Prueba independiente**: registrar pagos y verificar el cálculo del adeudo; verificar
que cada rol solo ve lo que le corresponde (global el administrador; pagos el
recepcionista; propios el cliente).

**Escenarios de aceptación**:

1. **Dado** una membresía con precio acordado y pagos registrados, **Cuando** se consulta
   su adeudo, **Entonces** el sistema muestra la diferencia entre el precio acordado de
   la membresía y la suma de pagos válidos, sin valores negativos.
2. **Dado** una membresía pagada en su totalidad, **Cuando** se consulta su adeudo,
   **Entonces** el saldo pendiente es cero.
3. **Dado** un cliente con pagos registrados, **Cuando** inicia sesión con rol cliente,
   **Entonces** solo ve sus propios pagos y su adeudo, y nunca los de otro cliente.
4. **Dado** un recepcionista, **Cuando** consulta el historial de pagos, **Entonces** ve
   los pagos registrados; la consulta global de adeudos está reservada al administrador
   (excepción E1 documentada en la matriz de permisos).
5. **Dado** un cliente sin pagos, **Cuando** consulta su información financiera,
   **Entonces** ve un estado vacío comprensible y su adeudo calculado.
6. **Dado** una membresía ya asignada con precio acordado, **Cuando** el administrador
   modifica el precio del tipo en el catálogo, **Entonces** el adeudo de esa membresía
   no cambia: el nuevo precio solo se aplica a nuevas asignaciones y renovaciones.

---

### Historia de usuario 7 - Registro de información facial (US-S2-07) (Prioridad: P3)

Como operador autorizado, quiero registrar la información facial de un cliente con su
autorización correspondiente para permitir su identificación en el control de acceso.

**Por qué esta prioridad**: es el habilitador directo de la validación de acceso y debe
existir antes de probar el kiosco; es testeable de forma aislada con un cliente
existente.

**Prueba independiente**: registrar la información facial de un cliente con autorización,
verificar que el registro queda único por cliente y que el dato biométrico jamás se
devuelve ni se muestra.

**Escenarios de aceptación**:

1. **Dado** un cliente existente con autorización documentada, **Cuando** el operador
   autorizado registra su información facial, **Entonces** el registro queda asociado
   únicamente a ese cliente y el sistema confirma la operación sin devolver el dato
   biométrico.
2. **Dado** un cliente que ya tiene registro facial, **Cuando** se vuelve a registrar,
   **Entonces** el registro se actualiza sin duplicarse.
3. **Dado** un cliente inexistente, **Cuando** se intenta registrar información facial,
   **Entonces** el sistema rechaza la operación.
4. **Dado** un registro facial creado, **Cuando** se revisan las respuestas de la
   interfaz y los registros del sistema, **Entonces** no aparece ninguna imagen ni el
   dato biométrico almacenado.
5. **Dado** el registro o modificación de información facial, **Cuando** se consulta la
   auditoría, **Entonces** aparece la acción sin ningún dato biométrico.

---

### Historia de usuario 8 - Validación de acceso (US-S2-08) (Prioridad: P2)

Como usuario del gimnasio, quiero que el sistema valide la identidad y la membresía del
cliente para determinar si puede ingresar.

**Por qué esta prioridad**: es el objetivo central del producto (control de acceso con
reconocimiento facial) y es testeable con datos preparados: cliente, membresía y registro
facial.

**Prueba independiente**: presentar el rostro de un cliente con membresía vigente y
verificar la autorización; presentar un rostro no registrado o un cliente con membresía
vencida y verificar el rechazo con su motivo, comprobando que todo intento queda
registrado.

**Escenarios de aceptación**:

1. **Dado** un cliente identificado con membresía vigente, **Cuando** se presenta en el
   punto de acceso, **Entonces** el sistema autoriza el ingreso y registra el intento.
2. **Dado** un cliente identificado sin membresía o con membresía vencida, suspendida o
   cancelada, **Cuando** se presenta en el punto de acceso, **Entonces** el sistema
   rechaza el ingreso con un motivo claro y registra el intento.
3. **Dado** un rostro no registrado, **Cuando** se presenta en el punto de acceso,
   **Entonces** el sistema no identifica al cliente, no autoriza el ingreso, muestra el
   mensaje para acudir a recepción y aplica el procedimiento alternativo (ver FR-030).
4. **Dado** un cliente con estado "activa" pero con la fecha de fin ya vencida,
   **Cuando** se presenta en el punto de acceso, **Entonces** el sistema lo rechaza por
   membresía vencida: la vigencia se decide por fechas y estado, no solo por el texto del
   estado.
5. **Dado** un fallo del dispositivo de captura o del reconocimiento, **Cuando** ocurre
   durante un intento, **Entonces** el sistema informa el fallo y nunca autoriza el
   ingreso automáticamente.
6. **Dado** un intento rechazado por rostro no identificado, **Cuando** una
   recepcionista autenticada verifica la identidad de la persona en el sistema y
   confirma que su membresía está vigente, **Entonces** puede registrar la autorización
   manual del ingreso y esta queda registrada con la usuaria responsable, fecha, hora,
   resultado y motivo.
7. **Dado** una persona cuya identidad no puede verificarse, o cuya membresía no está
   vigente, **Cuando** una recepcionista intenta registrar su autorización manual,
   **Entonces** el sistema no autoriza el ingreso y registra el rechazo con su motivo y
   la usuaria responsable.
8. **Dado** un entrenador o un cliente autenticado, **Cuando** intenta registrar una
   autorización manual de ingreso, **Entonces** el sistema deniega la operación.

---

### Historia de usuario 9 - Historial de accesos (US-S2-09) (Prioridad: P4)

Como administrador o recepcionista autorizado, quiero consultar los intentos de acceso
para conocer las entradas permitidas y rechazadas; como cliente, consultar los míos.

**Por qué esta prioridad**: da trazabilidad operativa del control de acceso y se prueba
sobre los intentos que ya deja el kiosco.

**Prueba independiente**: ejecutar intentos autorizados y rechazados y verificar que el
historial los muestra con fecha, hora, resultado y motivo, con filtros y permisos por
rol.

**Escenarios de aceptación**:

1. **Dado** intentos de acceso autorizados y rechazados registrados, **Cuando** el
   personal autorizado consulta el historial, **Entonces** ve cada intento con fecha,
   hora, resultado y motivo del rechazo cuando aplique.
2. **Dado** una autorización o un rechazo manual resuelto en recepción, **Cuando** se
   consulta el historial, **Entonces** el registro muestra al usuario responsable,
   fecha, hora, resultado y motivo, sin ningún dato biométrico.
3. **Dado** el historial con registros de varios días, **Cuando** se filtra por fecha o
   por cliente, **Entonces** la consulta devuelve solo los registros que cumplen el
   filtro.
4. **Dado** un cliente autenticado, **Cuando** consulta su historial, **Entonces** ve
   únicamente sus propios accesos.
5. **Dado** un entrenador autenticado, **Cuando** consulta el historial general,
   **Entonces** puede consultarlo mientras no exista la asignación de clientes del
   Sprint 3 (excepción E3 documentada).
6. **Dado** registros de acceso en el historial, **Cuando** se revisa la aplicación,
   **Entonces** no existe ninguna operación que los elimine ni los edite.

---

### Historia de usuario 10 - Rediseño de la zona autenticada y pantalla de inicio (US-S2-10) (Prioridad: P4)

Como usuario autenticado, quiero una interfaz con menú lateral izquierdo, páginas
independientes por módulo y una pantalla de inicio con bienvenida personalizada,
tarjetas de estadísticas e imágenes de gimnasio para operar el sistema de forma clara.

**Por qué esta prioridad**: es una mejora de experiencia confirmada por el usuario que
amplía el alcance del sprint; aunque mejora todo el producto, no bloquea las operaciones
del negocio, por lo que se prioriza al final.

**Prueba independiente**: iniciar sesión con cada rol y verificar el menú lateral con
solo las opciones de su rol, la pantalla de inicio con bienvenida y estadísticas, y que
las operaciones existentes siguen funcionando sin cambios.

**Escenarios de aceptación**:

1. **Dado** un usuario autenticado de cualquier rol, **Cuando** accede a la aplicación,
   **Entonces** ve un menú lateral izquierdo con las opciones disponibles para su rol y
   una página independiente por módulo.
2. **Dado** un usuario autenticado, **Cuando** accede a la pantalla de inicio,
   **Entonces** ve una bienvenida personalizada con su nombre, tarjetas de estadísticas
   relevantes a su rol con datos reales del sistema e imágenes de gimnasio, sin datos
   ficticios presentados como si fueran reales.
3. **Dado** el rediseño aplicado, **Cuando** se prueban las operaciones existentes
   (inicio de sesión, gestión de usuarios y clientes, membresías, pagos y accesos),
   **Entonces** siguen funcionando con el mismo comportamiento y mensajes.
4. **Dado** una pantalla de hasta 768 px, **Cuando** se navega la aplicación, **Entonces**
   el contenido se adapta sin desbordamientos horizontales.
5. **Dado** un usuario con preferencia de movimiento reducido activada, **Cuando** navega
   la aplicación, **Entonces** las animaciones se desactivan o reducen.

---

### Casos límite

- ¿Qué pasa cuando un tipo de membresía se desactiva mientras existen membresías
  activas que lo usan? Esas membresías siguen vigentes según sus fechas; el tipo solo
  deja de poder seleccionarse para nuevas asignaciones y renovaciones.
- ¿Qué pasa cuando se modifica el precio de un tipo con membresías ya asignadas? Las
  membresías existentes conservan su precio acordado y su cálculo de adeudos no cambia;
  el nuevo precio solo afecta nuevas asignaciones y renovaciones.
- ¿Qué pasa cuando un cliente no puede identificarse fehacientemente en recepción, o su
  membresía no está vigente? No se autoriza el ingreso manualmente y el rechazo queda
  registrado con su motivo y la usuaria responsable.
- ¿Qué pasa cuando un entrenador o un cliente intenta registrar una autorización manual
  de ingreso? El sistema deniega la operación por no tener el permiso requerido.
- ¿Qué pasa cuando un cliente tiene una membresía vencida y una nueva vigente? La
  decisión de acceso se toma con la membresía vigente; la vencida queda como historial.
- ¿Qué pasa cuando el estado dice "activa" pero la fecha de fin ya pasó? La membresía se
  trata como vencida y el acceso se rechaza.
- ¿Qué pasa cuando se renueva una membresía ya renovada? Se crea un nuevo periodo
  continuo sin solaparse con el anterior y sin duplicar la vigencia del cliente.
- ¿Qué pasa cuando se suspende una membresía ya suspendida o se reactiva una que no
  está suspendida? El sistema rechaza la transición con un mensaje claro.
- ¿Qué pasa cuando el importe de un pago es cero, negativo o no numérico? El sistema
  rechaza el registro y no modifica el historial.
- ¿Qué pasa cuando un pago excede el adeudo de la membresía? El pago se registra con su
  importe real y el adeudo resultante nunca es negativo.
- ¿Qué pasa cuando se repite un pago con el mismo identificador de operación? Solo se
  conserva un registro de esa operación (ver FR-017).
- ¿Qué pasa cuando un rostro no registrado se presenta en el punto de acceso? El
  sistema no autoriza, registra el intento como rechazado y aplica el procedimiento
  alternativo.
- ¿Qué pasa cuando se intenta registrar información facial de un cliente que ya tiene
  registro? Se actualiza el registro existente, sin duplicados.
- ¿Qué pasa cuando el dispositivo de captura no está disponible o entrega una entrada
  inválida? El sistema informa el fallo al operador y nunca autoriza el ingreso.
- ¿Qué pasa cuando se agotan los intentos consecutivos en el kiosco? Se muestra el
  mensaje para acudir a recepción y se bloquean nuevos intentos en esa sesión de
  kiosco hasta reiniciar.
- ¿Qué pasa cuando expira la sesión del personal en medio de una operación? Se exige
  reautenticarse (regla del Sprint 1, sin cambios).
- ¿Qué pasa cuando falla el registro de auditoría? La operación principal no se
  interrumpe, el fallo queda anotado en el log del servidor sin datos sensibles y
  NUNCA se autoriza un acceso por un fallo de auditoría.
- ¿Qué pasa cuando un cliente no tiene cuenta de usuario? Su ficha es operable por el
  personal autorizado; el portal del cliente simplemente no está disponible para él.
- ¿Qué pasa cuando el historial de accesos o los pagos están vacíos? La interfaz muestra
  estados vacíos comprensibles, no errores.

## Requisitos *(obligatorio)*

### Requisitos funcionales

**Tipos de membresía (US-S2-01)**

- **FR-001**: El sistema DEBE permitir crear, consultar, modificar y activar o
  desactivar tipos de membresía con nombre, descripción, duración, precio y estado.
- **FR-002**: La duración y el precio DEBEN ser valores positivos; el sistema DEBE
  rechazar valores no permitidos con mensajes comprensibles.
- **FR-003**: Un tipo de membresía desactivado NO DEBE poder seleccionarse para nuevas
  asignaciones ni para renovaciones, y las membresías existentes DEBEN conservar su
  referencia al tipo.
- **FR-004**: La escritura de tipos de membresía DEBE estar reservada al administrador;
  la consulta DEBE estar disponible para administrador y recepcionista, conforme a la
  matriz de permisos.
- **FR-005**: Cada membresía DEBE conservar el precio acordado al momento de su
  asignación o renovación; modificar el precio o la duración de un tipo del catálogo NO
  DEBE alterar las membresías ya asignadas ni sus adeudos, y solo afecta nuevas
  asignaciones y renovaciones.

**Membresías (US-S2-02, US-S2-03, US-S2-04)**

- **FR-006**: El sistema DEBE permitir asignar una membresía a un cliente válido con un
  tipo de membresía existente y activo.
- **FR-007**: Al asignar DEBEN registrarse la fecha de inicio, la fecha de fin
  calculada con la duración del tipo y el precio acordado de la membresía; el sistema
  DEBE rechazar fechas incoherentes.
- **FR-008**: El sistema DEBE impedir que un cliente tenga más de una membresía vigente
  al mismo tiempo, y esa garantía DEBE sostenerse aun ante operaciones simultáneas.
- **FR-009**: El sistema DEBE permitir consultar las membresías por cliente y por
  estado, distinguiendo al menos `activa`, `suspendida`, `vencida` y `cancelada`.
- **FR-010**: La vigencia DEBE determinarse con las fechas y el estado aplicables: una
  membresía con estado activo pero con la fecha de fin vencida NO DEBE considerarse
  vigente.
- **FR-011**: El sistema DEBE permitir renovar una membresía cerrando el periodo actual
  y creando el siguiente de forma continua (iniciando al día siguiente del fin anterior
  salvo indicación), usando un tipo activo, registrando en el nuevo periodo el precio
  acordado correspondiente (precio del tipo vigente al momento de la renovación) y
  conservando el historial.
- **FR-012**: El sistema DEBE permitir suspender una membresía activa, reactivar una
  suspendida y cancelar una membresía no cancelada, rechazando transiciones inválidas
  con mensajes claros.
- **FR-013**: Asignar, renovar, suspender, reactivar y cancelar membresías DEBEN quedar
  registradas en auditoría con actor y resultado.

**Pagos y adeudos (US-S2-05, US-S2-06)**

- **FR-014**: El sistema DEBE permitir registrar pagos de un cliente y, cuando
  corresponda, asociarlos a una membresía, guardando importe, fecha, método de pago y
  referencia o descripción cuando aplique.
- **FR-015**: El importe del pago DEBE ser positivo y las relaciones con el cliente y la
  membresía DEBEN existir; el sistema DEBE rechazar registros inválidos.
- **FR-016**: NO DEBE existir eliminación física de pagos: las correcciones o anulaciones
  DEBEN conservar el historial conforme a las reglas del negocio.
- **FR-017**: Cuando se proporcione un identificador de operación, el sistema DEBE
  impedir que la misma operación se registre accidentalmente más de una vez.
- **FR-018**: El sistema DEBE determinar el saldo pendiente (adeudo) de una membresía
  como la diferencia entre el precio acordado registrado en esa membresía y la suma de
  sus pagos válidos, sin admitir valores negativos; un cambio posterior del precio en el
  catálogo NO DEBE modificar los adeudos ya calculados con el precio acordado.
- **FR-019**: El administrador DEBE poder consultar el historial global de pagos y la
  consulta global de adeudos; el recepcionista DEBE poder consultar el historial de
  pagos, conforme a la matriz de permisos y a la excepción E1.
- **FR-020**: El cliente SOLO DEBE poder consultar sus propios pagos y su propio adeudo,
  y NUNCA los de otros clientes.

**Reconocimiento facial (US-S2-07)**

- **FR-021**: El sistema DEBE permitir registrar la información facial de un cliente
  existente previa solicitud y documentación de la autorización del cliente para el
  propósito de identificación y control de acceso.
- **FR-022**: Solo DEBE almacenarse la información facial necesaria para la
  identificación; NO DEBEN almacenarse imágenes.
- **FR-023**: Solo DEBE existir un registro facial por cliente; volver a registrar la
  información facial de un cliente DEBE actualizar el registro sin duplicarlo.
- **FR-024**: La información facial NUNCA DEBE devolverse en las respuestas de la
  interfaz con el cliente, mostrarse en pantallas generales ni incluirse en logs,
  errores o auditoría.
- **FR-025**: El registro y la modificación de información facial DEBEN quedar en
  auditoría con actor, acción y resultado, sin ningún dato biométrico.
- **FR-026**: El proyecto DEBE documentar la tecnología de reconocimiento facial
  seleccionada, sus requisitos de instalación y las limitaciones observadas en las
  pruebas; NO DEBE afirmarse precisión absoluta.

**Control de acceso (US-S2-08)**

- **FR-027**: El sistema DEBE identificar al cliente ANTES de evaluar su membresía.
- **FR-028**: El sistema DEBE autorizar el ingreso SOLO cuando el cliente haya sido
  identificado y su membresía esté vigente según fechas y estado; en cualquier otro
  caso DEBE rechazar el ingreso con un motivo claro del catálogo de motivos.
- **FR-029**: Un cliente sin membresía, o con membresía vencida, suspendida o
  cancelada, NO DEBE ser autorizado a ingresar.
- **FR-030**: El reconocimiento facial puede fallar y, en ese caso, el kiosco NO DEBE
  autorizar el acceso por sí mismo: se aplica el procedimiento alternativo aprobado, la
  autorización manual desde recepción. La autorización manual SOLO DEBE poder realizarla
  un recepcionista o un usuario con permiso explícito para esa acción, después de
  iniciar sesión. Antes de autorizar, DEBE verificar la identidad de la persona y
  confirmar que su membresía esté vigente; si la identidad no puede verificarse o la
  membresía no está vigente, NO DEBE autorizarse el acceso. Toda autorización o rechazo
  manual DEBE quedar registrado con el usuario responsable, fecha, hora, resultado y
  motivo, y el registro de acceso NO DEBE almacenar datos biométricos. El kiosco, cuando
  el rostro no se identifica, DEBE mostrar el mensaje «No se pudo identificar su rostro,
  acuda a recepción» y no ofrece ninguna vía de autorización propia.
- **FR-031**: Los fallos del dispositivo o del reconocimiento NO DEBEN provocar una
  autorización automática del ingreso.
- **FR-032**: El punto de acceso (kiosco) DEBE operar como terminal de identificación
  sin sesión previa, limitado exclusivamente a la operación de validación de acceso; el
  kiosco NO DEBE exponer consultas de clientes, pagos ni historiales (excepción E2
  documentada a la regla RN-001).
- **FR-033**: El punto de acceso DEBE limitar los intentos consecutivos sin identificar
  (3 intentos) y, al agotarlos, DEBE mostrar el mensaje para acudir a recepción y dejar
  de enviar intentos hasta reiniciar.
- **FR-034**: Cada intento de acceso, autorizado o rechazado, ya sea del kiosco o
  resuelto manualmente en recepción, DEBE registrarse con fecha, hora, resultado, motivo
  cuando aplique y el usuario responsable cuando corresponda; los registros NO DEBEN
  eliminarse ni editarse desde la aplicación y NO DEBEN almacenar datos biométricos.

**Historial de accesos (US-S2-09)**

- **FR-035**: El sistema DEBE permitir consultar el historial general de accesos con
  filtros por fecha y por cliente para administrador, recepcionista y entrenador,
  conforme a la excepción E3.
- **FR-036**: El cliente SOLO DEBE poder consultar su propio historial de accesos.

**Auditoría**

- **FR-037**: El sistema DEBE registrar en auditoría, como mínimo, los cambios de tipos
  de membresía, las asignaciones y renovaciones de membresías, los cambios de estado de
  membresías, el registro o corrección de pagos, el registro o modificación de
  información facial y los resultados de acceso, con actor, acción, entidad afectada,
  fecha, hora y resultado cuando corresponda.
- **FR-038**: La auditoría DEBE consultarse únicamente por el administrador y NO DEBE
  ofrecer operaciones de edición ni de eliminación.
- **FR-039**: La auditoría y los logs NO DEBEN incluir contraseñas, tokens, secretos ni
  información biométrica.
- **FR-040**: Un fallo al registrar auditoría NO DEBE interrumpir la operación
  principal, DEBE quedar anotado en el log del servidor sin datos sensibles y NUNCA
  DEBE derivar en una autorización de acceso.

**Interfaz: rediseño y pantalla de inicio (US-S2-10)**

- **FR-041**: La zona autenticada DEBE usar un menú lateral izquierdo con las opciones
  permitidas para el rol y una página independiente por módulo, sin duplicar pantallas
  ni componentes reutilizables.
- **FR-042**: El sistema DEBE presentar una pantalla de inicio con bienvenida
  personalizada, tarjetas de estadísticas relevantes al rol con datos reales del
  sistema e imágenes decorativas relacionadas con gimnasios, sin presentar información
  ficticia como si proviniera del sistema.
- **FR-043**: El rediseño NO DEBE modificar las rutas, validaciones, llamadas a la
  interfaz de servicios, el almacenamiento de sesión, los tokens ni el manejo de
  errores existentes; la lógica operativa DEBE permanecer intacta.
- **FR-044**: La interfaz DEBE seguir la estética oscura con acento naranja definida
  para el proyecto, DEBE presentar estados vacíos, mensajes de error y confirmaciones de
  operaciones importantes, DEBE adaptarse a pantallas de hasta 768 px sin
  desbordamientos y DEBE respetar la preferencia de movimiento reducido.
- **FR-045**: El menú DEBE mostrar solo las opciones disponibles para el rol como ayuda
  visual; la autorización real DEBE resolverse en el servidor.

**Pruebas**

- **FR-046**: El sprint DEBE cubrir con pruebas los casos exitosos, los errores de
  validación, los permisos por rol y los accesos no autorizados de cada módulo.
- **FR-047**: Las pruebas de reconocimiento facial DEBEN cubrir la identificación
  correcta, el rostro no identificado y las condiciones documentadas de prueba, y NO
  DEBEN sostener afirmaciones de precisión absoluta.
- **FR-048**: Las pruebas automatizadas DEBEN ejecutarse contra un entorno de datos de
  prueba separado y NO DEBEN afectar ni depender de los datos de operación del gimnasio.

### Reglas de negocio

- **RN-001**: Las operaciones requieren una sesión válida y permisos suficientes (con
  la excepción E2 documentada para el kiosco del punto de acceso).
- **RN-002**: Una membresía debe estar asociada a un cliente y un tipo de membresía
  existentes.
- **RN-003**: No se debe asignar una nueva membresía con un tipo desactivado.
- **RN-004**: La vigencia se valida usando las fechas y el estado aplicables.
- **RN-005**: Los pagos deben guardar importes válidos y relacionarse con los registros
  correspondientes.
- **RN-006**: El saldo pendiente debe calcularse de forma consistente con el precio
  acordado registrado en cada membresía, los pagos válidos aplicados y las reglas del
  modelo.
- **RN-007**: No se debe permitir acceso si el cliente no puede ser identificado de
  forma suficiente, si no tiene una membresía válida o si la membresía está
  vencida o inactiva.
- **RN-008**: Cada intento de acceso debe dejar un registro del resultado, tanto si se
  acepta como si se rechaza.
- **RN-009**: La información facial solo puede registrarse y utilizarse con la
  autorización correspondiente y para el propósito de identificación definido.
- **RN-010**: No guardar datos biométricos en logs de aplicación o auditoría.
- **RN-011**: No exponer datos de pagos, membresías o accesos de clientes a otros
  clientes.
- **RN-012**: Las operaciones que actualicen varios registros relacionados deben usar
  transacciones cuando corresponda.
- **RN-013**: Las acciones financieras y de acceso relevantes deben dejar trazabilidad.
- **RN-014**: Las fallas del dispositivo o del reconocimiento no deben provocar una
  autorización automática.
- **RN-015**: Un cliente solo puede tener una membresía vigente al mismo tiempo (regla
  adoptada del comportamiento consolidado del sistema).
- **RN-016**: Cada membresía conserva el precio acordado registrado al asignarse o
  renovarse; un cambio posterior del precio en el catálogo solo afecta nuevas
  asignaciones y renovaciones, nunca las membresías existentes ni sus adeudos.
- **RN-017**: Una autorización manual de ingreso solo puede realizarla un recepcionista
  o un usuario con permiso explícito, después de iniciar sesión y de verificar la
  identidad de la persona y la vigencia de su membresía; si la identidad no se verifica
  o la membresía no está vigente, no se autoriza. Toda autorización o rechazo manual
  queda registrado con el usuario responsable, fecha, hora, resultado y motivo, y el
  registro no contiene datos biométricos.

### Permisos por rol

La matriz rige el sprint completo; toda excepción está documentada a continuación:

| Operación | Administrador | Recepcionista | Entrenador | Cliente |
|---|---|---|---|---|
| Gestionar tipos de membresía (crear, modificar, activar/desactivar) | Sí | No | No | No |
| Consultar tipos de membresía | Sí | Sí | No | No |
| Asignar membresías | Sí | Sí | No | No |
| Renovar membresías | Sí | Sí | No | No |
| Suspender, reactivar o cancelar membresías | Sí | No | No | No |
| Consultar membresías | Sí | Sí | Sí | No (E4) |
| Registrar pagos | Sí | Sí | No | No |
| Autorizar ingreso manualmente en recepción (tras verificar identidad y vigencia) | Sí | Sí | No | No |
| Consultar historial de pagos | Sí | Sí | No | Solo los propios |
| Consultar adeudos (visión global) | Sí | No (E1) | No | — |
| Consultar adeudo propio | Sí, si aplica | Sí, si aplica | No | Sí |
| Registrar información facial | Sí | Sí | No | No |
| Usar el punto de acceso (validación de ingreso) | No requiere sesión (E2) | No requiere sesión (E2) | No requiere sesión (E2) | No requiere sesión (E2) |
| Consultar historial general de accesos | Sí | Sí | Sí (E3) | No |
| Consultar historial propio de accesos | Sí, si aplica | Sí, si aplica | Sí, si aplica | Sí |
| Consultar auditoría | Sí | No | No | No |

Excepciones documentadas (previstas por la matriz inicial de `docs/sprint-2.md`, que
permite documentar excepciones explícitas):

- **E1 — Consulta global de adeudos reservada al administrador**: aunque la matriz
  inicial permite al recepcionista consultar pagos y adeudos, la consulta global de
  adeudos queda reservada al administrador. El recepcionista consulta el historial de
  pagos y opera los cobros; el cliente consulta su propio adeudo. Se alinea con el
  comportamiento consolidado del sistema, ya probado.
- **E2 — Punto de acceso sin sesión previa**: el kiosco es una terminal física de
  identificación usada por personas sin cuenta; su operación se limita exclusivamente a
  la validación de acceso y no expone otra información. Es una excepción explícita a
  RN-001, alineada con el comportamiento consolidado del sistema.
- **E3 — Historial de accesos para el entrenador**: mientras no exista la asignación de
  clientes (Sprint 3), el entrenador puede consultar el historial general de accesos.
  Cuando exista la asignación, la consulta DEBE restringirse a sus clientes asignados.
- **E4 — Consulta de membresías por el cliente**: la matriz inicial de este spec
  contemplaba «solo la propia», pero en este sprint el cliente no dispone de una vista
  para consultar sus membresías; su vigencia se refleja en su adeudo propio, en sus
  pagos y accesos propios y en la decisión de ingreso del kiosco. Se alinea con el
  comportamiento consolidado del sistema (mismo criterio que E1); la consulta propia de
  membresías se incorporará cuando exista una vista de cliente que la requiera
  (revisar en Sprint 3).

### Entidades clave

- **Tipo de membresía**: define un plan del gimnasio (nombre, descripción, duración en
  días, precio y estado activo/inactivo). Referenciada por las membresías existentes.
- **Membresía**: vincula a un cliente con un tipo de membresía para un periodo
  (fecha de inicio, fecha de fin, precio acordado al momento de la asignación o
  renovación y estado). Un cliente puede tener varias membresías en el historial, pero
  como máximo una vigente.
- **Pago**: registro financiero de un cobro, con importe, fecha, método de pago y
  referencia cuando aplique; asociado a un cliente y, cuando corresponda, a una
  membresía. No se elimina físicamente.
- **Rostro (registro facial)**: representación facial necesaria para identificar a un
  cliente, única por cliente, asociada a la autorización documentada del cliente. No se
  almacenan imágenes y el dato nunca se devuelve.
- **Acceso**: resultado de un intento de ingreso (fecha, hora, resultado autorizado o
  rechazado, motivo cuando aplique, cliente identificado o nulo, origen de la decisión
  —kiosco o autorización manual— y usuario responsable cuando corresponda). Registros
  permanentes y sin datos biométricos.
- **Auditoría**: rastro de acciones relevantes (actor cuando corresponda, acción,
  módulo, entidad afectada, fecha, hora y resultado). No editable ni eliminable desde la
  aplicación.

Se reutilizan las entidades `usuarios` y `clientes` del Sprint 1 sin duplicarlas ni
modificar su significado.

### Modelo de datos y cambios de esquema pendientes

El modelo completo, con el estado exacto del esquema consolidado y los campos que cada
decisión de este spec exige, está en `data-model.md`. Resumen de lo que el modelo debe
identificar explícitamente:

- **Precio acordado**: `membresias.precio_acordado DECIMAL(10,2) NOT NULL` almacena el
  precio acordado de cada membresía; es el precio que usan FR-007, FR-011 y FR-018. El
  precio de `tipos_membresia` es solo el precio de referencia para nuevas asignaciones
  y renovaciones.
- **Autorización manual**: `accesos.id_usuario` (nullable, referencia a `usuarios`)
  guarda la persona responsable de la autorización o rechazo manual, y
  `accesos.origen ENUM('kiosco','manual')` distingue el intento automático del
  resuelto en recepción. El resultado y el motivo ya existen
  (`accesos.resultado`, `accesos.motivo_rechazo`), y la tabla no almacena datos
  biométricos.

Los campos marcados como inexistentes se agregarán mediante **migraciones correctivas
nuevas** durante la implementación, sin editar ni ejecutar las migraciones existentes
(001–003) y sin tocar la base en operación; `data-model.md` detalla su contenido y el
backfill de los registros existentes.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **SC-001**: El personal autorizado puede crear un tipo de membresía, asignarlo a un
  cliente y registrar un pago en menos de 3 minutos por operación, sin ayuda del
  desarrollador.
- **SC-002**: El 100% de los intentos de acceso quedan registrados con resultado y,
  cuando es rechazado, con su motivo; los resueltos manualmente en recepción incluyen
  además el usuario responsable.
- **SC-003**: El 100% de las operaciones restringidas por rol que se prueban (por cada
  rol sin permiso) son denegadas por el servidor, no solo ocultas en la interfaz.
- **SC-004**: Cero exposiciones de información facial en las respuestas de la interfaz
  con el cliente, en pantallas generales y en los logs y auditoría revisados.
- **SC-005**: Cero operaciones de eliminación física de pagos, accesos o registros de
  auditoría disponibles en la aplicación.
- **SC-006**: En las pruebas documentadas con las condiciones acordadas (buena
  iluminación y rostros registrados), el sistema identifica al cliente en al menos el
  90% de los intentos de prueba y autoriza el ingreso en cero casos cuando el rostro no
  fue identificado.
- **SC-007**: El 100% de los usuarios autenticados ve su pantalla de inicio con
  bienvenida personalizada y estadísticas al iniciar sesión, sin pasos adicionales.
- **SC-008**: Todas las pruebas automatizadas del sprint se ejecutan sin fallos antes
  de declarar cerrado el sprint.
- **SC-009**: El 100% de los flujos financieros y de acceso probados (tipos, membresías,
  pagos, rostro y accesos, incluidas las autorizaciones manuales) genera su registro de
  auditoría con actor, entidad y resultado.
- **SC-010**: El 100% de las membresías registradas conserva su precio acordado en el
  nuevo campo y sus adeudos no cambian cuando se modifica el precio del catálogo; un
  cambio de precio solo se refleja en nuevas asignaciones y renovaciones.
- **SC-011**: El 100% de las autorizaciones y rechazos manuales registrados en
  recepción incluye usuario responsable, fecha, hora, resultado y motivo, y ninguno
  contiene datos biométricos.

## Supuestos

- **Reutilización, sin duplicar el Sprint 1**: la autenticación, usuarios, roles,
  clientes y su portal propio del Sprint 1 se reutilizan sin cambios; este sprint
  amplía el sistema, no lo rehace.
- **Estado de lo existente**: los módulos consolidados de tipos de membresía,
  membresías, pagos, adeudos, registro facial, identificación, punto de acceso,
  historial de accesos y auditoría ya existen en el repositorio y se conservan tal
  cual; la especificación fija su comportamiento requerido.
- **Cambios realmente pendientes**: (a) la protección contra registros duplicados de una
  misma operación de pago (FR-017); (b) la documentación de la tecnología facial y sus
  limitaciones (FR-026); (c) el rediseño de la zona autenticada y la pantalla de inicio
  (FR-041 a FR-045); (d) el refinamiento de la excepción E3 cuando el Sprint 3 introduzca
  la asignación de clientes; (e) las migraciones correctivas nuevas y sus ajustes de
  servicio para el precio acordado de la membresía, el registro de la autorización
  manual en recepción y la protección de pagos duplicados (ver «Modelo de datos y
  cambios de esquema pendientes» y `data-model.md`).
- **Alcance ampliado confirmado por el usuario**: el dashboard de inicio y el rediseño
  de la interfaz (menú lateral, páginas independientes, bienvenida, tarjetas de
  estadísticas e imágenes de gimnasio) quedan incluidos en el Sprint 2 por decisión
  confirmada del usuario, aunque `docs/sprint-2.md` §10 los reservaba para el Sprint 3.
  Queda documentada así la ampliación de alcance exigida por la constitución. Los
  reportes consolidados avanzados y su configuración siguen siendo alcance del Sprint 3.
- **Numeración de requisitos**: esta especificación usa su propia numeración FR, RN y
  SC secuencial. Comentarios del código existente pueden citar una numeración anterior
  de otra versión de la especificación; la reconciliación de esas referencias se
  realizará durante la fase de planificación y tareas, sin modificar migraciones ya
  ejecutadas.
- **Renovación**: el nuevo periodo de una renovación inicia al día siguiente del fin
  del periodo anterior (salvo indicación distinta) y exige un tipo de membresía activo.
- **Estados de membresía**: suspender solo procede desde `activa`, reactivar desde
  `suspendida` y cancelar desde cualquier estado no cancelado.
- **Historial de accesos**: el sistema registra intentos de ingreso; el registro de
  salidas queda fuera porque no existe un proceso de egreso ni equipo de torniquete
  definido. Este alcance quedó descrito así en `docs/project-context.md` durante la
  fase de pulido (T070).
- **Auditoría**: la consulta de auditoría se realiza por el administrador; no se exige
  una pantalla específica de auditoría en este sprint.
- **Entorno de datos**: la base de datos del gimnasio en operación no se modifica ni se
  reinicia durante el desarrollo de este sprint; las pruebas usan un entorno de datos
  de prueba separado (FR-048).
- **Reconocimiento facial**: no se afirma precisión absoluta; la tecnología elegida se
  documenta con sus limitaciones y las pruebas se reportan con sus condiciones.

## Preguntas abiertas

- Ninguna. Las dos decisiones abiertas quedaron resueltas y aplicadas el 2026-10-15:
  (1) el procedimiento alternativo de acceso (FR-030), opción A: el kiosco rechaza y
  dirige a recepción, donde una recepcionista o un usuario con permiso explícito
  autoriza manualmente tras verificar identidad y vigencia, con registro del usuario
  responsable; (2) el precio acordado de la membresía (FR-005, FR-007, FR-011, FR-018),
  con los cambios de esquema pendientes documentados en `data-model.md`. El spec queda
  sin marcadores pendientes.

## Fuera de alcance

- Rutinas, ejercicios, objetivos de entrenamiento y seguimiento del progreso (Sprint 3).
- Asignación de entrenadores a clientes y el refinamiento de permisos que trae consigo
  (Sprint 3).
- Reportes consolidados avanzados del dashboard y su configuración (Sprint 3).
- Pasarelas de pago, pagos bancarios integrados y facturación electrónica.
- Aplicación móvil, múltiples sucursales y equipo físico de torniquete industrial.
- Vigilancia continua o seguimiento de clientes fuera de las operaciones de acceso.
- Registro de salidas (egresos) de clientes.
- Registro público de cuentas y recuperación de contraseña por correo.
- Creación de un rol `auditor` (la auditoría es una funcionalidad interna).
