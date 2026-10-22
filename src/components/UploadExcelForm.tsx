import { useEffect, useMemo, useState } from 'react'
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
  { clave: 'tipoProducto', etiqueta: 'Tipo de producto' },
]

type Paso = 'elegir_archivo' | 'mapear' | 'confirmando' | 'listo'

/** Checkbox de valores distintos detectados en una columna, para filtrar qué filas entran a la carga. */
function SelectorMultiple({
  titulo,
  ayuda,
  opciones,
  seleccionados,
  onCambiar,
}: {
  titulo: string
  ayuda: string
  opciones: string[]
  seleccionados: string[]
  onCambiar: (valores: string[]) => void
}) {
  function alternar(valor: string) {
    onCambiar(
      seleccionados.includes(valor) ? seleccionados.filter((v) => v !== valor) : [...seleccionados, valor]
    )
  }

  return (
    <div className="campo-mapeo">
      <p className="texto-ayuda">{ayuda}</p>
      <strong>{titulo}</strong>
      <div className="lista-checks">
        {opciones.map((valor) => (
          <label key={valor} className="opcion-check">
            <input
              type="checkbox"
              checked={seleccionados.includes(valor)}
              onChange={() => alternar(valor)}
            />
            {valor}
          </label>
        ))}
      </div>
    </div>
  )
}

