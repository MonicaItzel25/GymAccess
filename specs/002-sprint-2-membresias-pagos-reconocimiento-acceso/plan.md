# Plan de implementación: Membresías, pagos, reconocimiento facial y accesos (Sprint 2)

**Rama**: `002-sprint-2-membresias-pagos-reconocimiento-acceso` | **Fecha**: 2026-10-18 | **Spec**: [spec.md](spec.md)

**Entrada**: Especificación de la función desde `/specs/002-sprint-2-membresias-pagos-reconocimiento-acceso/spec.md`

## Resumen

Consolidar y endurecer el Sprint 2 de GymAccess: tipos de membresía con **precio acordado congelado** en cada membresía (FR-005, FR-007, FR-011, FR-018), pagos y adeudos calculados sobre ese precio registrado, registro facial y validación de acceso del kiosco, **autorización manual de ingreso en recepción** con usuario responsable (FR-030), historial de accesos, auditoría completa y el rediseño de la zona autenticada con pantalla de inicio (US-S2-10). El enfoque técnico reutiliza el código consolidado ya presente (Express + mysql2 + face-api.js en backend; React 18 + Vite + react-router en frontend) y se concentra en los cambios realmente pendientes: tres migraciones correctivas nuevas (precio acordado, campos de autorización manual, protección de pagos duplicados), los ajustes de servicios y rutas que those cambios exigen, la interfaz de autorización manual, la documentación de la tecnología facial y el rediseño visual.

## Contexto técnico

**Lenguaje/versión**: JavaScript (ES Modules, `"type": "module"`); Node.js 18+ (sin versión fijada en el repositorio; determinado por las herramientas existentes).

**Dependencias principales**: backend: Express ^4.21.2, mysql2 ^3.11.5, bcrypt ^5.1.1, jsonwebtoken ^9.0.2, express-validator ^7.2.0, dotenv ^16.4.5, face-api.js ^0.22.2. Frontend: React ^18.3.1, react-router-dom ^6.28.0, @tensorflow/tfjs ^4.22.0, face-api.js ^0.22.2; Vite ^5.4.11. Sin dependencias nuevas: no se introducen tecnologías ajenas (constitución, principio I).

**Persistencia**: MySQL; pool `mysql2` en `backend/src/config/db.js`; migraciones versionadas en `database/migrations/` (001–003 existentes, ejecutadas; NO se editan) aplicadas por `database/migrate.mjs` y registradas en la tabla `migraciones`. Se agregan 004–006 como migraciones correctivas nuevas.

**Pruebas**: Vitest + Supertest en backend (`backend/tests/{unit,integration,contract}`); Vitest + jsdom + Testing Library en frontend. Ejecución: `npm test` en cada paquete; el backend usa `node --env-file=.env.test` contra el entorno de datos de prueba (FR-048).

**Plataforma de destino**: Servidor Node local (Windows de desarrollo) + navegador moderno (frontend y kiosco con `getUserMedia`).

**Tipo de proyecto**: Aplicación web por capas: `frontend/` + `backend/` + `database/` (constitución, principio I).

**Metas de rendimiento**: sin exigencias cuantitativas definidas en la spec; operaciones interactivas < 1 s percibido. La identificación facial compara descriptores en memoria (128 números por cliente) con umbral `FACE_MATCH_THRESHOLD` (0,5 por defecto); el volumen esperado (gimnasio único, cientos de clientes) lo hace aceptable (ver research.md, decisión R4).

**Restricciones**: constitución v1.0.0: solo ES Modules en backend; backend como única autoridad de validación y autorización; JWT con expiración de 8 h; sin borrado físico de usuarios, clientes, pagos, accesos ni auditoría; transacciones para operaciones múltiples; datos biométricos jamás en respuestas, logs ni auditoría; base `gym_db` en operación no se modifica ni se reinicia; pruebas solo contra entorno de datos de prueba separado.

**Alcance/escala**: 10 historias de usuario, 48 FR, 17 RN, 11 SC; ~13 páginas existentes en frontend, ~11 routers y ~8 services en backend; sprint de consolidación sobre código ya existente, no desde cero.

## Verificación de la constitución

*PURTA: debe superarse antes de la investigación de la Fase 0. Re-verificar tras el diseño de la Fase 1.*

| Principio | Estado | Evidencia en el plan |
|---|---|---|
| I. Arquitectura por capas con API REST | ✅ Cumple | Sin tecnologías nuevas; frontend nunca toca MySQL; migraciones solo en `database/`. |
| II. Backend como única autoridad | ✅ Cumple | La autorización manual valida rol en servidor (`autorizar('administrador','recepcionista')`); el frontend solo oculta opciones; el precio acordado se calcula en el servicio, nunca se acepta del cliente. |
| III. Persistencia migrable y auditable | ✅ Cumple | Nuevas migraciones 004–006 versionadas y registradas en la tabla `migraciones`; migraciones 001–003 intactas; PK/FK/NOT NULL/índices; sin borrado físico; transacciones en asignar/renovar; auditoría no editable. |
| IV. Seguridad y privacidad | ✅ Cumple | Sin cambios en autenticación; datos biométricos nunca en respuestas/logs/auditoría; la autorización manual no almacena biométricos; JWT inalterado. |
| V. Alcance estricto y pruebas obligatorias | ✅ Cumple | Alcance solo del Sprint 2 (10 historias), ampliación del dashboard ya documentada y aprobada; pruebas por módulo de casos exitosos, validación, permisos y accesos no autorizados; entorno de pruebas separado. |

