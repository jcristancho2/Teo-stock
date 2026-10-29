import { useEffect, useState, type FormEvent } from 'react'
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { app, db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import type { Rol, UsuarioPerfil } from '../types'

/** Traduce los códigos de error de la API de Identity Toolkit a algo que el admin entienda. */
function mensajeErrorAuth(codigo: string | undefined): string {
  if (codigo?.startsWith('EMAIL_EXISTS')) return 'Ya existe un usuario con ese correo.'
  if (codigo?.startsWith('WEAK_PASSWORD')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (codigo?.startsWith('INVALID_EMAIL')) return 'El correo no es válido.'
  return 'No se pudo crear el usuario en Firebase Authentication.'
}

export function AdminUsersPage() {
  const { perfil: perfilPropio } = useAuth()
  const [usuarios, setUsuarios] = useState<UsuarioPerfil[]>([])
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState<Rol>('comercial')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const [uidAEliminar, setUidAEliminar] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsuarios(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<UsuarioPerfil, 'uid'>) })))
    })
    return unsub
  }, [])

  async function onCrearUsuario(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setExito(null)
    setEnviando(true)
    try {
      // Se crea la cuenta llamando directo a la API de Identity Toolkit (REST), no con el SDK
      // de cliente: el SDK, al crear un usuario, deja la sesión del navegador logueada como ESE
      // usuario nuevo (saca al admin). La llamada REST solo crea la cuenta en Auth y no toca la
      // sesión actual. No hace falta Cloud Function ni Admin SDK — por eso funciona en plan
      // gratis. El permiso real lo da el doc de Firestore que se escribe después, no esta cuenta.
      const respuesta = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${app.options.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password, displayName: nombre.trim() }),
        }
      )
      const datos = await respuesta.json()
      if (!respuesta.ok) {
        throw new Error(mensajeErrorAuth(datos.error?.message))
      }

      await setDoc(doc(db, 'users', datos.localId), {
        email: email.trim(),
        nombre: nombre.trim(),
        rol,
        activo: true,
        creadoEn: serverTimestamp(),
      })

      setExito(`Usuario ${nombre} creado correctamente.`)
      setNombre('')
      setEmail('')
      setPassword('')
      setRol('comercial')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el usuario.')
    } finally {
      setEnviando(false)
    }
  }

  async function alternarActivo(usuario: UsuarioPerfil) {
    await updateDoc(doc(db, 'users', usuario.uid), { activo: !usuario.activo })
  }

  async function cambiarRol(usuario: UsuarioPerfil, nuevoRol: Rol) {
    await updateDoc(doc(db, 'users', usuario.uid), { rol: nuevoRol })
  }

  // Elimina el perfil de Firestore (no la cuenta de Authentication en sí, que el cliente no
  // puede borrar sin Admin SDK). Sin ese perfil, la persona pierde todo acceso a la app de
  // inmediato — las reglas de Firestore y RoleRoute lo bloquean igual que si no existiera.
  async function eliminarUsuario(usuario: UsuarioPerfil) {
    await deleteDoc(doc(db, 'users', usuario.uid))
    setUidAEliminar(null)
  }

  return (
    <div>
      <div className="tarjeta">
        <h2>Nuevo usuario</h2>
        <form onSubmit={onCrearUsuario} className="formulario-linea">
          <label>
            Nombre
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </label>
          <label>
            Correo
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Contraseña inicial
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>
          <label>
            Rol
            <select value={rol} onChange={(e) => setRol(e.target.value as Rol)}>
              <option value="comercial">Comercial</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          <button type="submit" disabled={enviando}>
            {enviando ? 'Creando…' : 'Crear usuario'}
          </button>
        </form>
        {error && <p className="texto-error">{error}</p>}
        {exito && <p className="texto-exito">{exito}</p>}
      </div>

      <div className="tarjeta">
        <h2>Usuarios del sistema</h2>
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const esUnoMismo = u.uid === perfilPropio?.uid
                return (
                  <tr key={u.uid}>
                    <td data-etiqueta="Nombre">{u.nombre}</td>
                    <td data-etiqueta="Correo">{u.email}</td>
                    <td data-etiqueta="Rol">
                      <select
                        value={u.rol}
                        disabled={esUnoMismo}
                        title={esUnoMismo ? 'No puedes cambiar tu propio rol.' : undefined}
                        onChange={(e) => cambiarRol(u, e.target.value as Rol)}
                      >
                        <option value="comercial">Comercial</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </td>
                    <td data-etiqueta="Estado">{u.activo ? 'Activo' : 'Desactivado'}</td>
                    <td>
                      {uidAEliminar === u.uid ? (
                        <span className="fila-confirmar-borrado">
                          <span className="texto-error">¿Eliminar a {u.nombre}?</span>
                          <button className="boton-secundario boton-pequeno" onClick={() => setUidAEliminar(null)}>
                            Cancelar
                          </button>
                          <button className="boton-peligro boton-pequeno" onClick={() => eliminarUsuario(u)}>
                            Sí, eliminar
                          </button>
                        </span>
                      ) : (
                        <>
                          <button
                            className="boton-secundario boton-pequeno"
                            disabled={esUnoMismo}
                            title={esUnoMismo ? 'No puedes desactivarte a ti mismo.' : undefined}
                            onClick={() => alternarActivo(u)}
                          >
                            {u.activo ? 'Desactivar' : 'Activar'}
                          </button>{' '}
                          <button
                            className="boton-peligro boton-pequeno"
                            disabled={esUnoMismo}
                            title={esUnoMismo ? 'No puedes eliminarte a ti mismo.' : undefined}
                            onClick={() => setUidAEliminar(u.uid)}
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
