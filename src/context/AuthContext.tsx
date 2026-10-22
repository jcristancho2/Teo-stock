import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import type { UsuarioPerfil } from '../types'

interface AuthContextValue {
  usuarioAuth: User | null
  perfil: UsuarioPerfil | null
  cargando: boolean
  /** true mientras ya sabemos que hay sesión pero el perfil de Firestore aún no llega. */
  cargandoPerfil: boolean
  cerrarSesion: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuarioAuth, setUsuarioAuth] = useState<User | null>(null)
  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null)
  const [cargando, setCargando] = useState(true)
  const [cargandoPerfil, setCargandoPerfil] = useState(false)

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUsuarioAuth(user)
      setCargando(false)
    })
    return unsubAuth
  }, [])

  useEffect(() => {
    if (!usuarioAuth) {
      setPerfil(null)
      return
    }
    setCargandoPerfil(true)
    // El perfil (rol, nombre, activo) vive en Firestore. Lo escuchamos en vivo
    // para que si el admin cambia un rol o desactiva a alguien, se refleje sin recargar.
    const unsubPerfil = onSnapshot(
      doc(db, 'users', usuarioAuth.uid),
      (snap) => {
        if (snap.exists()) {
          setPerfil({ uid: usuarioAuth.uid, ...(snap.data() as Omit<UsuarioPerfil, 'uid'>) })
        } else {
          setPerfil(null)
        }
        setCargandoPerfil(false)
      },
      () => setCargandoPerfil(false)
    )
    return unsubPerfil
  }, [usuarioAuth])

  async function cerrarSesion() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ usuarioAuth, perfil, cargando, cargandoPerfil, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
