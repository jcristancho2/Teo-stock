import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { signInWithCustomToken } from 'firebase/auth'
import { auth } from '../firebase/config'
import { URL_API_ADMIN } from '../config/adminApi'
import { BotonTema } from '../components/BotonTema'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: { pathname: string } } }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      // Login solo con correo, sin contraseña: el backend revisa que el correo tenga una cuenta
      // activa (creada por un admin) y entrega un custom token para esa cuenta. Decisión
      // explícita del cliente — ver la advertencia de seguridad en server/index.js.
      const respuesta = await fetch(`${URL_API_ADMIN}/iniciar-sesion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const datos = await respuesta.json().catch(() => ({}))
      if (!respuesta.ok) {
        throw new Error(datos.error ?? 'No se pudo iniciar sesión.')
      }

      await signInWithCustomToken(auth, datos.token)
      navigate(location.state?.from?.pathname ?? '/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="pantalla-centrada">
      <div className="boton-tema-flotante">
        <BotonTema />
      </div>
      <form className="tarjeta tarjeta-login" onSubmit={onSubmit}>
        <img src="/logo-extrucol.png" alt="Extrucol" className="logo-login" />
        <h1>Teo</h1>
        <p className="subtitulo">Disponibilidad de stock · Extrucol</p>

        <label>
          Correo
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        {error && <p className="texto-error">{error}</p>}

        <button type="submit" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
