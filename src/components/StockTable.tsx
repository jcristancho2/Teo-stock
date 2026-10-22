import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/config'
import type { EstadoStock, StockItem } from '../types'
import { interpretarDisponibilidad } from '../utils/interpretarDisponibilidad'
import { DispatchForm } from './DispatchForm'

/** Letras iniciales de la referencia (ej. "TU000741" → "TU"), la familia del producto en el ERP. */
function prefijoDe(referencia: string): string {
  return referencia.match(/^[A-Z]+/)?.[0] ?? '—'
}

/** El campo bodega puede traer varias separadas por coma (ej. "02, T1") cuando la cantidad
 * disponible se sumó entre sedes al cargar el Excel — se listan por separado para filtrar. */
function bodegasDe(bodega: string): string[] {
  return bodega
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean)
}

/**
 * Cuando hay bodegas filtradas, muestra solo lo que hay en esas bodegas (texto y cantidad) en
 * vez del total combinado entre todas. El despacho real sigue descontando del total — Teo no
 * reserva stock por bodega — por eso no se usa esto para habilitar/deshabilitar "Despachar".
 */
function vistaFiltrada(item: StockItem, bodegasActivas: string[]) {
  if (bodegasActivas.length === 0 || !item.porBodega) {
    return { bodegaTexto: item.bodega, cantidad: item.cantidadDisponible, estado: item.estado }
  }
  const incluidas = bodegasDe(item.bodega).filter((b) => bodegasActivas.includes(b))
  let cantidad = 0
  let estado: EstadoStock = 'ok'
  for (const b of incluidas) {
    const info = item.porBodega[b]
    if (!info) continue
    cantidad += info.cantidad
    if (info.estado === 'por_verificar') estado = 'por_verificar'
  }
  return { bodegaTexto: incluidas.join(', ') || item.bodega, cantidad, estado }
}

export function StockTable({ permiteDespacho }: { permiteDespacho: boolean }) {
  const [items, setItems] = useState<StockItem[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [prefijosActivos, setPrefijosActivos] = useState<string[]>([])
  const [bodegasActivas, setBodegasActivas] = useState<string[]>([])
  const [itemADespachar, setItemADespachar] = useState<StockItem | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'stock'), orderBy('producto'))
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => d.data() as StockItem))
    })
    return unsub
  }, [])

  const prefijosDisponibles = useMemo(() => {
    const conteo = new Map<string, number>()
    for (const it of items) {
      const p = prefijoDe(it.referencia)
      conteo.set(p, (conteo.get(p) ?? 0) + 1)
    }
    return Array.from(conteo.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [items])

  const bodegasDisponibles = useMemo(() => {
    const conteo = new Map<string, number>()
    for (const it of items) {
      for (const b of bodegasDe(it.bodega)) {
        conteo.set(b, (conteo.get(b) ?? 0) + 1)
      }
    }
    return Array.from(conteo.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [items])

  function alternarPrefijo(prefijo: string) {
    setPrefijosActivos((actuales) =>
      actuales.includes(prefijo) ? actuales.filter((p) => p !== prefijo) : [...actuales, prefijo]
    )
  }

  function alternarBodega(bodega: string) {
    setBodegasActivas((actuales) =>
      actuales.includes(bodega) ? actuales.filter((b) => b !== bodega) : [...actuales, bodega]
    )
  }

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    return items.filter((it) => {
      if (prefijosActivos.length > 0 && !prefijosActivos.includes(prefijoDe(it.referencia))) return false
      if (bodegasActivas.length > 0 && !bodegasDe(it.bodega).some((b) => bodegasActivas.includes(b))) {
        return false
      }
      if (!termino) return true
      return (
        it.producto.toLowerCase().includes(termino) ||
        it.referencia.toLowerCase().includes(termino) ||
        (it.referenciaOriginal ?? '').toLowerCase().includes(termino)
      )
    })
  }, [items, busqueda, prefijosActivos, bodegasActivas])

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

      {prefijosDisponibles.length > 1 && (
        <div className="grupo-filtro">
          <span className="etiqueta-filtro">Familia</span>
          <div className="chips-filtro">
            <button
              type="button"
              className={`chip${prefijosActivos.length === 0 ? ' chip-activo' : ''}`}
              onClick={() => setPrefijosActivos([])}
            >
              Todos
            </button>
            {prefijosDisponibles.map(([prefijo, cantidad]) => (
              <button
                key={prefijo}
                type="button"
                className={`chip${prefijosActivos.includes(prefijo) ? ' chip-activo' : ''}`}
                onClick={() => alternarPrefijo(prefijo)}
              >
                {prefijo} <span className="chip-contador">{cantidad}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {bodegasDisponibles.length > 1 && (
        <div className="grupo-filtro">
          <span className="etiqueta-filtro">Bodega</span>
          <div className="chips-filtro">
            <button
              type="button"
              className={`chip${bodegasActivas.length === 0 ? ' chip-activo' : ''}`}
              onClick={() => setBodegasActivas([])}
            >
              Todas
            </button>
            {bodegasDisponibles.map(([bodega, cantidad]) => (
              <button
                key={bodega}
                type="button"
                className={`chip${bodegasActivas.includes(bodega) ? ' chip-activo' : ''}`}
                onClick={() => alternarBodega(bodega)}
              >
                {bodega} <span className="chip-contador">{cantidad}</span>
              </button>
            ))}
          </div>
          {bodegasActivas.length > 0 && (
            <p className="texto-ayuda">
              Mostrando solo lo que hay en {bodegasActivas.join(', ')}. El despacho siempre
              descuenta del total combinado entre todas las bodegas.
            </p>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <p className="texto-ayuda">
          Todavía no hay ningún Excel cargado. Pide a un administrador que cargue el de hoy.
        </p>
      ) : filtrados.length === 0 ? (
        <p className="texto-ayuda">Ninguna referencia coincide con la búsqueda o el filtro.</p>
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
                const vista = vistaFiltrada(item, bodegasActivas)
                const dispVista = interpretarDisponibilidad({ ...item, cantidadDisponible: vista.cantidad, estado: vista.estado })
                return (
                  <tr key={item.referencia}>
                    <td>{item.referenciaOriginal || item.referencia}</td>
                    <td>{item.producto}</td>
                    <td>{vista.bodegaTexto || '—'}</td>
                    <td>
                      {vista.cantidad} {item.unidad}
                    </td>
                    <td>
                      <span className={`insignia insignia-${dispVista.tipo}`} title={dispVista.mensaje}>
                        {dispVista.tipo === 'disponible' && 'Disponible'}
                        {dispVista.tipo === 'sin_stock' && 'Sin stock — producir'}
                        {dispVista.tipo === 'por_verificar' && 'Por verificar'}
                      </span>
                    </td>
                    {permiteDespacho && (
                      <td>
                        <button
                          className="boton-pequeno"
                          disabled={disp.tipo !== 'disponible'}
                          title={
                            bodegasActivas.length > 0
                              ? 'El despacho siempre descuenta del total combinado entre bodegas, no solo de esta.'
                              : undefined
                          }
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
