<!--
Sync Impact Report
==================
- Cambio de versión: (inicial) → 1.0.0
  - Razon: ratificación inicial de la constitución a partir de la plantilla activa
    y del documento de reglas del proyecto (docs/reglas.md).
- Principios modificados: N/A (primera versión).
  Principios creados:
  - I. Arquitectura por capas con API REST → I. Arquitectura por capas con API REST (nuevo)
  - II. El backend como única autoridad → II. El backend como única autoridad (nuevo)
  - III. Persistencia migrable y auditable → III. Persistencia migrable y auditable (nuevo)
  - IV. Seguridad y privacidad de datos sensibles → IV. Seguridad y privacidad de datos sensibles (nuevo)
  - V. Alcance estricto y pruebas obligatorias → V. Alcance estricto y pruebas obligatorias (nuevo)
- Secciones añadidas:
  - Restricciones técnicas de implementación
  - Proceso de desarrollo, alcance y experiencia de usuario
  - Governance (versión inicial con reglas de enmienda)
- Secciones eliminadas: ninguna (primera versión).
- Ítems diferidos / TODOs: ninguno. Todos los marcadores de la plantilla fueron
  sustituidos por contenido concreto.
-->

# Constitución del Proyecto gymAccess

## Principios fundamentales

### I. Arquitectura por capas con API REST

El sistema mantiene separados `frontend/`, `backend/` y `database/`. El frontend se
construye con React y JavaScript; el backend, con Node.js, Express y JavaScript; y
MySQL es la base de datos del proyecto.

- El frontend NO DEBE conectarse directamente a MySQL: toda comunicación con los
  datos ocurre a través de la API REST.
- El backend será el único componente que se comunica con MySQL.
- No se introducirán tecnologías o servicios externos sin justificar su necesidad y
  documentar el cambio antes de adoptarlos.

Racional: la separación de capas hace verificable dónde se aplican las reglas de
negocio y reduce la superficie de exposición de la base de datos.

### II. El backend como única autoridad de validación y autorización

El backend DEBE validar todos los datos recibidos, aplicar las reglas de negocio,
autenticar y autorizar cada solicitud, incluso cuando el frontend ya haya validado.

- El rol y los permisos DEBEN obtenerse de la sesión validada y de la información
  persistida; NUNCA se confía en el rol o en identificadores de propietario enviados
  por el frontend sin autorización y validación explícitas.
- El backend DEBE comprobar el rol y, cuando corresponda, la relación del usuario con
  el recurso solicitado.
- Ocultar opciones en la interfaz es solo una ayuda visual; la autorización real
  DEBE resolverse en el backend.

Racional: cualquier control que dependa del cliente es bypasable; la validación en
servidor es la única garantía comprobable de autorización.

### III. Persistencia migrable y auditable en MySQL

MySQL es la fuente de persistencia. Los cambios de estructura se implementan
exclusivamente mediante scripts de migración versionados dentro de `database/`.

- Cada migración DEBE tener nombre claro, orden definido y registro en la tabla de
  migraciones del sistema.
- Una migración ya ejecutada en un entorno compartido NO DEBE modificarse: se crea
  una nueva migración correctiva.
- El modelo DEBE usar claves primarias, claves foráneas, restricciones únicas y
  `NOT NULL` cuando correspondan, e índices para las consultas frecuentes.
- NO DEBE almacenarse información derivada que pueda obtenerse de forma fiable por
  consulta, salvo razón documentada.
- NO DEBEN borrarse físicamente usuarios, clientes, pagos, accesos o registros de
  auditoría que deban conservarse: se usan estados o mecanismos de conservación.
- Las operaciones que deban completarse juntas DEBEN ejecutarse en transacciones.
- Los registros de auditoría relevantes DEBEN quedar escritos y NO DEBEN ser
  editables por los roles operativos mediante las funciones normales de la app.

### IV. Seguridad y privacidad de datos sensibles

Las contraseñas se almacenan únicamente como hashes seguros con bcrypt y NUNCA se
devuelven en respuestas de la API. La autenticación usa JWT con expiración de 8 horas.

- Tras 5 intentos consecutivos fallidos, el inicio de sesión se bloquea 15 minutos.
- Ante credenciales incorrectas se responde siempre con el mensaje genérico
  `correo o contraseña incorrectos`.
- Los usuarios inactivos NO PUEDEN iniciar sesión y la sesión se reautentica cuando
  el token expira.
- Los correos se normalizan (sin espacios extremos, comparación sin distinguir
  mayúsculas/minúsculas).
- La información facial se trata como dato sensible: se limita su acceso, se
  solicita y documenta la autorización antes de registrarla, no se expone en
  respuestas generales ni en logs, y no se guardan biométricos innecesarios.
