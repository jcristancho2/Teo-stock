import { useEffect, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/config'
import type { ExcelUploadLog, StockItem } from '../types'

function formatearFecha(valor: unknown): string {
  const conToDate = valor as { toDate?: () => Date } | undefined
  if (conToDate?.toDate) return conToDate.toDate().toLocaleString('es-CO')
  return '—'
}

export function AdminDashboardPage() {
  const [stock, setStock] = useState<StockItem[]>([])
  const [ultimaCarga, setUltimaCarga] = useState<ExcelUploadLog | null>(null)

  useEffect(() => {
    const unsubStock = onSnapshot(collection(db, 'stock'), (snap) => {
      setStock(snap.docs.map((d) => d.data() as StockItem))
    })
    const unsubCargas = onSnapshot(
      query(collection(db, 'excelUploads'), orderBy('fecha', 'desc'), limit(1)),
      (snap) => setUltimaCarga(snap.docs[0] ? (snap.docs[0].data() as ExcelUploadLog) : null)
    )
    return () => {
      unsubStock()
      unsubCargas()
    }
  }, [])

  const conStock = stock.filter((s) => s.estado === 'ok' && s.cantidadDisponible > 0).length
  const sinStock = stock.filter((s) => s.estado === 'ok' && s.cantidadDisponible <= 0).length
  const porVerificar = stock.filter((s) => s.estado === 'por_verificar').length

  return (
    <div>
      <h2>Resumen</h2>
      <div className="tarjetas-resumen">
        <div className="tarjeta tarjeta-metrica">
          <span className="metrica">{stock.length}</span>
          <span>Referencias totales</span>
        </div>
        <div className="tarjeta tarjeta-metrica metrica-ok">
          <span className="metrica">{conStock}</span>
          <span>Con disponibilidad</span>
        </div>
        <div className="tarjeta tarjeta-metrica metrica-alerta">
          <span className="metrica">{sinStock}</span>
          <span>Sin stock (a producir)</span>
        </div>
        <div className="tarjeta tarjeta-metrica metrica-advertencia">
          <span className="metrica">{porVerificar}</span>
          <span>Por verificar</span>
        </div>
      </div>

      <div className="tarjeta">
        <h3>Última carga de Excel</h3>
        {ultimaCarga ? (
          <p>
            <strong>{ultimaCarga.nombreArchivo}</strong> — {formatearFecha(ultimaCarga.fecha)} por{' '}
            {ultimaCarga.subidoPorNombre}. {ultimaCarga.filasValidas} filas válidas,{' '}
            {ultimaCarga.filasPorVerificar} por verificar.
          </p>
        ) : (
          <p className="texto-ayuda">Todavía no se ha cargado ningún Excel.</p>
        )}
      </div>
    </div>
  )
}
