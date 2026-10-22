import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import type { Rol } from '../types'

/** Protege una ruta: exige sesión activa, perfil cargado y uno de los roles permitidos. */
export function RoleRoute({ roles, children }: { roles: Rol[]; children: ReactNode }) {
  const { usuarioAuth, perfil, cargando, cargandoPerfil } = useAuth()

  if (cargando || (usuarioAuth && cargandoPerfil)) {
    return <div className="pantalla-centrada">Cargando…</div>
  }

  if (!usuarioAuth) {
    return <Navigate to="/login" replace />
  }

  if (!perfil) {
    return (
      <div className="pantalla-centrada">
        <p>
          Tu cuenta no tiene un perfil activo en el sistema. Pide a un administrador que te
          registre desde <strong>Usuarios</strong>.
        </p>
      </div>
    )
  }

  if (!perfil.activo) {
    return (
      <div className="pantalla-centrada">
        <p>Tu cuenta está desactivada. Habla con un administrador.</p>
      </div>
    )
  }

  if (!roles.includes(perfil.rol)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
