import type { StockItem } from '../types'

export type TipoDisponibilidad = 'disponible' | 'sin_stock' | 'por_verificar'

export interface Disponibilidad {
  tipo: TipoDisponibilidad
  mensaje: string
}

/**
 * Traduce el estado de una referencia al mensaje que debe ver el comercial,
 * siguiendo "Reglas_de_Disponibilidad.md" tal como las definió Carlos:
 * - Sin stock → indicar que si el cliente confirma, se debe producir.
 * - Con stock → indicar la cantidad y que se puede despachar.
 * - Dato dudoso → no confiar en la cifra, sugerir volver a descargar el Excel.
 */
export function interpretarDisponibilidad(item: StockItem): Disponibilidad {
  if (item.estado === 'por_verificar') {
    return {
      tipo: 'por_verificar',
      mensaje: item.motivoVerificar
        ? `Dato por verificar (${item.motivoVerificar}). Vuelve a descargar el Excel antes de confiar en esta cifra.`
        : 'Dato por verificar. Vuelve a descargar el Excel antes de confiar en esta cifra.',
    }
  }
  if (item.cantidadDisponible <= 0) {
    return {
      tipo: 'sin_stock',
      mensaje: 'No hay disponible. Si el cliente confirma el pedido, se debe producir.',
    }
  }
  return {
    tipo: 'disponible',
    mensaje: `Disponible: ${item.cantidadDisponible}${item.unidad ? ' ' + item.unidad : ''}. Se puede separar y despachar.`,
  }
}
