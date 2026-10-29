import { StockTable } from '../components/StockTable'

export function ComercialStockPage() {
  // Despachar oculto: la Cloud Function `registrarDespacho` no puede desplegar en plan Spark.
  return <StockTable permiteDespacho={false} />
}
