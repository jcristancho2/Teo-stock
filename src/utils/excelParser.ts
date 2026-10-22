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

/** Palabras clave para adivinar qué columna del Excel real corresponde a cada campo. */
const PISTAS: Record<keyof MapeoColumnasExcel, string[]> = {
  referencia: ['referencia', 'codigo', 'código', 'sku', 'item', 'cod'],
  producto: ['producto', 'descripcion', 'descripción', 'nombre', 'articulo', 'artículo'],
  cantidadDisponible: ['disponible', 'cantidad', 'stock', 'existencia', 'saldo'],
  bodega: ['bodega', 'almacen', 'almacén', 'deposito', 'depósito'],
  unidad: ['unidad', 'um', 'u.m', 'medida'],
}

/** Sugiere automáticamente el mapeo de columnas a partir de los encabezados reales del Excel. */
export function sugerirMapeo(encabezados: string[]): Partial<MapeoColumnasExcel> {
  const sugerido: Partial<MapeoColumnasExcel> = {}
  for (const campo of Object.keys(PISTAS) as (keyof MapeoColumnasExcel)[]) {
    const pistas = PISTAS[campo]
    const encontrado = encabezados.find((enc) =>
      pistas.some((pista) => enc.toLowerCase().includes(pista))
    )
    if (encontrado) sugerido[campo] = encontrado
  }
  return sugerido
}
