# Validación manual de US5: objetivos y progreso

**Preparado**: 2026-11-26 | **Ejecutado**: 2026-11-26 | **Estado**: F-1, F-2, O-1, O-2 y la accesibilidad del menú móvil (M-1 y M-2) corregidas y **validadas contra el backend real** de forma automatizada (58 de 58, sección 12); servicios detenidos; quedan las pruebas humanas y O-3 (sección 11)

> No iniciar ningún paso sin autorización expresa. Todo se hace contra `gym_db_pruebas`; **nunca** contra `gym_db`.

## Resumen del cierre

| Etapa | Entorno | Resultado |
|---|---|---|
| Recorrido original, antes de corregir | Backend real y `gym_db_pruebas` | 37 comprobaciones: **36 aprobadas y 1 fallida** (teclado a 768 px, F-1). Además, un defecto visual detectado en capturas (F-2) |
| Correcciones F-1, F-2, O-1 y O-2 | Chrome con la **API simulada** | 12 de 12 aprobadas |
| Pruebas del frontend, con las correcciones | Vitest | **49 de 49** en tres ejecuciones |
| Accesibilidad del menú móvil (posterior) | Chrome con la **API simulada** | **18 de 18** aprobadas |
| Regresión de F-1 y F-2 tras ese cambio | Chrome con la **API simulada** | **6 de 6** aprobadas |
| Pruebas del frontend, resultado vigente | Vitest | **57 de 57** |
| Compilación del frontend, resultado vigente | Vite | **Correcta**, con el aviso de un paquete mayor de 500 kB |
| **Validación posterior de las correcciones y regresión de US5** | **Backend real** y `gym_db_pruebas` | **58 de 58** aprobadas (sección 12) |

Las verificaciones con **API simulada** (secciones 10 y 10.1) no sustituían una validación de extremo a extremo; esta se realizó después contra el **backend real** (sección 12). Todas fueron automatizadas. Los resultados anteriores se conservan como historial.

**Marcas**: ☑ aprobado · ☒ falló (ver sección 9) · ☐ no comprobado

**Cómo se ejecutó**: Claude Code recorrió los pasos con Chrome sin ventana, controlado con ratón y teclado; en listas desplegables y en la mayoría de las fechas fijó el valor por código. **No es una revisión visual hecha por una persona.**

## 1. Preparación

Todos los comandos son de PowerShell. Detenerse ante cualquier resultado distinto del esperado.

| ✓ | Paso | Comando (desde la carpeta indicada) | Resultado esperado |
|---|---|---|---|
| ☑ | 1. Puertos libres | `Get-NetTCPConnection -LocalPort 3001,5173 -State Listen -ErrorAction SilentlyContinue` | Sin salida. Si hay algo en 3001, podría ser un backend conectado a `gym_db`: detenerse |
| ☑ | 2. Destino | `backend/`: `Select-String '^DB_NAME=' .env.test` | `DB_NAME=gym_db_pruebas` |
| ☑ | 3. Sembrar datos (**vacía `gym_db_pruebas`**) | `backend/`: `node --env-file=.env.test validate-sprint2.mjs` | Termina con `0 fallo(s)` (obtenido: 58/58) |
| ☑ | 4. Backend | `backend/`: `node --env-file=.env.test src/server.js` | Escucha en el puerto 3001 |
| ☑ | 5. Confirmar el proceso | Otra terminal: `(Get-CimInstance Win32_Process -Filter "ProcessId=$((Get-NetTCPConnection -LocalPort 3001 -State Listen).OwningProcess)").CommandLine` | Contiene `--env-file=.env.test` |
| ☑ | 6. Frontend | `frontend/`: `npm run dev` | Abre en `http://localhost:5173` |

**Prohibido en `backend/`**: `npm run dev`, `npm start` (cargan `.env`, que apunta a `gym_db`) y `npm run migrar`.

## 2. Cuentas

Contraseña de prueba: `Prueba1234`.

