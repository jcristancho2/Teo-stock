/**
 * Reglas de validación de una fila de stock, siguiendo
 * "Reglas_de_Disponibilidad.md": si el dato parece erróneo (negativo, vacío,
 * no numérico), nunca se inventa ni se redondea — se marca "por_verificar"
 * para que no se confíe en esa cifra hasta volver a descargar el Excel.
 */
export interface ResultadoValidacion {
  cantidad: number
  estado: 'ok' | 'por_verificar'
  motivo?: string
}

export function validarCantidad(valorCrudo: unknown): ResultadoValidacion {
  if (valorCrudo === null || valorCrudo === undefined || valorCrudo === '') {
    return { cantidad: 0, estado: 'por_verificar', motivo: 'Cantidad vacía en el Excel' }
  }

  const texto = String(valorCrudo).trim().replace(/\./g, '').replace(',', '.')
  const numero = Number(texto)

  if (!Number.isFinite(numero)) {
    return { cantidad: 0, estado: 'por_verificar', motivo: `Cantidad no numérica: "${valorCrudo}"` }
  }

  if (numero < 0) {
    return { cantidad: numero, estado: 'por_verificar', motivo: 'Cantidad negativa' }
  }

  return { cantidad: numero, estado: 'ok' }
}

/** Normaliza una referencia para usarla como id de documento estable (misma referencia = mismo doc cada día). */
export function normalizarReferencia(valor: unknown): string {
  return String(valor ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/[/\\.#$[\]]/g, '-') // caracteres no permitidos en ids de Firestore
}
