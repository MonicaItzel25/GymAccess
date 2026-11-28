// services/api.js
// Cliente HTTP de la API REST. El frontend NUNCA accede a MySQL: todas las
// peticiones pasan por el backend con el token JWT en el encabezado
// Authorization: Bearer. ES Modules.

const API_BASE = '/api';

function obtenerToken() {
  return localStorage.getItem('token');
}

/** Realiza una petición SIN token, para la ruta del kiosco (US-S2-08).
 *  El cliente se identifica facialmente sin sesión, por lo que no se adjunta
 *  el encabezado Authorization heredado. */
async function solicitudSinToken(ruta, opciones = {}) {
  const encabezados = { 'Content-Type': 'application/json', ...opciones.encabezados };
  let respuesta;
  try {
    respuesta = await fetch(`${API_BASE}${ruta}`, { ...opciones, headers: encabezados });
  } catch {
    throw new Error('No se pudo conectar con el servidor');
  }
  const datos = await respuesta.json().catch(() => ({ ok: false, message: 'Respuesta inválida del servidor' }));
  if (!respuesta.ok) {
    const error = new Error(datos.message || 'Error en la solicitud');
    error.estado = respuesta.status;
    throw error;
  }
  return datos.data;
}

/** Guarda la sesión después de un login exitoso. */
export function guardarSesion(token, usuario) {
  localStorage.setItem('token', token);
  localStorage.setItem('usuario', JSON.stringify(usuario));
}

/** Devuelve la sesión guardada o null. */
export function obtenerSesion() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    return { token, usuario };
  } catch {
    return null;
  }
}

/** Elimina la sesión local. */
export function cerrarSesionLocal() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
}

/** Realiza una petición autenticada y devuelve el campo `data`. */
async function solicitud(ruta, opciones = {}) {
  const encabezados = { 'Content-Type': 'application/json', ...opciones.encabezados };
  const token = obtenerToken();
  if (token) encabezados.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
   respuesta = await fetch(`${API_BASE}${ruta}`, { ...opciones, headers: encabezados });
  } catch {
    throw new Error('No se pudo conectar con el servidor');
  }

  const datos = await respuesta.json().catch(() => ({ ok: false, message: 'Respuesta inválida del servidor' }));

  if (!respuesta.ok) {
    const error = new Error(datos.message || 'Error en la solicitud');
    error.estado = respuesta.status;
    throw error;
  }

  return datos.data;
}

