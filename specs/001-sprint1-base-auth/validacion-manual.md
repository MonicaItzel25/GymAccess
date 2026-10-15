# Validación manual — Sprint 1 (`001-sprint1-base-auth`)

Registro de los escenarios manuales del `quickstart.md` ejecutados contra la pila
real en ejecución (backend `127.0.0.1:3001`, frontend `localhost:5173`, base
**`gym_db_pruebas`** con `DB_NAME` fijada en el entorno del proceso).

> **Limitación de entorno**: el navegador de escritorio no está conectado a esta
> sesión; los escenarios de UI se ejecutan replayando exactamente las llamadas que
> realiza la interfaz (`POST /api/auth/login`, `GET /api/auth/me` con/sin
> `Authorization`) más la verificación automatizada del lado del cliente
> (`frontend/src/services/api.test.js` y `AuthContext`). Si el navegador se
> conecta, se repetirá el clicado visual.

## A9 — Cerrar sesión y navegar a una ruta privada (2026-10-15) — PASA

| Paso | Acción | Resultado esperado | Resultado |
|------|--------|--------------------|-----------|
| 1 | `POST /api/auth/login` con cuenta activa | 200 con token | ✓ 200, token emitido |
| 2 | `GET /api/auth/me` con `Authorization` | 200, datos del usuario | ✓ 200 (`sesion@prueba.com`) |
| 3 | Cierre de sesión: `cerrarSesionLocal()` elimina `token` y `usuario` | sin datos locales | ✓ verificado en `AuthContext`/`api.js` (T013) y `api.test.js` (T014) |
| 4 | Navegar a ruta privada: la app valida con `GET /api/auth/me` **sin** cabecera | se exige iniciar sesión | ✓ 401 `Autenticación requerida` → `RutaProtegida` redirige a `/login` |
| 5 | Sin rastros del usuario anterior | `localStorage` limpio | ✓ sin claves `token`/`usuario`; la petición sale sin `Authorization` (prueba automatizada) |

Estado: **PASA** (A9). Pendiente de ampliación en T030 con el resto de
escenarios (A1–A8, U1–U8, C1–C8, R1–R7, E1–E3).