**Violaciones que justifican seguimiento**: ninguna. No hay nada que registrar en «Registro de complejidad».

**Re-verificación tras el diseño de la Fase 1** (2026-10-18, tras `research.md`,
`data-model.md`, `contracts/` y `quickstart.md`):

| Comprobación de diseño | Estado | Detalle |
|---|---|---|
| Migraciones 004–006 como archivos nuevos, sin editar 001–003 ni tocar `gym_db` | ✅ | data-model.md §3–4, research.md R9, quickstart.md (entorno `gym_db_pruebas`) |
| Sin tecnologías nuevas (solo face-api.js/Express/React ya instalados) | ✅ | research.md R4, R7 |
| Precio acordado calculado y validado en el servidor, nunca aceptado del cliente | ✅ | contracts §2.1 |
| Autorización manual con rol validado en servidor (`autorizar`) y sin biométricos | ✅ | contracts §1.1, research.md R2/R5 |
| Datos biométricos fuera de respuestas, logs y auditoría | ✅ | contracts §1.1, §2.4, quickstart V7 |
| Borrado físico inexistente; auditoría no editable; transacciones en asignar/renovar | ✅ | data-model.md §2.2–2.6 |
| Alcance limitado al Sprint 2 (reportes consolidados y asignación de entrenadores → Sprint 3) | ✅ | contracts §4, spec «Fuera de alcance» |
| Pruebas obligatorias contra entorno separado (FR-046, FR-048) | ✅ | quickstart.md «Pruebas automatizadas» y «Configuración» |

Las puertas se mantienen en ⏺️ **APROBADO** sin violaciones.

## Estructura del proyecto

### Documentación (esta función)

```text
specs/002-sprint-2-membresias-pagos-reconocimiento-acceso/
├── plan.md                  # Este archivo (salida de /speckit.plan)
├── research.md              # Salida de la Fase 0
├── data-model.md            # Salida de la Fase 1 (ya existente; se amplía)
├── quickstart.md            # Salida de la Fase 1
├── contracts/               # Salida de la Fase 1
│   └── api-sprint2.md
├── checklists/
│   └── requirements.md
└── tasks.md                 # Salida de /speckit.tasks (NO lo crea /speckit.plan)
```

### Código fuente (raíz del repositorio)

```text
backend/
├── src/
│   ├── server.js / app.js
│   ├── config/db.js
│   ├── middlewares/ (auth.js, authorize.js, errorHandler.js)
│   ├── routes/ (auth, usuario, cliente, membresia, tipoMembresia, pago,
│   │           adeudo, rostro, acceso, accesoConsulta, auditoria)
│   ├── controllers/ (uno por route)
│   ├── services/ (tipoMembresia, membresia, pago, adeudo, rostro, acceso,
│   │              auditoria, cliente, usuario, auth)
│   ├── models/ (SQL por tabla: usuario, cliente, membresia, tipoMembresia,
│   │            pago, rostro, acceso, auditoria)
│   ├── validators/ (express-validator por módulo)
│   └── utils/ (response, fechas, errorServicio, catalogos, matchRostro)
└── tests/{unit,integration,contract,helpers}

frontend/
├── src/
│   ├── pages/ (Login, Inicio, Usuarios, Clientes, MiPerfil, Membresias,
│   │           TiposMembresia, Pagos, MisPagos, Accesos, MisAccesos,
│   │           RegistrarRostro, PuntoAcceso)
│   ├── components/ (Layout.jsx, CapturaRostro.jsx)
│   ├── context/AuthContext.jsx
│   ├── services/api.js
│   └── App.jsx (rutas con RutaProtegida y RutaRol)
└── (pruebas junto a lo probado: Login.test.jsx, services/api.test.js)

database/
├── migrations/ (001–003 existentes e intocables; nuevas 004–006)
├── seeds/
└── migrate.mjs

docs/ (project-context.md, reglas.md, sprint-1.md, sprint-2.md, sprint-3.md)
```

**Decisión de estructura**: se conserva la estructura real existente (opción 2: web application `frontend/` + `backend/` + `database/`); no se crean carpetas ni módulos nuevos salvo los estrictamente necesarios: `backend/src/services/autorizacionManual.service.js` (o extensión de `acceso.service.js`, ver research.md decisión R5), la página `frontend/src/pages/AutorizarIngreso.jsx`, la documentación `docs/tecnologia-reconocimiento-facial.md` y las migraciones 004–006.

## Registro de complejidad

> Se rellena SOLO si la Verificación de la constitución tiene violaciones que deban justificarse.

| Violación | Por qué es necesaria | Alternativa más simple rechazada porque |
|---|---|---|
| — | — | — |
