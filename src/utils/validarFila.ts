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

  // Una celda numérica real de Excel llega como number de JS (ya en formato correcto,
  // con punto decimal) — no se debe reformatear como si fuera texto en formato
  // latino, o un valor como 208898.82374 se vuelve 20889882374 al quitarle el punto.
  // Solo el texto (p. ej. "1.234,56" tecleado o pegado como texto) usa punto de miles.
  const numero =
    typeof valorCrudo === 'number' ? valorCrudo : Number(String(valorCrudo).trim().replace(/\./g, '').replace(',', '.'))

  if (!Number.isFinite(numero)) {
    return { cantidad: 0, estado: 'por_verificar', motivo: `Cantidad no numérica: "${valorCrudo}"` }
  }

  if (numero < 0) {
    return { cantidad: numero, estado: 'por_verificar', motivo: 'Cantidad negativa' }
  }

  return { cantidad: numero, estado: 'ok' }
}

export interface ResultadoDisponibleConReserva extends ResultadoValidacion {
  /** Valores crudos usados en la resta, para poder mostrar la operación en pantalla. */
  saldoActual: number
  reserva: number
}

/**
 * Calcula la cantidad disponible real como `saldoActual - reserva`, para ERPs donde el saldo
 * "disponible" que publican no descuenta bien lo ya comprometido con otros pedidos. Si
 * cualquiera de los dos valores es dudoso, o la reserva supera el saldo actual, el resultado
 * también queda "por verificar" — nunca se inventa un número a partir de datos malos.
 */
export function calcularDisponibleConReserva(
  saldoActualCrudo: unknown,
  reservaCrudo: unknown
): ResultadoDisponibleConReserva {
  const actual = validarCantidad(saldoActualCrudo)
  if (actual.estado === 'por_verificar') {
    return {
      cantidad: 0,
      estado: 'por_verificar',
      motivo: `Saldo actual: ${actual.motivo}`,
      saldoActual: actual.cantidad,
      reserva: 0,
    }
  }

  const reserva = validarCantidad(reservaCrudo)
  if (reserva.estado === 'por_verificar') {
    return {
      cantidad: 0,
      estado: 'por_verificar',
      motivo: `Reserva: ${reserva.motivo}`,
      saldoActual: actual.cantidad,
      reserva: reserva.cantidad,
    }
  }

  const cantidad = actual.cantidad - reserva.cantidad
  if (cantidad < 0) {
    return {
      cantidad,
      estado: 'por_verificar',
      motivo: 'La reserva es mayor que el saldo actual',
      saldoActual: actual.cantidad,
      reserva: reserva.cantidad,
    }
  }

  return { cantidad, estado: 'ok', saldoActual: actual.cantidad, reserva: reserva.cantidad }
}

/** Normaliza una referencia para usarla como id de documento estable (misma referencia = mismo doc cada día). */
export function normalizarReferencia(valor: unknown): string {
  return String(valor ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/[/\\.#$[\]]/g, '-') // caracteres no permitidos en ids de Firestore
}