| Correo | Rol | Acceso comprobado |
|---|---|---|
| `admin-validacion@prueba.com` | administrador | ☑ |
| `recep-validacion@prueba.com` | recepcionista | ☑ |
| `entrenador-validacion@prueba.com` | entrenador | ☑ |
| `cliente-a@prueba.com` | cliente | ☑ |

Si el inicio de sesión del administrador falla, detenerse: no continuar con otras credenciales.

Usar un perfil de navegador limpio, sin sincronización ni contraseñas guardadas.

## 3. Datos previos (como administrador)

| ✓ | Paso |
|---|---|
| ☑ | Obtener los `id` de la cuenta del entrenador y del cliente A (se tomaron de las respuestas de `usuarios` y `clientes`) |
| ☑ | **Entrenadores**: crear el perfil de la cuenta del entrenador y anotar su `id` |
| ☑ | **Asignaciones**: asignar el cliente A a ese entrenador |

## 4. Recorrido como entrenador

| ✓ | Acción | Resultado esperado |
|---|---|---|
| ☑ | Abrir **Objetivos y progreso** | Aparece en el menú, con el aviso de que no es diagnóstico médico |
| ☑ | Abrir el selector | Solo clientes con asignación vigente |
| ☑ | Elegir el cliente A | Estados vacíos sin errores |
| ☑ | Registrar un objetivo con unidad y otro sin ella | Mensaje de éxito; ambos activos |
| ☑ | Editar la meta | Conserva unidad y fecha |
| ☑ | Borrar la unidad y guardar | Muestra «—» |
| ☑ | Guardar una meta con solo espacios | Se rechaza con mensaje |
| ☑ | Registrar progreso con valor `0` | Se guarda y muestra 0 |
| ☑ | Registrar progreso solo con avance | Se guarda |
| ☑ | Registrar progreso sin valor ni avance | «Indica un valor o un avance medido» |
| ☑ | Registrar fechas desordenadas, pasadas y futuras | Historial en orden ascendente |
| ☑ | Asociar una entrada a un objetivo | El historial muestra su nombre |
| ☑ | Pulsar **Cerrar** y cancelar | No cambia |
| ☑ | Cerrar un objetivo y marcar otro como alcanzado | Sin botones de edición ni opción en «Objetivo asociado» |
| ☑ | Revisar el historial tras cerrar | Las entradas anteriores siguen intactas |
| ☑ | Recargar la página | Los datos persisten |

Comprobaciones adicionales aprobadas: valor negativo o superior a 999999.99 no se envía; la unidad se limita a 30 caracteres y la meta a 255; sin fecha no se envía el formulario.

## 5. Permisos

| ✓ | Acción | Resultado esperado |
|---|---|---|
| ☑ | Entrar como administrador, recepción y cliente | Sin opción de menú; `/objetivos-progreso` redirige a Inicio; la API responde 403 |
| ☑ | Desactivar al entrenador y, como entrenador, elegir un cliente | Mensaje de denegación sin datos |
| ☑ | Reactivarlo y finalizar la asignación | El cliente ya no aparece al recargar; consulta y alta responden 403 |

## 6. Presentación (SC-009)

Estado tras las correcciones. Se comprobaron primero con la API simulada y después contra el backend real (sección 12).

| ✓ | Acción | Resultado esperado |
|---|---|---|
| ☑ | Revisar a 768 px | Sin desbordamiento de la página. A este ancho las tablas caben; su desplazamiento se comprobó a 375 px con la API simulada (sección 10) |
| ☑ | Navegar solo con teclado | Foco visible y formularios utilizables. En el recorrido original **falló** a 768 px (F-1); la corrección se verificó con la API simulada |
| ☑ | Accesibilidad del menú abierto a 768 y 375 px | El foco permanece en el menú, `Escape` lo cierra, recibe el foco al abrirse y lo devuelve al cerrarse. No se cumplía al principio (M-1); verificado con la API simulada (sección 10.1) |
| ☑ | Activar movimiento reducido | Sin animaciones en ejecución. El foco inicial del menú falló en este modo (M-2); corregido y verificado con la API simulada |
| ☐ | Usar la aplicación con un lector de pantalla | Menú, formularios, avisos y tablas se anuncian de forma comprensible |
| ☐ | Comparar el estilo con las demás pantallas | Apariencia coherente. Solo revisado por Claude Code sobre capturas; falta el criterio de una persona |
| ☐ | Probar en un dispositivo real y usar el selector de calendario | Utilizable al tacto |

