import { useEffect, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/config'
import type { Movimiento } from '../types'

function formatearFecha(valor: unknown): string {
  const conToDate = valor as { toDate?: () => Date } | undefined
  if (conToDate?.toDate) return conToDate.toDate().toLocaleString('es-CO')
  return '—'
}

export function HistorialMovimientos() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])

  useEffect(() => {
    const q = query(collection(db, 'movimientos'), orderBy('fecha', 'desc'), limit(100))
    const unsub = onSnapshot(q, (snap) => {
      setMovimientos(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Movimiento) })))
    })
    return unsub
  }, [])

  return (
    <div className="tarjeta">
      <h2>Historial de despachos</h2>
      {movimientos.length === 0 ? (
        <p className="texto-ayuda">Todavía no se ha registrado ningún despacho.</p>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Referencia</th>
                <th>Producto</th>
                <th>Despachado</th>
                <th>Antes → Después</th>
                <th>Usuario</th>
                <th>Cliente</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.id}>
                  <td data-etiqueta="Fecha">{formatearFecha(m.fecha)}</td>
                  <td data-etiqueta="Referencia">{m.referencia}</td>
                  <td data-etiqueta="Producto">{m.producto}</td>
                  <td data-etiqueta="Despachado">{m.cantidadDespachada}</td>
                  <td data-etiqueta="Antes → Después">
                    {m.cantidadAntes} → {m.cantidadDespues}
                  </td>
                  <td data-etiqueta="Usuario">{m.usuarioNombre}</td>
                  <td data-etiqueta="Cliente">{m.cliente || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
