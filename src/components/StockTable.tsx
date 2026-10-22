import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/config'
import type { StockItem } from '../types'
import { interpretarDisponibilidad } from '../utils/interpretarDisponibilidad'
import { DispatchForm } from './DispatchForm'

export function StockTable({ permiteDespacho }: { permiteDespacho: boolean }) {
  const [items, setItems] = useState<StockItem[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [itemADespachar, setItemADespachar] = useState<StockItem | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'stock'), orderBy('producto'))
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => d.data() as StockItem))
    })
    return unsub
  }, [])

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return items
    return items.filter(
      (it) =>
        it.producto.toLowerCase().includes(termino) ||
        it.referencia.toLowerCase().includes(termino) ||
        (it.referenciaOriginal ?? '').toLowerCase().includes(termino)
    )
  }, [items, busqueda])

  return (
    <div className="tarjeta">
      <div className="fila-cabecera">
        <h2>Disponibilidad</h2>
        <input
          type="search"
          placeholder="Buscar por referencia o producto…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="buscador"
        />
      </div>

      {items.length === 0 ? (
        <p className="texto-ayuda">
          Todavía no hay ningún Excel cargado. Pide a un administrador que cargue el de hoy.
        </p>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Referencia</th>
                <th>Producto</th>
                <th>Bodega</th>
                <th>Disponible</th>
                <th>Estado</th>
                {permiteDespacho && <th></th>}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((item) => {
                const disp = interpretarDisponibilidad(item)
                return (
                  <tr key={item.referencia}>
                    <td>{item.referenciaOriginal || item.referencia}</td>
                    <td>{item.producto}</td>
                    <td>{item.bodega || '—'}</td>
                    <td>
                      {item.cantidadDisponible} {item.unidad}
                    </td>
                    <td>
                      <span className={`insignia insignia-${disp.tipo}`} title={disp.mensaje}>
                        {disp.tipo === 'disponible' && 'Disponible'}
                        {disp.tipo === 'sin_stock' && 'Sin stock — producir'}
                        {disp.tipo === 'por_verificar' && 'Por verificar'}
                      </span>
                    </td>
                    {permiteDespacho && (
                      <td>
                        <button
                          className="boton-pequeno"
                          disabled={disp.tipo !== 'disponible'}
                          onClick={() => setItemADespachar(item)}
                        >
                          Despachar
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {itemADespachar && (
        <DispatchForm
          item={itemADespachar}
          onCerrar={() => setItemADespachar(null)}
          onDespachado={() => {
            /* onSnapshot ya actualiza la fila automáticamente */
          }}
        />
      )}
    </div>
  )
}