## 7. Cierre

| ✓ | Paso |
|---|---|
| ☑ | Detener backend y frontend (2026-11-26, con autorización) |

| Servicio | Proceso | Puerto | Estado |
|---|---|---|---|
| Backend (`node --env-file=.env.test src/server.js`) | PID 12792 | 3001 | Detenido; puerto comprobado libre |
| Frontend (Vite) | PID 46880 | 5173 | Detenido; puerto comprobado libre |
| MySQL (`MySQL2610`) | — | — | **Permanece en ejecución; no se detuvo** |

Antes de detenerlos se confirmó que ambos procesos eran los iniciados para esta validación. La detención de la tarea del frontend no terminó el proceso de Vite, por lo que se detuvo directamente el PID 46880.

La auditoría y el rechazo de `id_progreso_corregido` no tienen pantalla; los cubren las pruebas automatizadas. Tras el recorrido, una consulta de solo lectura en `gym_db_pruebas` mostró la auditoría con éxitos y rechazos.

## 8. Registro de resultados

| Fecha | Quién validó | Alcance | Resultado |
|---|---|---|---|
| 2026-11-26 | Claude Code (automatizado) | Recorrido original contra backend y `gym_db_pruebas` | 37 comprobaciones: 36 aprobadas y 1 fallida (teclado a 768 px); además, un defecto visual en capturas |
| 2026-11-26 | Claude Code (automatizado) | Correcciones, con la API simulada | 12 de 12 aprobadas |
| 2026-11-26 | Vitest | Suite del frontend | 49 de 49 en tres ejecuciones; compilación correcta |
| 2026-11-26 | Claude Code (automatizado) | Accesibilidad del menú móvil, con la API simulada | 18 de 18 aprobadas |
| 2026-11-26 | Claude Code (automatizado) | Regresión de F-1 y F-2, con la API simulada | 6 de 6 aprobadas |
| 2026-11-26 | Vitest | Suite del frontend con la corrección del menú | 57 de 57; compilación correcta |
| 2026-11-26 | Claude Code (automatizado) | Correcciones, menú y regresión contra **backend real** y `gym_db_pruebas` | 58 de 58 aprobadas |

En el recorrido original, la comprobación automática del foco en campos de fecha marcó un fallo que se descartó tras revisarlo aparte: el botón del calendario muestra el foco nativo del navegador.

## 9. Incidencias

Las incidencias corregidas se verificaron además contra el backend real (sección 12).

| ID | Hallazgo | Corrección | Estado |
|---|---|---|---|
| F-1 | A 768 px, con el menú cerrado, el foco pasaba por sus controles fuera de pantalla | El menú cerrado usa `visibility: hidden` | Corregida y verificada |
| F-2 | A 768 px, la capa del menú abierto se veía naranja opaca porque `.app button` se imponía a `.capa-menu` | Selector más específico, también al pasar el puntero | Corregida y verificada |
| O-1 | Con el entrenador inactivo aparecían el error, los formularios y los textos de «sin registros» | Ante un 403 se muestra solo «Seguimiento no disponible» con el motivo | Corregida y verificada |
| O-2 | Fechas partidas, botones desalineados y margen superior desigual | Reglas acotadas a esta pantalla | Corregida y verificada; a 768 px y menos los botones se apilan |
| O-3 | Entrenadores y Asignaciones piden `id` y no se encontró una columna con él en Clientes | Ninguna: pertenece a US1 y US2 | Pendiente |
| M-1 | Con el menú móvil abierto, el foco podía salir al contenido, `Escape` no lo cerraba y no recibía el foco al abrirse | Diálogo modal con foco retenido, cierre con `Escape`, foco inicial y devolución | Corregida y verificada con la API simulada |
| M-2 | Detectada al verificar M-1: con movimiento reducido el foco no entraba al menú, porque la regla global retrasaba la visibilidad de sus elementos | Las transiciones de los elementos del menú se limitan a los colores | Corregida y verificada con la API simulada |

