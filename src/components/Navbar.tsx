import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BotonTema } from './BotonTema'

export function Navbar() {
  const { perfil, cerrarSesion } = useAuth()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const location = useLocation()

  // Cierra el menú móvil automáticamente al navegar a otra ruta.
  useEffect(() => {
    setMenuAbierto(false)
  }, [location.pathname])

  if (!perfil) return null

  const linksAdmin = [
    { to: '/admin', label: 'Resumen' },
    { to: '/admin/cargar-excel', label: 'Cargar Excel' },
    { to: '/admin/stock', label: 'Stock' },
    { to: '/admin/historial', label: 'Historial' },
    { to: '/admin/usuarios', label: 'Usuarios' },
  ]
  const linksComercial = [
    { to: '/comercial/stock', label: 'Disponibilidad' },
    { to: '/comercial/historial', label: 'Mis despachos' },
  ]

  const links = perfil.rol === 'admin' ? linksAdmin : linksComercial

  return (
    <header className={`barra-nav${menuAbierto ? ' menu-abierto' : ''}`}>
      <div className="barra-nav-marca">
        <img src="/logo-extrucol.png" alt="Extrucol" className="barra-nav-logo" />
        <span>Teo · Disponibilidad de stock</span>
      </div>
      <button
        type="button"
        className="barra-nav-menu-boton"
        aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={menuAbierto}
        onClick={() => setMenuAbierto((v) => !v)}
      >
        {menuAbierto ? '✕' : '☰'}
      </button>
      <nav>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end className={({ isActive }) => (isActive ? 'activo' : '')}>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="barra-nav-usuario">
        <span className="insignia-rol">{perfil.rol === 'admin' ? 'Administrador' : 'Comercial'}</span>
        <span>{perfil.nombre}</span>
        <BotonTema />
        <button className="boton-secundario" onClick={cerrarSesion}>
          Salir
        </button>
      </div>
    </header>
  )
}
