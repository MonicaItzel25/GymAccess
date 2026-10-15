// utils/fechas.js
// Utilidades de formato de fechas para la API. MySQL devuelve las columnas
// DATE como objetos Date en la zona local; la API las expone como cadenas
// 'YYYY-MM-DD'. ES Modules.

/** Formatea un objeto Date (o cadena) como 'YYYY-MM-DD' usando la hora local. */
export function aFechaLocal(valor) {
  if (valor == null) return null;
  if (typeof valor === 'string') return valor.slice(0, 10);
  const d = valor instanceof Date ? valor : new Date(valor);
  const anio = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/** Devuelve la fecha de hoy en formato 'YYYY-MM-DD' (hora local). */
export function hoy() {
  return aFechaLocal(new Date());
}