## 10. Verificación de las correcciones

Se ejecutó en Chrome contra el servidor de desarrollo del frontend, **interceptando todas las peticiones `/api` con respuestas simuladas**: no llegaron al backend ni a la base de datos. Por tanto, **no es una nueva validación de extremo a extremo**.

| ✓ | Comprobación |
|---|---|
| ☑ | 768 px, menú cerrado: ni Tab ni Shift+Tab entran en el menú |
| ☑ | 768 px: Enter abre el menú y Shift+Tab alcanza sus ocho controles |
| ☑ | Cerrado con la capa o con un enlace, vuelve a quedar sin foco; también con movimiento reducido |
| ☑ | A 769 y 1366 px el menú sigue visible y accesible |
| ☑ | Fondo del menú abierto translúcido, con y sin el puntero encima |
| ☑ | Entrenador inactivo a 1366, 768 y 375 px: un solo aviso, sin formularios, tablas ni desbordamiento |
| ☑ | Con datos, a 1366, 768 y 375 px: fechas en una línea y sin desbordamiento de la página |
| ☑ | A 375 px las tablas se desplazan horizontalmente |

### Observado entonces

Al verificar estas correcciones, el foco podía recorrer el contenido bajo la capa del menú abierto, `Escape` no lo cerraba y el foco no pasaba solo al menú. Quedó registrado como M-1 y se corrigió después (10.1). La comprobación de la tabla anterior sobre abrir con Enter y retroceder con Shift+Tab describe el comportamiento previo a esa corrección.

### 10.1 Accesibilidad del menú móvil

Chrome sin ventana, con teclado y puntero, **interceptando todas las peticiones `/api` con respuestas simuladas**. No es una validación contra el backend real.

**Comportamiento implementado** (a 768 px o menos, con el menú abierto)

| Aspecto | Comportamiento |
|---|---|
| Control y ciclo del foco | Tab y Shift+Tab recorren solo el menú, en ciclo; el contenido de detrás queda `inert` y la capa sale del orden de tabulación |
| Cierre con `Escape` | Cierra el menú |
| Foco inicial | Sección actual; si no figura en el menú, la primera opción |
| Devolución del foco | Vuelve al botón «Menú» al cerrar con `Escape`, con la capa o al elegir una sección |
| Atributos ARIA | Solo mientras está abierto: `role="dialog"`, `aria-modal="true"` y `aria-label="Menú de navegación"`. El botón conserva `aria-controls` y `aria-expanded` refleja el estado |
| Escritorio | Menú fijo, sin diálogo, sin contenido bloqueado y sin efecto de `Escape` |
| Cambio de ancho | Al ensanchar con el menú abierto se cierra y libera el contenido, sin llevar el foco al botón oculto; al volver a estrecho queda cerrado |
| Movimiento reducido | Foco inicial, `Escape` y devolución del foco funcionan (tras corregir M-2) |

**Resultados: 18 de 18**

