<!--
Documento de entrada para /speckit.specify.
No guardar este archivo dentro de la carpeta specs/ generada por Spec Kit.
-->

# Insumo de especificación - Sprint 2: Membresías, pagos, reconocimiento facial y accesos

> **Referencias obligatorias para el agente:**
>
> - Contexto maestro: `docs/project-context.md`
> - Constitución técnica: `docs/reglas.md`
> - Sprint 1: `docs/sprint-1.md`
> - Este documento describe únicamente el alcance del Sprint 2.

## 1. Contexto

El Sprint 2 ampliará la base funcional entregada en Sprint 1 para cubrir las operaciones centrales del gimnasio: catálogo y asignación de membresías, registro de pagos, consulta de adeudos, identificación facial y control de acceso. También incorporará auditoría para las operaciones relevantes de membresías, pagos y accesos.

Se debe reutilizar la autenticación, los usuarios, los roles y los clientes ya implementados. No se debe rehacer Sprint 1.

## 2. Objetivo

Permitir que el personal autorizado administre las membresías y los pagos de los clientes, y que el sistema pueda decidir si un cliente puede ingresar según su identificación y las condiciones de su membresía, registrando el resultado de cada intento de acceso.

## 3. Historias de usuario

### US-S2-01 — Gestión de tipos de membresía

Como administrador, quiero crear, consultar, modificar y activar o desactivar tipos de membresía para definir las opciones disponibles en el gimnasio.

### US-S2-02 — Asignación de membresía

Como administrador o recepcionista autorizado, quiero asignar una membresía a un cliente para registrar su periodo de vigencia y condiciones.

### US-S2-03 — Consulta de membresía

Como personal autorizado, quiero consultar el estado y las fechas de una membresía para saber si está vigente.

### US-S2-04 — Renovación de membresía

Como administrador o recepcionista autorizado, quiero renovar una membresía para mantener actualizado el periodo de servicio del cliente.

### US-S2-05 — Registro de pago

Como recepcionista o administrador autorizado, quiero registrar los pagos de un cliente para conservar el historial financiero del gimnasio.

### US-S2-06 — Consulta de pagos y adeudos

Como usuario autorizado, quiero consultar los pagos registrados y el saldo pendiente de un cliente para dar seguimiento a su situación.

### US-S2-07 — Registro de información facial

Como operador autorizado, quiero registrar la información facial de un cliente con la autorización correspondiente para permitir su identificación en el control de acceso.

### US-S2-08 — Validación de acceso

Como usuario del gimnasio, quiero que el sistema valide la identidad y la membresía del cliente para determinar si puede ingresar.

### US-S2-09 — Historial de accesos

Como administrador o recepcionista autorizado, quiero consultar los intentos de acceso para conocer las entradas permitidas y rechazadas.

## 4. Alcance funcional

### 4.1 Tipos de membresía

- Crear, consultar y modificar tipos de membresía.
- Definir nombre, descripción, duración, precio y estado.
- Activar o desactivar tipos de membresía.
- Impedir que un tipo inactivo se seleccione para nuevas asignaciones.
- Mantener las referencias necesarias para las membresías existentes.

### 4.2 Membresías

- Asignar un tipo de membresía a un cliente válido.
- Registrar fechas de inicio y fin.
- Consultar membresías por cliente y estado.
- Renovar una membresía conforme a las reglas de fechas definidas.
- Distinguir membresías vigentes, vencidas, inactivas o canceladas cuando corresponda al modelo.
- Validar las fechas y relaciones antes de guardar.
- Conservar historial suficiente para consultar membresías anteriores.

La fecha de vigencia y el estado deben interpretarse de manera coherente. No debe autorizarse el acceso únicamente porque un campo de estado diga “activa” si las fechas ya vencieron.

### 4.3 Pagos y adeudos

- Registrar pagos asociados a un cliente y, cuando corresponda, a una membresía.
- Guardar importe, fecha, método de pago y referencia/descripción cuando aplique.
- Consultar historial de pagos.
- Calcular o consultar el saldo pendiente con base en las reglas del negocio y los pagos válidos registrados.
- Validar que el importe sea positivo y que las relaciones existan.
- Evitar que una misma operación se registre accidentalmente dos veces cuando se disponga de un identificador de operación.
- No integrar pasarelas bancarias ni procesar pagos electrónicos en este sprint.

