import { useEffect, useState, type FormEvent } from 'react'
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import { URL_API_ADMIN } from '../config/adminApi'
import type { Rol, UsuarioPerfil } from '../types'

export function AdminUsersPage() {
  const { perfil: perfilPropio, usuarioAuth } = useAuth()
  const [usuarios, setUsuarios] = useState<UsuarioPerfil[]>([])
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
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
      if (!usuarioAuth) throw new Error('Sesión no válida.')
      const token = await usuarioAuth.getIdToken()
      const respuesta = await fetch(`${URL_API_ADMIN}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: email.trim(), nombre: nombre.trim(), rol }),
      })
      const datos = await respuesta.json().catch(() => ({}))
      if (!respuesta.ok) {
        throw new Error(datos.error ?? 'No se pudo crear el usuario.')
      }

      setExito(`Usuario ${nombre} creado correctamente.`)
      setNombre('')
      setEmail('')
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

  // Elimina de verdad: la cuenta de Firebase Authentication Y el perfil de Firestore, vía el
  // backend con Admin SDK (el navegador no puede borrar la cuenta de otra persona él solo).
  async function eliminarUsuario(usuario: UsuarioPerfil) {
    setError(null)
    try {
      if (!usuarioAuth) throw new Error('Sesión no válida.')
      const token = await usuarioAuth.getIdToken()
      const respuesta = await fetch(`${URL_API_ADMIN}/usuarios/${usuario.uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => ({}))
        throw new Error(datos.error ?? 'No se pudo eliminar el usuario.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el usuario.')
    } finally {
      setUidAEliminar(null)
    }
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
        <p className="texto-ayuda">
          "Eliminar" borra la cuenta de verdad (Authentication y perfil) — el correo queda libre
          para crear un usuario nuevo de inmediato.
        </p>
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