| ✓ | Comprobación | Anchos | Casos |
|---|---|---|---|
| ☑ | Cerrado: Tab y Shift+Tab no entran en el menú | 768 y 375 px | 2 |
| ☑ | Abrir con Enter: foco en la sección actual, visible, y atributos correctos | 768 y 375 px | 2 |
| ☑ | Abierto: ciclo con Tab | 768 y 375 px | 2 |
| ☑ | Abierto: ciclo inverso con Shift+Tab | 768 y 375 px | 2 |
| ☑ | Abierto: el contenido de detrás no admite foco | 768 y 375 px | 2 |
| ☑ | `Escape` cierra, devuelve el foco y la navegación sigue fuera del menú | 768 y 375 px | 2 |
| ☑ | Abrir con Espacio; cerrar con la capa o con una sección | 768 y 375 px | 2 |
| ☑ | Escritorio sin diálogo ni bloqueo | 1366 y 769 px | 2 |
| ☑ | Cambio de ancho con el menú abierto | 375 ↔ 1366 px | 1 |
| ☑ | Movimiento reducido | 768 px | 1 |

**Regresión de F-1 y F-2: 6 de 6.** **Suite del frontend: 57 de 57**, con ocho pruebas nuevas del menú. **Compilación correcta.**

En las primeras ejecuciones hubo fallos. Uno era real (M-2). Los demás se debían a la automatización: la simulación no ofrecía controles en la página y dos comprobaciones suponían un orden de tabulación incorrecto. Los resultados indicados son los de la repetición posterior a esos ajustes.

## 11. Pendientes

Ninguna de estas pruebas está aprobada.

| ✓ | Pendiente | Detalle |
|---|---|---|
| ☐ | Revisión visual humana | Coherencia de estilo con las demás pantallas, incluidas las correcciones y el menú |
| ☐ | Validación en un dispositivo real | Uso al tacto y selector de calendario |
| ☐ | Validación con lector de pantalla | No se comprobó; los atributos ARIA se verificaron en el documento, no su lectura |
| ☐ | O-3 | Entrenadores y Asignaciones piden números de `id`; sin corregir (pertenece a US1 y US2) |

La validación contra el backend real, antes pendiente, se completó de forma automatizada (sección 12). No sustituye ninguna de las pruebas humanas de esta tabla.

## 12. Validación contra el backend real

**Fecha**: 2026-11-26 | **Entorno**: backend real y `gym_db_pruebas`, sin respuestas simuladas | **Resultado**: **58 de 58 comprobaciones aprobadas**

Se realizaron **408 peticiones a la API**, sin respuestas 5xx ni errores de consola. No se encontraron errores en la aplicación.

### 12.1 Aislamiento: uso exclusivo de `gym_db_pruebas`

| ✓ | Comprobación | Resultado |
|---|---|---|
| ☑ | Variables `DB_*` heredadas (proceso, usuario y equipo) | Ninguna |
| ☑ | Configuración efectiva de `.env.test` | `gym_db_pruebas`, `127.0.0.1`, `3306`; sin claves duplicadas |
| ☑ | Código y guardias | `backend/` y `database/` sin cambios; el sembrado y el helper exigen `gym_db_pruebas`; sin SQL hacia otro esquema. El valor por defecto de `db.js` es `gym_db`, pero no se aplica porque `DB_NAME` está definida |
| ☑ | Base de pruebas, en solo lectura | Sin vistas, triggers, rutinas, eventos ni claves hacia otras bases; migraciones hasta `007` |
| ☑ | Sembrado `validate-sprint2.mjs` | Solo en `gym_db_pruebas`; 58 de 58 comprobaciones **propias del script**, distintas de las 58 de esta validación |
| ☑ | Backend | `node --env-file=.env.test src/server.js`, confirmado como el proceso del puerto 3001 |
| ☑ | Datos al terminar, en solo lectura | En `gym_db_pruebas`: 4 objetivos, 4 progresos, 2 asignaciones finalizadas y auditoría con éxitos y rechazos |

No se usó ni se consultó `gym_db`. No se ejecutaron migraciones ni el SQL `008`, ni se cambió el esquema.

### 12.2 Correcciones

