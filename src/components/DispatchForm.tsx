import { useState, type FormEvent } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase/config'
import type { StockItem } from '../types'

interface Props {
  item: StockItem
  onCerrar: () => void
  onDespachado: (nuevaCantidad: number) => void
}

interface RespuestaDespacho {
  ok: true
  cantidadDisponible: number
}

export function DispatchForm({ item, onCerrar, onDespachado }: Props) {
  const [cantidad, setCantidad] = useState<number>(1)
  const [cliente, setCliente] = useState('')
  const [nota, setNota] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (cantidad <= 0) {
      setError('La cantidad a despachar debe ser mayor a 0.')
      return
    }
    setEnviando(true)
    try {
      // El descuento NUNCA se hace escribiendo directo a Firestore desde el cliente:
      // pasa por esta función en la nube, que hace la resta dentro de una transacción
      // atómica, para que dos personas despachando al mismo tiempo no dejen el stock mal.
      const registrarDespacho = httpsCallable<
        { referencia: string; cantidad: number; cliente?: string; nota?: string },
        RespuestaDespacho
      >(functions, 'registrarDespacho')

      const resultado = await registrarDespacho({
        referencia: item.referencia,
        cantidad,
        cliente: cliente.trim() || undefined,
        nota: nota.trim() || undefined,
      })

      onDespachado(resultado.data.cantidadDisponible)
      onCerrar()
    } catch (err) {
      const mensaje = (err as { message?: string }).message ?? 'No se pudo registrar el despacho.'
      setError(mensaje)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="superposicion" onClick={onCerrar}>
      <form className="tarjeta modal" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
        <h3>Despachar — {item.producto}</h3>
        <p className="texto-ayuda">
          Referencia {item.referenciaOriginal || item.referencia} · Disponible actual:{' '}
          {item.cantidadDisponible} {item.unidad}
        </p>

        <label>
          Cantidad a despachar
          <input
            type="number"
            min={1}
            max={item.cantidadDisponible}
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value))}
            required
          />
        </label>

        <label>
          Cliente (opcional)
          <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} />
        </label>

        <label>
          Nota (opcional)
          <input type="text" value={nota} onChange={(e) => setNota(e.target.value)} />
        </label>

        {error && <p className="texto-error">{error}</p>}

        <div className="fila-botones">
          <button type="button" className="boton-secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" disabled={enviando}>
            {enviando ? 'Registrando…' : 'Confirmar despacho'}
          </button>
        </div>
      </form>
    </div>
  )
}
