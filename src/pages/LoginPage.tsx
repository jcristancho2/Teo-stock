import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/config'
import { BotonTema } from '../components/BotonTema'

const MENSAJES_ERROR: Record<string, string> = {
  'auth/invalid-email': 'El correo no es válido.',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'No existe una cuenta con ese correo.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
}

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: { pathname: string } } }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      navigate(location.state?.from?.pathname ?? '/', { replace: true })
    } catch (err) {
      const codigo = (err as { code?: string }).code ?? ''
      setError(MENSAJES_ERROR[codigo] ?? 'No se pudo iniciar sesión. Intenta de nuevo.')
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

        <label>
          Contraseña
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
