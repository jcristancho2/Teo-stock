import { StockTable } from '../components/StockTable'

export function AdminStockPage() {
  // Despachar oculto: la Cloud Function `registrarDespacho` no puede desplegar en plan Spark.
  return <StockTable permiteDespacho={false} />
}
