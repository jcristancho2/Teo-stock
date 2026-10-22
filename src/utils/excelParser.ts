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

// "disponible"/"saldo_disponible" solo sirven como cantidad final cuando NO hay columna de
// reserva separada: en ERPs que sí la traen (p. ej. SALDO_DISPONIBLE = SALDO_ACTUAL - RESERVA ya
// calculado por el ERP), usar esa columna A LA VEZ que se resta "reserva" de nuevo duplica la
// resta. Por eso hay dos listas: una para cuando sí hay reserva (prioriza el saldo bruto) y otra
// para cuando no (prioriza el ya-neto).
const PISTAS_CANTIDAD_SIN_RESERVA = ['disponible', 'saldo_disponible', 'cantidad', 'stock', 'existencia', 'saldo']
const PISTAS_CANTIDAD_CON_RESERVA = ['saldo_actual', 'actual', 'cantidad', 'stock', 'existencia', 'saldo', 'disponible']

const PISTAS: Record<Exclude<CampoMapeado, 'cantidadDisponible'>, string[]> = {
  referencia: ['referencia', 'codigo', 'código', 'sku', 'item', 'cod'],
  // "descripcion" va primero: en ERPs reales "producto" también aparece dentro de
  // CODIGO_PRODUCTO/GRUPO_PRODUCTO, que no son el nombre del producto.
  producto: ['descripcion', 'descripción', 'producto', 'nombre', 'articulo', 'artículo'],
  bodega: ['bodega', 'almacen', 'almacén', 'deposito', 'depósito'],
  unidad: ['unidad', 'um', 'u.m', 'medida'],
  // Exacto "reserva" (no "reservado_2" ni variantes) para no toparse con otras columnas que
  // solo mencionan la palabra de pasada — esto solo se usa para precargar la sugerencia; el
  // admin la confirma o la borra en la pantalla de mapeo antes de que se use.
  columnaReserva: ['reserva'],
}

/** Términos que marcan una columna como propia de la bodega (metadato), no del producto. */
const PISTAS_BODEGA = PISTAS.bodega

function candidatosPara(campo: CampoMapeado, encabezados: string[]): string[] {
  // Para cualquier campo que no sea "bodega", se descartan primero los encabezados que
  // suenan a dato de bodega (p. ej. "CODIGO_BODEGA" no debe ganarle a "CODIGO_PRODUCTO"
  // como referencia). Si eso deja la lista vacía, se usan todos igual.
  if (campo === 'bodega') return encabezados
  const sinBodega = encabezados.filter((enc) => !PISTAS_BODEGA.some((p) => enc.toLowerCase().includes(p)))
  return sinBodega.length > 0 ? sinBodega : encabezados
}

function primeraCoincidencia(pistas: string[], lista: string[]): string | undefined {
  for (const pista of pistas) {
    const encontrado = lista.find((enc) => enc.toLowerCase().includes(pista))
    if (encontrado) return encontrado
  }
  return undefined
}

/** Sugiere automáticamente el mapeo de columnas a partir de los encabezados reales del Excel. */
export function sugerirMapeo(encabezados: string[]): Partial<MapeoColumnasExcel> {
  const sugerido: Partial<MapeoColumnasExcel> = {}
  for (const campo of Object.keys(PISTAS) as Exclude<CampoMapeado, 'cantidadDisponible'>[]) {
    const encontrado = primeraCoincidencia(PISTAS[campo], candidatosPara(campo, encabezados))
    if (encontrado) sugerido[campo] = encontrado
  }

  // cantidadDisponible se resuelve al final porque su lista de pistas depende de si ya se
  // encontró columnaReserva arriba.
  const pistasCantidad = sugerido.columnaReserva ? PISTAS_CANTIDAD_CON_RESERVA : PISTAS_CANTIDAD_SIN_RESERVA
  const candidatosCantidad = candidatosPara('cantidadDisponible', encabezados).filter(
    (enc) => enc !== sugerido.columnaReserva
  )
  const cantidadDisponible = primeraCoincidencia(pistasCantidad, candidatosCantidad)
  if (cantidadDisponible) sugerido.cantidadDisponible = cantidadDisponible

  return sugerido
}
