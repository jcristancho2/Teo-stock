// Tipos compartidos de la app. Los nombres siguen los términos del negocio
// (referencia, bodega, despacho) tal como los usa el equipo comercial de Extrucol.

export type Rol = 'admin' | 'comercial'

export interface UsuarioPerfil {
  uid: string
  email: string
  nombre: string
  rol: Rol
  activo: boolean
  creadoEn?: unknown
}

/** Estado de confianza del dato de una referencia, según las Reglas de Disponibilidad. */
export type EstadoStock = 'ok' | 'por_verificar'

export interface StockItem {
  /** Igual al id del documento: la referencia normalizada (mayúsculas, sin espacios extra). */
  referencia: string
  referenciaOriginal: string
  producto: string
  bodega: string
  unidad: string
  cantidadDisponible: number
  estado: EstadoStock
  motivoVerificar?: string
  ultimaActualizacion?: unknown
  actualizadoPorExcelId?: string
}

export interface Movimiento {
  id?: string
  referencia: string
  producto: string
  cantidadDespachada: number
  cantidadAntes: number
  cantidadDespues: number
  usuarioUid: string
  usuarioNombre: string
  cliente?: string | null
  nota?: string | null
  fecha?: unknown
}

export interface ExcelUploadLog {
  id?: string
  nombreArchivo: string
  subidoPorUid: string
  subidoPorNombre: string
  fecha?: unknown
  totalFilas: number
  filasValidas: number
  filasPorVerificar: number
}

/** Mapeo de columnas del Excel real del sistema → campos de StockItem. Se guarda para reusarlo cada día. */
export interface MapeoColumnasExcel {
  referencia: string
  producto: string
  cantidadDisponible: string
  bodega?: string
  unidad?: string
}