Los registros de pagos no deben borrarse físicamente como mecanismo normal para corregir errores. Si se requiere anulación o corrección, debe conservarse el historial de acuerdo con las reglas aprobadas.

### 4.4 Reconocimiento facial

- Registrar la información facial necesaria para la identificación de clientes que hayan autorizado su uso.
- Relacionar el registro facial con un cliente válido.
- Permitir realizar una prueba de identificación mediante la cámara o dispositivo disponible.
- Manejar casos de rostro no identificado o coincidencia insuficiente.
- Restringir el acceso a los datos faciales y evitar exponerlos en la API, interfaz general o logs.
- Documentar la tecnología seleccionada, los requisitos de instalación y las limitaciones observadas en las pruebas.

No se debe dar por elegida una biblioteca o proveedor específico hasta verificar su compatibilidad con el entorno del proyecto.

### 4.5 Control de acceso

El flujo general será:

1. Capturar la imagen o entrada necesaria para la identificación.
2. Identificar al cliente registrado.
3. Consultar el estado de su cliente y la membresía correspondiente.
4. Comprobar la vigencia y las reglas de acceso.
5. Autorizar o rechazar el ingreso.
6. Registrar el resultado del intento con fecha/hora y la información operativa necesaria.

Si la identidad no se puede verificar, la membresía no está vigente o no se cumplen las reglas, el sistema no debe autorizar automáticamente el acceso.

### 4.6 Auditoría

Registrar, como mínimo, las acciones relevantes definidas para este sprint:

- Cambios de tipos de membresía.
- Asignaciones y renovaciones.
- Registro o corrección autorizada de pagos.
- Registro o modificación de información facial, sin almacenar datos biométricos en el log.
- Intentos de acceso aceptados y rechazados.

Cuando corresponda, guardar actor, acción, entidad afectada, fecha/hora y resultado. La auditoría no debe incluir contraseñas, tokens ni imágenes o plantillas faciales.

## 5. Roles y permisos

| Operación | Administrador | Recepcionista | Entrenador | Cliente |
|---|---|---|---|---|
| Gestionar tipos de membresía | Sí | No, salvo autorización explícita | No | No |
| Asignar y renovar membresías | Sí | Sí | No | No |
| Consultar membresías | Sí | Sí | Consulta necesaria para sus funciones | Solo la propia |
| Registrar pagos | Sí | Sí | No | No |
| Consultar pagos y adeudos | Sí | Sí | No, salvo información expresamente necesaria | Solo los propios |
| Registrar información facial | Sí o personal expresamente autorizado | Sí, si se autoriza en permisos | No | No desde el portal de consulta |
| Consultar historial general de accesos | Sí | Sí | Solo información necesaria de clientes asignados, si se autoriza | No |
| Consultar historial propio de accesos | Sí, si aplica | Sí, si aplica | Sí, si aplica | Sí |
| Consultar auditoría operativa | Según permisos administrativos | No por defecto | No | No |

Los permisos deben verificarse en el backend. La tabla es la matriz inicial de permisos; cualquier excepción debe documentarse explícitamente antes de implementarse.

## 6. Reglas de negocio

1. Las operaciones requieren una sesión válida y permisos suficientes.
2. Una membresía debe estar asociada a un cliente y un tipo de membresía existentes.
3. No se debe asignar una nueva membresía con un tipo desactivado.
4. La vigencia se valida usando las fechas y el estado aplicable.
5. Los pagos deben guardar importes válidos y relacionarse con los registros correspondientes.
6. El saldo pendiente debe calcularse de forma consistente con los importes, pagos y reglas del modelo.
7. No se debe permitir acceso si el cliente no puede ser identificado de forma suficiente, si no tiene una membresía válida o si la membresía está vencida/inactiva.
8. Cada intento de acceso debe dejar un registro del resultado, tanto si se acepta como si se rechaza.
9. La información facial solo puede registrarse y utilizarse con la autorización correspondiente y para el propósito de identificación definido.
10. No guardar datos biométricos en logs de aplicación o auditoría.
11. No exponer datos de pagos, membresías o accesos de clientes a otros clientes.
12. Las operaciones que actualicen varios registros relacionados deben usar transacciones cuando corresponda.
13. Las acciones financieras y de acceso relevantes deben dejar trazabilidad.
14. Las fallas del dispositivo o del reconocimiento no deben provocar una autorización automática.