export const api = {
  login: (correo, password) =>
    solicitud('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo, password }),
    }),
  perfil: () => solicitud('/auth/me'),
  listarUsuarios: () => solicitud('/usuarios'),
  crearUsuario: (datos) =>
    solicitud('/usuarios', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),
  modificarUsuario: (id, datos) =>
    solicitud(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    }),
  crearCliente: (datos) =>
    solicitud('/clientes', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),
  listarClientes: (buscar = '') =>
    solicitud(`/clientes${buscar ? `?buscar=${encodeURIComponent(buscar)}` : ''}`),
  actualizarCliente: (id, datos) =>
    solicitud(`/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    }),
  miPerfil: () => solicitud('/clientes/mio'),
  // --- Tipos de membresía (Sprint 2, US-S2-01) ---
  listarTiposMembresia: () => solicitud('/tipos-membresia'),
  obtenerTipoMembresia: (id) => solicitud(`/tipos-membresia/${id}`),
  crearTipoMembresia: (datos) =>
    solicitud('/tipos-membresia', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),
  modificarTipoMembresia: (id, datos) =>
    solicitud(`/tipos-membresia/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    }),
  // --- Pagos (Sprint 2, US-S2-04) ---
  registrarPago: (datos) =>
    solicitud('/pagos', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),
  listarPagos: (cliente = null) =>
    solicitud(`/pagos${cliente ? `?cliente=${cliente}` : ''}`),
  // --- Consulta de pagos y adeudos (Sprint 2, US-S2-05) ---
  listarAdeudos: () => solicitud('/adeudos'),
  misPagos: () => solicitud('/pagos/mio'),
  misAdeudos: () => solicitud('/adeudos/mio'),
  // --- Consulta de accesos (Sprint 2, US-S2-09) ---
  listarAccesos: (filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.desde) params.set('desde', filtros.desde);
    if (filtros.hasta) params.set('hasta', filtros.hasta);
    if (filtros.cliente) params.set('cliente', filtros.cliente);
    const consulta = params.toString();
    return solicitud(`/accesos${consulta ? `?${consulta}` : ''}`);
  },
  misAccesos: () => solicitud('/accesos/mio'),
  // --- Autorización manual de ingreso (Sprint 2, US-S2-08, FR-030) ---
  accesoManual: (datos) =>
    solicitud('/acceso/manual', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),
  // --- Información facial (Sprint 2, US-S2-06) ---
  registrarRostro: (idCliente, descriptor) =>
    solicitud(`/clientes/${idCliente}/rostro`, {
      method: 'POST',
      body: JSON.stringify({ descriptor_facial: descriptor }),
    }),
  obtenerEstadoRostro: (idCliente) => solicitud(`/clientes/${idCliente}/rostro`),
  // --- Control de acceso (Sprint 2, US-S2-08): ruta del kiosco SIN token ---
  enviarIntentoAcceso: (descriptor) =>
    solicitudSinToken('/acceso/intento', {
      method: 'POST',
      body: JSON.stringify({ descriptor_facial: descriptor }),
    }),
  // --- Membresías (Sprint 2, US-S2-02) ---
  crearMembresia: (datos) =>
    solicitud('/membresias', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),
  listarMembresias: (cliente = null) =>
    solicitud(`/membresias${cliente ? `?cliente=${cliente}` : ''}`),
  obtenerMembresia: (id) => solicitud(`/membresias/${id}`),
  // --- Ciclo de vida de membresías (Sprint 2, US-S2-03) ---
  renovarMembresia: (id, datos = {}) =>
    solicitud(`/membresias/${id}/renovar`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    }),
  suspenderMembresia: (id) =>
    solicitud(`/membresias/${id}/suspender`, { method: 'PUT', body: JSON.stringify({}) }),
  reactivarMembresia: (id) =>
    solicitud(`/membresias/${id}/reactivar`, { method: 'PUT', body: JSON.stringify({}) }),
  cancelarMembresia: (id) =>
    solicitud(`/membresias/${id}/cancelar`, { method: 'PUT', body: JSON.stringify({}) }),
  // --- Entrenadores (Sprint 3, US-S3-01) ---
  listarEntrenadores: () => solicitud('/entrenadores'),
  crearEntrenador: (datos) =>
    solicitud('/entrenadores', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),
  actualizarEntrenador: (id, datos) =>
    solicitud(`/entrenadores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    }),
  cambiarEstadoEntrenador: (id, estado) =>
    solicitud(`/entrenadores/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ estado }),
    }),
  // --- Asignaciones de entrenador (Sprint 3, US-S3-02) ---
  listarAsignaciones: (params = {}) => {
    const consulta = new URLSearchParams();
    if (params.entrenador) consulta.set('entrenador', params.entrenador);
    if (params.vigentes !== undefined) consulta.set('vigentes', params.vigentes);
    const sufijo = consulta.toString() ? `?${consulta.toString()}` : '';
    return solicitud(`/asignaciones${sufijo}`);
  },
  crearAsignacion: (datos) =>
    solicitud('/asignaciones', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),
  finalizarAsignacion: (id, datos = {}) =>
    solicitud(`/asignaciones/${id}/finalizar`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    }),
  // --- Catálogo de ejercicios (Sprint 3, US-S3-08) ---
  listarEjercicios: (estado = 'activo') =>
    solicitud(`/ejercicios?estado=${encodeURIComponent(estado)}`),
  crearEjercicio: (datos) =>
    solicitud('/ejercicios', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),
  actualizarEjercicio: (id, datos) =>
    solicitud(`/ejercicios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    }),
  cambiarEstadoEjercicio: (id, estado) =>
    solicitud(`/ejercicios/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ estado }),
    }),
  // --- Rutinas de entrenamiento (Sprint 3, US-S3-03) ---
  // Para el entrenador, listarRutinas siempre resuelve las SUYAS (el backend
  // aplica la asignación vigente); `cliente` es un filtro opcional.
  listarRutinas: (cliente = null) =>
    solicitud(cliente ? `/rutinas?cliente=${cliente}` : '/rutinas'),
  obtenerRutina: (id) => solicitud(`/rutinas/${id}`),
  crearRutina: (datos) =>
    solicitud('/rutinas', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),
  actualizarRutina: (id, datos) =>
    solicitud(`/rutinas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    }),
  cambiarEstadoRutina: (id, estado) =>
    solicitud(`/rutinas/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    }),
  // --- Objetivos y progreso (Sprint 3, US-S3-04) ---
  listarObjetivos: (cliente) => solicitud(`/objetivos?cliente=${cliente}`),
  crearObjetivo: (datos) =>
    solicitud('/objetivos', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),
  actualizarObjetivo: (id, datos) =>
    solicitud(`/objetivos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    }),
  cambiarEstadoObjetivo: (id, estado) =>
    solicitud(`/objetivos/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    }),
  // El historial de progreso solo admite consulta y alta (FR-021).
  listarProgresos: (cliente, { desde, hasta } = {}) => {
    const consulta = new URLSearchParams({ cliente });
    if (desde) consulta.set('desde', desde);
    if (hasta) consulta.set('hasta', hasta);
    return solicitud(`/progresos?${consulta.toString()}`);
  },
  crearProgreso: (datos) =>
    solicitud('/progresos', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),
  // --- Mi entrenamiento del cliente (Sprint 3, US-S3-05): solo consulta ---
  obtenerMiRutina: () => solicitud('/mi-entrenamiento/rutina'),
  obtenerMisObjetivos: () => solicitud('/mi-entrenamiento/objetivos'),
  obtenerMisProgresos: () => solicitud('/mi-entrenamiento/progresos'),
  // --- Dashboard administrativo (Sprint 3, US-S3-06) ---
  obtenerDashboard: ({ desde, hasta } = {}) => {
    const consulta = new URLSearchParams();
    if (desde) consulta.set('desde', desde);
    if (hasta) consulta.set('hasta', hasta);
    const sufijo = consulta.toString() ? `?${consulta.toString()}` : '';
    return solicitud(`/dashboard${sufijo}`);
  },
};
