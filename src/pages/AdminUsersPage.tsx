import { useEffect, useState, type FormEvent } from 'react'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../firebase/config'
import type { Rol, UsuarioPerfil } from '../types'

export function AdminUsersPage() {
  const [usuarios, setUsuarios] = useState<UsuarioPerfil[]>([])
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState<Rol>('comercial')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)

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
      const crearUsuario = httpsCallable(functions, 'crearUsuario')
      await crearUsuario({ email: email.trim(), password, nombre: nombre.trim(), rol })
      setExito(`Usuario ${nombre} creado correctamente.`)
      setNombre('')
      setEmail('')
      setPassword('')
      setRol('comercial')
    } catch (err) {
      setError((err as { message?: string }).message ?? 'No se pudo crear el usuario.')
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
              {usuarios.map((u) => (
                <tr key={u.uid}>
                  <td data-etiqueta="Nombre">{u.nombre}</td>
                  <td data-etiqueta="Correo">{u.email}</td>
                  <td data-etiqueta="Rol">
                    <select value={u.rol} onChange={(e) => cambiarRol(u, e.target.value as Rol)}>
                      <option value="comercial">Comercial</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>
                  <td data-etiqueta="Estado">{u.activo ? 'Activo' : 'Desactivado'}</td>
                  <td>
                    <button className="boton-secundario boton-pequeno" onClick={() => alternarActivo(u)}>
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