export function UploadExcelForm() {
  const { usuarioAuth, perfil } = useAuth()
  const [paso, setPaso] = useState<Paso>('elegir_archivo')
  const [nombreArchivo, setNombreArchivo] = useState('')
  const [encabezados, setEncabezados] = useState<string[]>([])
  const [filas, setFilas] = useState<FilaExcelCruda[]>([])
  const [mapeo, setMapeo] = useState<Partial<MapeoColumnasExcel>>({})
  const [error, setError] = useState<string | null>(null)
  const [resumen, setResumen] = useState<{
    validas: number
    porVerificar: number
    total: number
    omitidasPorBodega: number
    omitidasPorTipo: number
  } | null>(null)

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
      const columnasGuardadas = guardado
        ? [guardado.referencia, guardado.producto, guardado.cantidadDisponible, guardado.bodega, guardado.unidad, guardado.tipoProducto]
        : []
      const base =
        guardado && columnasGuardadas.every((v) => !v || encabezados.includes(v)) ? guardado : sugerido

      setMapeo(base)
      setPaso('mapear')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer el archivo.')
    }
  }

  // Valores distintos de las columnas de bodega / tipo de producto mapeadas, para avisar si el
  // Excel trae varias y armar los checkboxes de filtro.
  const bodegasDetectadas = useMemo(() => {
    if (!mapeo.bodega) return []
    const vistos = new Set<string>()
    for (const fila of filas) {
      const valor = String(fila[mapeo.bodega] ?? '').trim()
      if (valor) vistos.add(valor)
    }
    return Array.from(vistos).sort()
  }, [filas, mapeo.bodega])

  const tiposDetectados = useMemo(() => {
    if (!mapeo.tipoProducto) return []
    const vistos = new Set<string>()
    for (const fila of filas) {
      const valor = String(fila[mapeo.tipoProducto] ?? '').trim()
      if (valor) vistos.add(valor)
    }
    return Array.from(vistos).sort()
  }, [filas, mapeo.tipoProducto])

  // Al mapear por primera vez la columna de tipo de producto, preselecciona los tipos que
  // suenan a "producto terminado" (lo que de verdad se puede despachar) como punto de partida.
  useEffect(() => {
    if (tiposDetectados.length > 0 && mapeo.filtroTiposProducto === undefined) {
      const sugeridos = tiposDetectados.filter((t) => t.toLowerCase().includes('terminado'))
      if (sugeridos.length > 0) setMapeo((m) => ({ ...m, filtroTiposProducto: sugeridos }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiposDetectados])

  function esMapeoCompleto(m: Partial<MapeoColumnasExcel>): m is MapeoColumnasExcel {
    if (!CAMPOS_OBLIGATORIOS.every((c) => !!m[c.clave])) return false
    // Si hay más de una bodega en el Excel, elegir cuáles cuentan es obligatorio para no sumar
    // o pisar datos de bodegas que no son de disponibilidad comercial (materia prima, tránsito...).
    if (m.bodega && bodegasDetectadas.length > 1 && !(m.filtroBodegas && m.filtroBodegas.length > 0)) {
      return false
    }
    return true
  }

  async function confirmarCarga() {
    if (!esMapeoCompleto(mapeo) || !usuarioAuth || !perfil) return
    const mapeoFinal: MapeoColumnasExcel = mapeo
    setPaso('confirmando')
    setError(null)
    try {
      const filtroBodegas = new Set((mapeoFinal.filtroBodegas ?? []).map((v) => v.toLowerCase()))
      const filtroTipos = new Set((mapeoFinal.filtroTiposProducto ?? []).map((v) => v.toLowerCase()))
      let omitidasPorBodega = 0
      let omitidasPorTipo = 0

      interface Acumulado {
        referenciaOriginal: string
        producto: string
        unidad: string
        cantidad: number
        estado: 'ok' | 'por_verificar'
        motivo?: string
        bodegas: Set<string>
      }
      const acumulados = new Map<string, Acumulado>()

      for (const fila of filas) {
        if (filtroBodegas.size > 0 && mapeoFinal.bodega) {
          const bodegaFila = String(fila[mapeoFinal.bodega] ?? '').trim().toLowerCase()
          if (!filtroBodegas.has(bodegaFila)) {
            omitidasPorBodega++
            continue
          }
        }
        if (filtroTipos.size > 0 && mapeoFinal.tipoProducto) {
          const tipoFila = String(fila[mapeoFinal.tipoProducto] ?? '').trim().toLowerCase()
          if (!filtroTipos.has(tipoFila)) {
            omitidasPorTipo++
            continue
          }
        }

        const referenciaOriginal = String(fila[mapeoFinal.referencia] ?? '').trim()
        const producto = String(fila[mapeoFinal.producto] ?? '').trim()
        if (!referenciaOriginal && !producto) continue // fila vacía, se ignora sin contarla como error

        const referencia = normalizarReferencia(referenciaOriginal)
        if (!referencia) continue

        const { cantidad, estado, motivo } = validarCantidad(fila[mapeoFinal.cantidadDisponible])
        const bodegaValor = mapeoFinal.bodega ? String(fila[mapeoFinal.bodega] ?? '').trim() : ''
        const unidadValor = mapeoFinal.unidad ? String(fila[mapeoFinal.unidad] ?? '').trim() : ''

        const existente = acumulados.get(referencia)
        if (!existente) {
          acumulados.set(referencia, {
            referenciaOriginal,
            producto: producto || '(sin descripción)',
            unidad: unidadValor,
            cantidad,
            estado,
            motivo,
            bodegas: new Set(bodegaValor ? [bodegaValor] : []),
          })
        } else {
          // Misma referencia en más de una bodega filtrada: se suma la cantidad disponible
          // entre sedes. Si cualquiera de las filas que la componen es dudosa, el total
          // también queda "por verificar" — nunca se promedia ni se ignora el dato malo.
          existente.cantidad += cantidad
          if (estado === 'por_verificar') {
            existente.estado = 'por_verificar'
            existente.motivo = existente.motivo ?? motivo ?? 'Dato inconsistente entre bodegas'
          }
          if (bodegaValor) existente.bodegas.add(bodegaValor)
        }
      }

      if (acumulados.size === 0) {
        setError(
          filtroBodegas.size > 0 || filtroTipos.size > 0
            ? 'Ninguna fila coincidió con los filtros de bodega/tipo de producto elegidos.'
            : 'No se encontró ninguna fila válida con los campos mapeados. Revisa el mapeo de columnas.'
        )
        setPaso('mapear')
        return
      }

      let validas = 0
      let porVerificar = 0
      const items: { ref: ReturnType<typeof doc>; data: Record<string, unknown> }[] = []
      for (const [referencia, info] of acumulados) {
        if (info.estado === 'ok') validas++
        else porVerificar++
        items.push({
          ref: doc(db, 'stock', referencia),
          data: {
            referencia,
            referenciaOriginal: info.referenciaOriginal,
            producto: info.producto,
            bodega: Array.from(info.bodegas).sort().join(', '),
            unidad: info.unidad,
            cantidadDisponible: info.cantidad,
            estado: info.estado,
            motivoVerificar: info.motivo ?? null,
            ultimaActualizacion: serverTimestamp(),
          },
        })
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

      setResumen({ validas, porVerificar, total: items.length, omitidasPorBodega, omitidasPorTipo })
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

          {mapeo.bodega && bodegasDetectadas.length > 1 && (
            <SelectorMultiple
              titulo="Bodegas que cuentan como disponible para el equipo comercial *"
              ayuda={`Este Excel trae ${bodegasDetectadas.length} bodegas distintas en la columna "${mapeo.bodega}". Si una referencia aparece en varias de las que marques, sus cantidades se suman. Las bodegas que no marques (materia prima, tránsito, calidad, consignación...) se ignoran.`}
              opciones={bodegasDetectadas}
              seleccionados={mapeo.filtroBodegas ?? []}
              onCambiar={(valores) => setMapeo((m) => ({ ...m, filtroBodegas: valores }))}
            />
          )}

          {mapeo.tipoProducto && tiposDetectados.length > 1 && (
            <SelectorMultiple
              titulo="Tipos de producto que se pueden despachar (opcional)"
              ayuda={`Esta columna trae ${tiposDetectados.length} tipos distintos. Sin marcar ninguno, se cargan todos. Preseleccionamos los que suenan a "producto terminado".`}
              opciones={tiposDetectados}
              seleccionados={mapeo.filtroTiposProducto ?? []}
              onCambiar={(valores) => setMapeo((m) => ({ ...m, filtroTiposProducto: valores }))}
            />
          )}

          <div className="fila-botones">
            <button className="boton-secundario" onClick={reiniciar}>
              Cancelar
            </button>
            <button onClick={confirmarCarga} disabled={!esMapeoCompleto(mapeo)}>
              Confirmar y cargar a Firebase
            </button>
          </div>
          {!esMapeoCompleto(mapeo) && mapeo.bodega && bodegasDetectadas.length > 1 && (
            <p className="texto-ayuda">Elige al menos una bodega arriba para poder confirmar.</p>
          )}
        </div>
      )}

      {paso === 'confirmando' && <p>Procesando y guardando en Firebase…</p>}

      {paso === 'listo' && resumen && (
        <div>
          <p className="texto-exito">
            Carga completa: {resumen.validas} referencias con dato confiable y{' '}
            {resumen.porVerificar} marcadas "por verificar" (de {resumen.total} en total).
          </p>
          {resumen.omitidasPorBodega > 0 && (
            <p className="texto-ayuda">
              Se omitieron {resumen.omitidasPorBodega} filas de bodegas fuera del filtro.
            </p>
          )}
          {resumen.omitidasPorTipo > 0 && (
            <p className="texto-ayuda">
              Se omitieron {resumen.omitidasPorTipo} filas de tipos de producto fuera del filtro.
            </p>
          )}
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
