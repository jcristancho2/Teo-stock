import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { setGlobalOptions } from 'firebase-functions/v2'

initializeApp()
const db = getFirestore()
const auth = getAuth()

// Región más cercana a Colombia disponible en Cloud Functions v2.
setGlobalOptions({ region: 'us-east1' })

/**
 * Descuenta stock de una referencia dentro de una transacción atómica y deja
 * registro en "movimientos". Esta es la ÚNICA forma permitida de restar
 * cantidadDisponible — las reglas de Firestore bloquean la escritura directa
 * desde el cliente justamente para forzar que todo despacho pase por aquí.
 */
export const registrarDespacho = onCall(async (request) => {
  const auth_ = request.auth
  if (!auth_) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
  }
  const rol = auth_.token.role
  if (rol !== 'admin' && rol !== 'comercial') {
    throw new HttpsError('permission-denied', 'Tu usuario no tiene permiso para despachar.')
  }

  const { referencia, cantidad, cliente, nota } = request.data as {
    referencia?: string
    cantidad?: number
    cliente?: string
    nota?: string
  }

  if (typeof referencia !== 'string' || !referencia.trim()) {
    throw new HttpsError('invalid-argument', 'Falta la referencia.')
  }
  if (typeof cantidad !== 'number' || !Number.isFinite(cantidad) || cantidad <= 0) {
    throw new HttpsError('invalid-argument', 'La cantidad a despachar debe ser un número mayor a 0.')
  }

  const stockRef = db.collection('stock').doc(referencia)

  const resultado = await db.runTransaction(async (tx) => {
    const snap = await tx.get(stockRef)
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Esa referencia no existe en el inventario cargado.')
    }
    const data = snap.data()!
    if (data.estado === 'por_verificar') {
      throw new HttpsError(
        'failed-precondition',
        'El dato de esta referencia está marcado como "por verificar". Vuelve a descargar el Excel antes de despachar.'
      )
    }

    const actual = Number(data.cantidadDisponible)
    if (!Number.isFinite(actual) || actual < 0) {
      throw new HttpsError(
        'failed-precondition',
        'El dato de disponibilidad de esta referencia no es confiable. Vuelve a descargar el Excel.'
      )
    }
    if (cantidad > actual) {
      throw new HttpsError(
        'failed-precondition',
        `Solo hay ${actual} ${data.unidad || 'unidades'} disponibles. Si el cliente confirma el pedido, debe producirse.`
      )
    }

    const nuevaCantidad = actual - cantidad

    tx.update(stockRef, {
      cantidadDisponible: nuevaCantidad,
      ultimaActualizacion: FieldValue.serverTimestamp(),
    })

    const movRef = db.collection('movimientos').doc()
    tx.set(movRef, {
      referencia,
      producto: data.producto ?? '',
      cantidadDespachada: cantidad,
      cantidadAntes: actual,
      cantidadDespues: nuevaCantidad,
      usuarioUid: auth_.uid,
      usuarioNombre: auth_.token.name ?? auth_.token.email ?? 'desconocido',
      cliente: cliente ?? null,
      nota: nota ?? null,
      fecha: FieldValue.serverTimestamp(),
    })

    return { ok: true as const, cantidadDisponible: nuevaCantidad }
  })

  return resultado
})

/**
 * Crea un usuario comercial o administrador (Auth + Firestore + rol) sin
 * afectar la sesión del admin que lo está creando. Solo puede llamarla un
 * admin — el propio primer administrador se crea con scripts/setFirstAdmin.cjs.
 */
export const crearUsuario = onCall(async (request) => {
  const auth_ = request.auth
  if (!auth_ || auth_.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Solo un administrador puede crear usuarios.')
  }

  const { email, password, nombre, rol } = request.data as {
    email?: string
    password?: string
    nombre?: string
    rol?: 'admin' | 'comercial'
  }

  if (!email || !password || !nombre || (rol !== 'admin' && rol !== 'comercial')) {
    throw new HttpsError('invalid-argument', 'Faltan datos: correo, contraseña, nombre o rol.')
  }
  if (password.length < 6) {
    throw new HttpsError('invalid-argument', 'La contraseña debe tener al menos 6 caracteres.')
  }

  let registro
  try {
    registro = await auth.createUser({ email, password, displayName: nombre })
  } catch (err) {
    const codigo = (err as { code?: string }).code
    if (codigo === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Ya existe un usuario con ese correo.')
    }
    throw new HttpsError('internal', 'No se pudo crear el usuario en Firebase Authentication.')
  }

  await auth.setCustomUserClaims(registro.uid, { role: rol })
  await db.collection('users').doc(registro.uid).set({
    email,
    nombre,
    rol,
    activo: true,
    creadoEn: FieldValue.serverTimestamp(),
  })

  return { ok: true, uid: registro.uid }
})

/**
 * Mantiene sincronizados los custom claims de Firebase Auth (de donde leen
 * las reglas de Firestore y esta misma función) con el documento
 * users/{uid} en Firestore. Así, si un admin cambia el rol o desactiva a
 * alguien editando el documento directamente, el permiso real se actualiza solo.
 */
export const syncUserRoleClaim = onDocumentWritten('users/{uid}', async (event) => {
  const uid = event.params.uid
  const despues = event.data?.after?.data()

  if (!despues) {
    // Documento borrado: no tocamos el usuario de Auth, solo quitamos el rol.
    await auth.setCustomUserClaims(uid, { role: null }).catch(() => undefined)
    return
  }

  await auth.setCustomUserClaims(uid, { role: despues.rol ?? null })
  await auth.updateUser(uid, { disabled: despues.activo === false }).catch(() => undefined)
})
