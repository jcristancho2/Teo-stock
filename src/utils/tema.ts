/** Modo claro/oscuro: persistido en localStorage, con el sistema operativo como valor por defecto. */
export type Tema = 'claro' | 'oscuro'

const CLAVE_TEMA = 'teo-tema'

export function obtenerTemaInicial(): Tema {
  const guardado = localStorage.getItem(CLAVE_TEMA)
  if (guardado === 'claro' || guardado === 'oscuro') return guardado
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro'
}

export function aplicarTema(tema: Tema): void {
  document.documentElement.setAttribute('data-tema', tema)
  localStorage.setItem(CLAVE_TEMA, tema)
}
