import { useState } from 'react'
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import { leerExcel, sugerirMapeo, type FilaExcelCruda } from '../utils/excelParser'
import { normalizarReferencia, validarCantidad } from '../utils/validarFila'
import type { MapeoColumnasExcel } from '../types'

const CAMPOS_OBLIGATORIOS: { clave: keyof MapeoColumnasExcel; etiqueta: string }[] = [
  { clave: 'referencia', etiqueta: 'Referencia / código' },
  { clave: 'producto', etiqueta: 'Producto / descripción' },
  { clave: 'cantidadDisponible', etiqueta: 'Cantidad disponible' },
]
const CAMPOS_OPCIONALES: { clave: keyof MapeoColumnasExcel; etiqueta: string }[] = [
  { clave: 'bodega', etiqueta: 'Bodega' },
  { clave: 'unidad', etiqueta: 'Unidad de medida' },
]

type Paso = 'elegir_archivo' | 'mapear' | 'confirmando' | 'listo'

export function UploadExcelForm() {
  const { usuarioAuth, perfil } = useAuth()
  const [paso, setPaso] = useState<Paso>('elegir_archivo')
  const [nombreArchivo, setNombreArchivo] = useState('')
  const [encabezados, setEncabezados] = useState<string[]>([])
  const [filas, setFilas] = useState<FilaExcelCruda[]>([])
  const [mapeo, setMapeo] = useState<Partial<MapeoColumnasExcel>>({})
  const [error, setError] = useState<string | null>(null)
  const [resumen, setResumen] = useState<{ validas: number; porVerificar: number; total: number } | null>(
    null
  )

  async function onArchivoSeleccionado(archivo: File) {
    setError(null)
    setNombreArchivo(archivo.name)
    try {
      const { encabezados, filas } = await leerExcel(archivo)
      if (filas.length === 0) {
        setError('El Excel no tiene filas de datos.')
        return
      }
      setEncabezados(encabezados)
      setFilas(filas)

      // Reusa el mapeo guardado la última vez si los encabezados coinciden razonablemente;
      // si no, lo sugiere por palabras clave. El admin siempre puede ajustarlo antes de confirmar.
      const configGuardada = await getDoc(doc(db, 'config', 'excelMapping'))
      const guardado = configGuardada.exists() ? (configGuardada.data() as MapeoColumnasExcel) : null
      const sugerido = sugerirMapeo(encabezados)
      const base = guardado && Object.values(guardado).every((v) => !v || encabezados.includes(v))
        ? guardado
        : sugerido

      setMapeo(base)
      setPaso('mapear')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer el archivo.')
    }
  }

  function esMapeoCompleto(m: Partial<MapeoColumnasExcel>): m is MapeoColumnasExcel {
    return CAMPOS_OBLIGATORIOS.every((c) => !!m[c.clave])
  }

  async function confirmarCarga() {
    if (!esMapeoCompleto(mapeo) || !usuarioAuth || !perfil) return
    const mapeoFinal: MapeoColumnasExcel = mapeo
    setPaso('confirmando')
    setError(null)
    try {
      let validas = 0
      let porVerificar = 0
      const items: {
        ref: ReturnType<typeof doc>
        data: Record<string, unknown>
      }[] = []

      for (const fila of filas) {
        const referenciaOriginal = String(fila[mapeoFinal.referencia] ?? '').trim()
        const producto = String(fila[mapeoFinal.producto] ?? '').trim()
        if (!referenciaOriginal && !producto) continue // fila vacía, se ignora sin contarla como error

        const referencia = normalizarReferencia(referenciaOriginal)
        if (!referencia) continue

        const { cantidad, estado, motivo } = validarCantidad(fila[mapeoFinal.cantidadDisponible])
        if (estado === 'ok') validas++
        else porVerificar++

        items.push({
          ref: doc(db, 'stock', referencia),
          data: {
            referencia,
            referenciaOriginal,
            producto: producto || '(sin descripción)',
            bodega: mapeoFinal.bodega ? String(fila[mapeoFinal.bodega] ?? '').trim() : '',
            unidad: mapeoFinal.unidad ? String(fila[mapeoFinal.unidad] ?? '').trim() : '',
            cantidadDisponible: cantidad,
            estado,
            motivoVerificar: motivo ?? null,
            ultimaActualizacion: serverTimestamp(),
          },
        })
      }

      if (items.length === 0) {
        setError('No se encontró ninguna fila válida con los campos mapeados. Revisa el mapeo de columnas.')
        setPaso('mapear')
        return
      }

      // Firestore permite máx. 500 operaciones por batch; se parte en lotes de 450 por margen.
      for (let i = 0; i < items.length; i += 450) {
        const lote = writeBatch(db)
        for (const { ref, data } of items.slice(i, i + 450)) {
          lote.set(ref, data, { merge: false })
        }
        await lote.commit()
      }

      await setDoc(doc(db, 'config', 'excelMapping'), mapeo)

      await setDoc(doc(collection(db, 'excelUploads')), {
        nombreArchivo,
        subidoPorUid: usuarioAuth.uid,
        subidoPorNombre: perfil.nombre,
        fecha: serverTimestamp(),
        totalFilas: items.length,
        filasValidas: validas,
        filasPorVerificar: porVerificar,
      })

      setResumen({ validas, porVerificar, total: items.length })
      setPaso('listo')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la información en Firebase.')
      setPaso('mapear')
    }
  }

  function reiniciar() {
    setPaso('elegir_archivo')
    setNombreArchivo('')
    setEncabezados([])
    setFilas([])
    setMapeo({})
    setResumen(null)
    setError(null)
  }

  return (
    <div className="tarjeta">
      <h2>Cargar Excel de disponibilidad</h2>
      <p className="texto-ayuda">
        Sube el Excel que descargas del sistema con lo disponible en bodega. Esto reemplaza la
        cantidad disponible de cada referencia con la cifra oficial de hoy. Los despachos que se
        registren durante el día se restan a partir de esta base hasta la próxima carga.
      </p>

      {error && <p className="texto-error">{error}</p>}

      {paso === 'elegir_archivo' && (
        <label className="boton-archivo">
          Seleccionar archivo (.xlsx, .xls)
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              const archivo = e.target.files?.[0]
              if (archivo) onArchivoSeleccionado(archivo)
            }}
          />
        </label>
      )}

      {paso === 'mapear' && (
        <div>
          <p>
            <strong>{nombreArchivo}</strong> — {filas.length} filas encontradas. Indica qué columna
            del Excel corresponde a cada dato (se recuerda para la próxima carga):
          </p>

          {[...CAMPOS_OBLIGATORIOS, ...CAMPOS_OPCIONALES].map(({ clave, etiqueta }) => (
            <label key={clave} className="campo-mapeo">
              {etiqueta} {CAMPOS_OBLIGATORIOS.some((c) => c.clave === clave) && <span className="obligatorio">*</span>}
              <select
                value={mapeo[clave] ?? ''}
                onChange={(e) => setMapeo((m) => ({ ...m, [clave]: e.target.value || undefined }))}
              >
                <option value="">— No usar —</option>
                {encabezados.map((enc) => (
                  <option key={enc} value={enc}>
                    {enc}
                  </option>
                ))}
              </select>
            </label>
          ))}

          <div className="fila-botones">
            <button className="boton-secundario" onClick={reiniciar}>
              Cancelar
            </button>
            <button onClick={confirmarCarga} disabled={!esMapeoCompleto(mapeo)}>
              Confirmar y cargar a Firebase
            </button>
          </div>
        </div>
      )}

      {paso === 'confirmando' && <p>Procesando y guardando en Firebase…</p>}

      {paso === 'listo' && resumen && (
        <div>
          <p className="texto-exito">
            Carga completa: {resumen.validas} referencias con dato confiable y{' '}
            {resumen.porVerificar} marcadas "por verificar" (de {resumen.total} en total).
          </p>
          {resumen.porVerificar > 0 && (
            <p className="texto-ayuda">
              Las referencias "por verificar" no se podrán despachar hasta que el dato sea
              correcto en una próxima carga.
            </p>
          )}
          <button className="boton-secundario" onClick={reiniciar}>
            Cargar otro archivo
          </button>
        </div>
      )}
    </div>
  )
}