- Los logs y la auditoría NO DEBEN incluir contraseñas, JWT, secretos ni datos
  biométricos.
- No se permite registro público de cuentas ni recuperación por correo dentro del
  alcance actual.

Racional: credenciales y biometría son datos de alto impacto; su exposición es
irreversible, por lo que las reglas son de cumplimiento obligatorio y verificable.

### V. Alcance estricto y pruebas obligatorias

Antes de implementar un sprint se leen `docs/project-context.md`, `docs/reglas.md`
y el documento de entrada del sprint correspondiente. Solo se implementan las tareas
del sprint activo, respetando las dependencias de sprints anteriores.

- NO SE DEBE ampliar el alcance de un sprint sin documentar y aprobar el cambio.
- NO DEBE afirmarse que una función está terminada si no se ha probado; las pruebas
  cubren casos exitosos, errores de validación, permisos y accesos no autorizados.
- Ante una contradicción entre documentos, la decisión afectada se detiene y se
  señala antes de elegir una interpretación.
- NO DEBE sobrescribirse ni eliminarse trabajo existente sin revisar su propósito y
  sus dependencias.
- La documentación DEBE mantenerse alineada con el comportamiento implementado.

Racional: en un proyecto académico por sprints, la deriva de alcance y las
afirmaciones sin prueba son las principales fuentes de retrabajo.

## Restricciones técnicas de implementación

### Módulos JavaScript

1. El backend utilizará exclusivamente ES Modules: `import` y `export`.
2. NO se usará `require()` ni `module.exports`.
3. `backend/package.json` DEBE incluir `"type": "module"`.
4. Se respeta la estructura modular existente y NO se duplica lógica de negocio en
   rutas distintas.

### Validación y manejo de errores

1. El backend valida los datos recibidos siempre, rechaza identificadores
   inexistentes y relaciones inválidas.
2. Se usan códigos HTTP apropiados y mensajes comprensibles, sin exponer consultas
   SQL, trazas, secretos ni detalles internos.
3. NO se aceptan directamente del cliente campos que permitan elevar privilegios
   (rol, estado privilegiado, identificadores de propietario) sin autorización y
   validación explícitas.
4. La inyección SQL se evita con consultas parametrizadas o mecanismos equivalentes
   seguros.
5. Los errores se manejan de forma consistente y se registra información técnica sin
   contraseñas, tokens ni datos biométricos.

### Roles y autorización

Los únicos roles iniciales son `administrador`, `recepcionista`, `entrenador` y
`cliente`. NO se creará un rol `auditor`: la auditoría es una funcionalidad interna.

1. El administrador gestiona usuarios y roles, sin poder desactivar ni cambiar el
   rol del único administrador activo.
2. El recepcionista opera sobre clientes, membresías y pagos dentro de los permisos
   definidos para cada sprint; NO administra roles ni edita rutinas o progresos.
3. El entrenador gestiona rutinas, objetivos y progreso únicamente de clientes que
   tenga asignados.
4. El cliente solo consulta su propia información y NO la modifica desde el portal;
   su cuenta DEBE estar vinculada a un registro de `clientes`.
5. NO se confía en el rol enviado por el frontend: se obtiene de la sesión validada
   y de la información persistida.

### Reconocimiento facial y decisiones de acceso

1. Si no es posible identificar de forma confiable al cliente, NO se autoriza el
   acceso automáticamente: se aplica el procedimiento alternativo definido para la
   demostración.
2. La decisión de acceso DEBE comprobar también la vigencia y el estado de la
   membresía.
3. Se registra el resultado de las verificaciones de acceso sin guardar
   información biométrica innecesaria.
4. Se documentan las condiciones y limitaciones de las pruebas de reconocimiento
   facial; NO se afirma precisión absoluta.

### Membresías, pagos y accesos

1. Los tipos de membresía tienen nombre, duración, precio y estado claros.
2. Una membresía se relaciona con un cliente y un tipo de membresía válidos.
3. El estado de vigencia se determina con las fechas y reglas del negocio, no solo
   con el texto del estado guardado.
4. Los pagos se relacionan con un cliente y, cuando corresponda, con una membresía;
   NO se registran pagos ficticios como si fueran transacciones reales.
5. Una membresía vencida o inactiva NO autoriza el acceso.
6. Los accesos aceptados y rechazados quedan registrados conforme al modelo.
7. La validación de acceso, la consulta de membresía y el registro del resultado se
   ejecutan de manera coherente para evitar decisiones contradictorias.

### Entrenadores y rutinas

1. Cada entrenador DEBE estar asociado a un usuario válido con rol `entrenador`.
2. Un cliente tendrá como máximo un entrenador principal asignado durante un
   periodo activo, según la especificación del Sprint 3.
3. Las rutinas se asocian a un cliente y un entrenador válidos, y el entrenador
   solo crea, modifica o consulta rutinas de clientes asignados.