## 7. Criterios de aceptación

### Membresías

- Un usuario autorizado puede crear, consultar y modificar tipos de membresía.
- Se puede asignar una membresía a un cliente válido.
- Se muestran correctamente las fechas y el estado de la membresía.
- Se puede renovar una membresía y consultar su historial.
- El sistema rechaza relaciones inválidas y fechas incoherentes.
- Un tipo desactivado no puede asignarse a nuevas membresías.

### Pagos

- Un usuario autorizado puede registrar un pago válido.
- El pago queda relacionado con el cliente y la membresía correspondiente cuando aplique.
- El historial muestra importe, fecha y datos definidos para la operación.
- Los adeudos se calculan o consultan de acuerdo con las reglas aprobadas.
- Las entradas inválidas o importes no permitidos son rechazados.
- Los pagos no pueden ser consultados por clientes distintos del titular ni por roles sin permiso.

### Reconocimiento facial y acceso

- Se puede registrar la información facial de un cliente autorizado.
- Una identificación reconocida se relaciona con el cliente correcto bajo las condiciones de prueba documentadas.
- Un rostro no identificado no autoriza acceso.
- Una membresía vigente puede permitir acceso si se cumplen las demás reglas.
- Una membresía vencida, inactiva o inexistente provoca rechazo.
- Cada intento queda registrado con su resultado y fecha/hora.
- Los errores del dispositivo no generan autorizaciones automáticas.
- Las respuestas y los logs no exponen información biométrica innecesaria.

### Auditoría

- Las acciones relevantes del sprint generan registros de auditoría.
- Los registros identifican la acción y el actor cuando se dispone de esa información.
- Las funciones normales de la aplicación no permiten alterar la auditoría sin autorización especial.

## 8. Entidades y tablas principales

El diseño debe considerar, como mínimo:

- `tipos_membresia`
- `membresias`
- `pagos`
- `rostros`
- `accesos`
- `auditoria`

Se reutilizarán las entidades `usuarios` y `clientes` de Sprint 1. Los nombres finales, columnas, claves y relaciones se establecerán en el diseño de datos y las migraciones; no se debe asumir que una tabla ya existe sin comprobar el esquema real.

## 9. Entregables

- Gestión de tipos de membresía.
- Asignación, consulta y renovación de membresías.
- Registro e historial de pagos.
- Consulta de adeudos.
- Registro protegido de información facial.
- Integración de identificación facial para pruebas.
- Validación y registro de accesos aceptados y rechazados.
- Auditoría de las operaciones relevantes.
- Migraciones versionadas.
- Pruebas de negocio, seguridad, permisos y casos de error.
- Documentación de la tecnología facial elegida y sus limitaciones.

## 10. Fuera de alcance

- Rutinas, ejercicios, asignaciones de entrenador y seguimiento del progreso: corresponden al Sprint 3.
- Dashboard administrativo y reportes consolidados: corresponden al Sprint 3.
- Pagos bancarios integrados o pasarela de pagos.
- Aplicación móvil, múltiples sucursales y equipo físico de torniquete industrial.
- Vigilancia continua o seguimiento de clientes fuera de las operaciones de acceso.
- Facturación electrónica y contabilidad completa.

## 11. Cierre del sprint

El Sprint 2 se considera terminado cuando se pueden administrar membresías y pagos, identificar clientes bajo las condiciones de prueba documentadas, autorizar o rechazar accesos según las reglas de membresía, consultar el historial de accesos y auditar las operaciones relevantes, con pruebas de permisos y errores aprobadas.
