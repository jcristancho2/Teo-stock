import * as XLSX from 'xlsx'
import type { MapeoColumnasExcel } from '../types'

export interface FilaExcelCruda {
  [encabezado: string]: unknown
}

export interface ExcelLeido {
  encabezados: string[]
  filas: FilaExcelCruda[]
}

/** Lee la primera hoja del archivo y devuelve encabezados + filas como objetos. */
export function leerExcel(archivo: File): Promise<ExcelLeido> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    lector.onload = (evento) => {
      try {
        const datos = evento.target?.result
        const libro = XLSX.read(datos, { type: 'array' })
        const nombreHoja = libro.SheetNames[0]
        if (!nombreHoja) throw new Error('El archivo no tiene hojas.')
        const hoja = libro.Sheets[nombreHoja]
        const filas = XLSX.utils.sheet_to_json<FilaExcelCruda>(hoja, { defval: '' })
        const encabezados = filas.length > 0 ? Object.keys(filas[0]) : []
        resolve({ encabezados, filas })
      } catch (err) {
        reject(err instanceof Error ? err : new Error('No se pudo interpretar el Excel.'))
      }
    }
    lector.readAsArrayBuffer(archivo)
  })
}

/**
 * Palabras clave para adivinar qué columna del Excel real corresponde a cada campo.
 * El orden importa: se prueba cada palabra clave contra todos los encabezados antes de pasar
 * a la siguiente, así una palabra más específica (p. ej. "disponible") gana sobre una genérica
 * (p. ej. "saldo") aunque la genérica aparezca en una columna anterior del Excel.
 */
type CampoMapeado = keyof Omit<MapeoColumnasExcel, 'filtroBodegas' | 'filtroTiposProducto' | 'tipoProducto'>

const PISTAS: Record<CampoMapeado, string[]> = {
  referencia: ['referencia', 'codigo', 'código', 'sku', 'item', 'cod'],
  // "descripcion" va primero: en ERPs reales "producto" también aparece dentro de
  // CODIGO_PRODUCTO/GRUPO_PRODUCTO, que no son el nombre del producto.
  producto: ['descripcion', 'descripción', 'producto', 'nombre', 'articulo', 'artículo'],
  cantidadDisponible: ['disponible', 'saldo_disponible', 'cantidad', 'stock', 'existencia', 'saldo'],
  bodega: ['bodega', 'almacen', 'almacén', 'deposito', 'depósito'],
  unidad: ['unidad', 'um', 'u.m', 'medida'],
}

/** Términos que marcan una columna como propia de la bodega (metadato), no del producto. */
const PISTAS_BODEGA = PISTAS.bodega

/** Sugiere automáticamente el mapeo de columnas a partir de los encabezados reales del Excel. */
export function sugerirMapeo(encabezados: string[]): Partial<MapeoColumnasExcel> {
  const sugerido: Partial<MapeoColumnasExcel> = {}
  for (const campo of Object.keys(PISTAS) as CampoMapeado[]) {
    const pistas = PISTAS[campo]
    // Para cualquier campo que no sea "bodega", se descartan primero los encabezados que
    // suenan a dato de bodega (p. ej. "CODIGO_BODEGA" no debe ganarle a "CODIGO_PRODUCTO"
    // como referencia). Si eso deja la lista vacía, se usan todos igual.
    const candidatos =
      campo === 'bodega'
        ? encabezados
        : encabezados.filter((enc) => !PISTAS_BODEGA.some((p) => enc.toLowerCase().includes(p)))
    const lista = candidatos.length > 0 ? candidatos : encabezados

    let encontrado: string | undefined
    for (const pista of pistas) {
      encontrado = lista.find((enc) => enc.toLowerCase().includes(pista))
      if (encontrado) break
    }
    if (encontrado) sugerido[campo] = encontrado
  }
  return sugerido
}