4. El cliente solo consulta sus propias rutinas y su propio progreso.
5. Los cambios de rutina, objetivos y progreso conservan historial suficiente para
   comparar la evolución.
6. Los campos de ejercicios, series, repeticiones, peso recomendado, descanso e
   instrucciones DEBEN validarse.
7. El sistema NO presenta información de seguimiento deportivo como diagnóstico
   médico.

### Auditoría y registros

1. Se registran las acciones relevantes indicadas en las especificaciones: cambios
   de usuarios, asignaciones, operaciones de membresías y pagos, resultados de
   acceso y cambios de rutinas/progreso.
2. Cuando corresponda, el registro incluye actor, acción, fecha/hora, entidad
   afectada y resultado.
3. NO se guardan contraseñas, JWT, secretos ni información biométrica en auditoría.
4. Los registros de auditoría NO son editables por los roles operativos mediante
   las funciones normales de la aplicación.

### Diseño visual, responsividad y animaciones

1. La pantalla de inicio de sesión seguirá la estética Dark Fitness & Warm Orange
   Accent, minimalista y de bajo ruido visual.
2. En escritorio, el login usa distribución dividida 50/50: hero a la izquierda y
   formulario a la derecha; el contenedor ocupa como mínimo el alto de la ventana y
   evita desbordamientos horizontales.
3. La paleta base es fondo `#0a0b0e`, fondo del formulario `#0f1117` y naranja de
   acento `#f05a24`.
4. El panel izquierdo incluye marca, título, tarjeta compacta de reconocimiento
   facial con estado visual y puntos indicadores decorativos; la tarjeta es una
   demostración visual y NO presenta información ficticia como si proviniera del
   backend.
5. El formulario incluye correo, contraseña, control para mostrar/ocultar
   contraseña, botón principal con flecha y enlace de soporte/contacto.
6. En pantallas de hasta 768 px se oculta el panel hero y el formulario se centra
   a pantalla completa.
7. Los inputs DEBEN tener etiquetas accesibles, estados de foco visibles, mensajes
   de validación legibles y contraste suficiente.
8. Las animaciones son sutiles y breves; NO se animan de forma continua elementos
   que distraigan, NO se usan para ocultar errores ni para retrasar el envío del
   formulario, y se respeta `prefers-reduced-motion`.
9. Rediseñar el frontend NO autoriza modificar la autenticación, las llamadas al
   backend, los nombres de campos, el almacenamiento de sesión, los tokens ni el
   manejo de errores: la lógica existente DEBE permanecer operativa.
10. El estado “Acceso autorizado” NO se muestra como resultado real de
    reconocimiento facial durante el login si no proviene de una operación real;
    en el hero se usa exclusivamente como elemento demostrativo del diseño.

## Proceso de desarrollo, alcance y experiencia de usuario

### Interfaz y experiencia de usuario

1. Se muestran las opciones disponibles según el rol; la ocultación es solo ayuda de
   interfaz y la autorización real se hace en backend.
2. Se presentan estados vacíos, errores de validación y confirmaciones de
   operaciones importantes.
3. NO se duplican pantallas o componentes reutilizables.
4. Los nombres de campos y conceptos son consistentes entre interfaz, API y
   documentación.

### Alcance excluido

No se implementa sin aprobación explícita:

- Aplicación móvil o múltiples sucursales.
- Nómina, inventario, contabilidad completa o facturación electrónica.
- Pagos bancarios integrados.
- Registro público de cuentas o recuperación de contraseña por correo.
- Clases grupales, reservación de clases o asistencia compleja a sesiones.
- Vigilancia continua o seguimiento fuera de las operaciones explícitas del
  sistema.

## Governance

- Esta constitución prevalece sobre otras prácticas del proyecto: ante conflicto
  entre documentos, se detiene la decisión afectada y se señala la contradicción
  antes de aplicar una interpretación.
- Toda modificación DEBE documentarse como una enmienda, incrementar el número de
  versión según semántica de versiones (MAJOR: eliminación o redefinición
  incompatible de principios; MINOR: principio o sección nueva o expansión
  material; PATCH: aclaraciones y correcciones de redacción) y actualizar la fecha
  de última enmienda.
- Las revisiones de cumplimiento se realizan en cada revisión de sprint: cada PR o
  revisión DEBE verificar el cumplimiento de los principios aplicables antes de
  aprobarse.
- `docs/reglas.md` y `docs/project-context.md` son guía de desarrollo en tiempo de
  ejecución; si su contenido contradice esta constitución, prevalece la
  constitución y la contradicción DEBE escalarse para su resolución documentada.

**Version**: 1.0.0 | **Ratified**: 2026-10-07 | **Last Amended**: 2026-10-14
