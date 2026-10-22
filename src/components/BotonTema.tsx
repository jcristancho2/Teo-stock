import { useState } from 'react'
import { aplicarTema, obtenerTemaInicial, type Tema } from '../utils/tema'

export function BotonTema() {
  const [tema, setTema] = useState<Tema>(obtenerTemaInicial)

  function alternar() {
    const siguiente: Tema = tema === 'claro' ? 'oscuro' : 'claro'
    aplicarTema(siguiente)
    setTema(siguiente)
  }

  return (
    <button
      type="button"
      className="boton-secundario boton-tema"
      onClick={alternar}
      aria-label={tema === 'claro' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      title={tema === 'claro' ? 'Modo oscuro' : 'Modo claro'}
    >
      {tema === 'claro' ? '🌙' : '☀️'}
    </button>
  )
}
