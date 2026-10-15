// pages/Inicio.jsx
// Pantalla de bienvenida tras iniciar sesión. ES Modules (JSX).

import { useAuth } from '../context/AuthContext';

const DESCRIPCIONES = {
  administrador: 'Gestiona usuarios, roles y clientes del gimnasio.',
  recepcionista: 'Registra y consulta clientes del gimnasio.',
  entrenador: 'Consulta la información básica de los clientes.',
  cliente: 'Consulta tu información personal desde "Mi perfil".',
};

export default function Inicio() {
  const { usuario } = useAuth();

  return (
    <section className="tarjeta">
      <h1>Hola, {usuario?.nombre}</h1>
      <p className="subtitulo">Rol: {usuario?.rol}</p>
      <p>{DESCRIPCIONES[usuario?.rol] || 'Bienvenido al sistema.'}</p>
    </section>
  );
}