| ✓ | Corrección | Comprobado | Casos |
|---|---|---|---|
| ☑ | F-1, menú cerrado | Tab y Shift+Tab no entran en el menú, a 768 y 375 px | 2 |
| ☑ | F-2, capa del menú | Translúcida, con y sin el puntero encima, a 768 y 375 px | 2 |
| ☑ | O-1, entrenador inactivo | Un solo aviso, sin formularios ni tablas, a 1366, 768 y 375 px; la API responde 403 | 1 |
| ☑ | O-1, asignación finalizada con la pantalla abierta | Al guardar queda solo el aviso | 1 |
| ☑ | O-2, distribución | A 1366, 768 y 375 px: fechas en una línea, márgenes uniformes y sin desbordamiento; a 375 px las tablas se desplazan. A 768 px y menos los botones se apilan | 1 |

### 12.3 Accesibilidad del menú

| ✓ | Estado | Comprobado | Casos |
|---|---|---|---|
| ☑ | Cerrado | F-1 (tabla anterior) y movimiento reducido (fila de modos) | — |
| ☑ | Abierto, a 768 y 375 px | Foco inicial visible y atributos; ciclo con Tab; ciclo inverso con Shift+Tab; contenido de detrás sin foco; `Escape` con devolución del foco; apertura con Espacio y cierre con la capa o una sección | 12 |
| ☑ | Escritorio y modos | Menú fijo a 1366 y 769 px; cambio de ancho con el menú abierto; movimiento reducido, cerrado y abierto | 3 |

### 12.4 Regresión de US5

| ✓ | Flujo | Comprobado | Casos |
|---|---|---|---|
| ☑ | Acceso y datos previos | Administrador y entrenador; `id`, perfil y asignación | 5 |
| ☑ | Objetivos y progreso | Alta, edición, rechazos, valor `0`, avance, orden de fechas, cierre y persistencia tras recargar | 16 |
| ☑ | Validaciones adicionales | Límites numéricos, longitudes y fecha obligatoria | 3 |
| ☑ | Presentación y teclado | 768 px, foco, alta sin ratón, movimiento reducido y capturas. La comprobación que falló en el recorrido original (teclado a 768 px) ahora pasa | 8 |
| ☑ | Permisos | Administrador, recepción y cliente denegados; asignación finalizada sin acceso | 4 |

Suma: 7 casos de correcciones, 15 del menú y 36 de regresión, **58 en total**. Son las 37 comprobaciones del recorrido original (una de ellas, la del entrenador inactivo, figura aquí en O-1) y 21 nuevas.

Se adaptaron dos comprobaciones originales:
- **Foco en escritorio**: se excluyeron los campos de fecha, cuyo botón de calendario usa el foco nativo del navegador (revisado en el primer recorrido).
- **Entrenador inactivo**: exige el nuevo estado único en lugar de las tablas vacías.

### 12.5 Limitaciones

- Se ejecutó con **Chrome sin ventana**, controlado con ratón y teclado; no la realizó una persona.
- En las listas desplegables y en la mayoría de las fechas, **el valor se fijó por código**.
- Las capturas las revisó solo Claude Code; no cuentan como revisión visual humana.
- No se probaron un dispositivo real, el selector de calendario al tacto ni un lector de pantalla.

### 12.6 Evidencias

26 archivos (25 capturas y `resultados.json`) en una **carpeta temporal**, que puede borrarse al reiniciar o limpiar el equipo:

Subcarpeta `evidencias-real` de la carpeta temporal de la sesión de validación, en el equipo donde se ejecutó.

**Si se desean conservar, hay que copiarlas** a una ubicación permanente. No forman parte del repositorio.

### 12.7 Cierre de esta validación

| Servicio | Proceso | Puerto | Estado |
|---|---|---|---|
| Backend | PID 39708 | 3001 | Detenido; puerto comprobado libre |
| Frontend (Vite) | PID 17456 | 5173 | Detenido directamente tras no bastar la parada de su tarea; puerto comprobado libre |
| MySQL (`MySQL2610`) | — | — | Permanece en ejecución; no se detuvo |
