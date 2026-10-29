// Backend mínimo con Admin SDK, solo para lo que el navegador no puede hacer solo:
// crear usuarios sin desloguear al admin que los crea, y borrar DE VERDAD una cuenta
// de Firebase Authentication (el SDK de cliente nunca puede borrar la cuenta de OTRA
// persona). Suple a las Cloud Functions del repo, que no pueden desplegar en el plan
// Spark de Firebase (requieren Blaze). Se despliega como Web Service en Render (plan
// gratis) con rootDir "server".
const express = require('express')
const cors = require('cors')
const { initializeApp, cert } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')

const credencialesJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
if (!credencialesJson) {
  console.error('Falta la variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON (el contenido de service-account.json).')
  process.exit(1)
}

initializeApp({ credential: cert(JSON.parse(credencialesJson)) })

const auth = getAuth()
const db = getFirestore()

const app = express()
app.use(express.json())

// Orígenes permitidos: el sitio en Render y el dev server local. ORIGENES_EXTRA
// (coma-separado) permite sumar otros sin tocar código, por ejemplo un dominio propio.
const origenesPermitidos = [
  'https://teo-stock.onrender.com',
  'http://localhost:5173',
  ...(process.env.ORIGENES_EXTRA ? process.env.ORIGENES_EXTRA.split(',').map((o) => o.trim()) : []),
]
app.use(cors({ origin: origenesPermitidos }))

/**
 * Exige un Firebase ID token válido en Authorization: Bearer <token>, y que el perfil
 * de ese usuario en Firestore diga rol == 'admin' y activo == true — el mismo criterio
 * que usan las reglas de Firestore, para que el backend nunca sea un atajo más permisivo
 * que la app.
 */
async function exigirAdmin(req, res, next) {
  try {
    const encabezado = req.headers.authorization ?? ''
    const token = encabezado.startsWith('Bearer ') ? encabezado.slice(7) : null
    if (!token) return res.status(401).json({ error: 'Falta el token de autenticación.' })

    const decodificado = await auth.verifyIdToken(token)
    const perfil = await db.collection('users').doc(decodificado.uid).get()
    if (!perfil.exists || perfil.data().rol !== 'admin' || perfil.data().activo !== true) {
      return res.status(403).json({ error: 'Solo un administrador activo puede hacer esto.' })
    }

    req.adminUid = decodificado.uid
    next()
  } catch (err) {
    console.error('Error verificando token:', err)
    res.status(401).json({ error: 'Token inválido o vencido.' })
  }
}

app.get('/', (_req, res) => {
  res.json({ ok: true, servicio: 'teo-stock-admin-api' })
})

/**
 * Login solo con correo, decisión explícita del cliente: sin contraseña, sin enlace ni código
 * de verificación — si el correo coincide con una cuenta activa (creada por un admin), entra.
 * ADVERTENCIA DE SEGURIDAD aceptada a propósito: cualquiera que sepa el correo de un compañero
 * puede entrar como él. Esto SÍ importa porque los despachos y cargas de Excel quedan firmados
 * con el nombre de quien los hizo — con este login, esa firma deja de ser confiable. Para
 * revertir, hay que exigir algún paso de verificación (enlace al correo, código, contraseña).
 */
app.post('/iniciar-sesion', async (req, res) => {
  const { email } = req.body ?? {}
  if (!email) return res.status(400).json({ error: 'Falta el correo.' })

  try {
    const usuario = await auth.getUserByEmail(String(email).trim())
    const perfil = await db.collection('users').doc(usuario.uid).get()
    if (!perfil.exists || perfil.data().activo !== true) {
      return res.status(403).json({ error: 'No hay una cuenta activa con ese correo. Pide a un administrador que te registre.' })
    }

    const token = await auth.createCustomToken(usuario.uid)
    res.json({ token })
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'No existe una cuenta con ese correo. Pide a un administrador que te registre.' })
    }
    console.error('Error iniciando sesión:', err)
    res.status(500).json({ error: 'No se pudo iniciar sesión.' })
  }
})

app.post('/usuarios', exigirAdmin, async (req, res) => {
  const { email, nombre, rol } = req.body ?? {}
  if (!email || !nombre || (rol !== 'admin' && rol !== 'comercial')) {
    return res.status(400).json({ error: 'Faltan datos o el rol no es válido.' })
  }

  try {
    // Sin contraseña a propósito: el login de Teo es solo con correo (ver /iniciar-sesion), la
    // cuenta de Authentication solo existe para tener un uid estable al que atar el perfil.
    let usuario
    try {
      usuario = await auth.createUser({ email, displayName: nombre })
    } catch (err) {
      if (err.code !== 'auth/email-already-exists') throw err

      // El correo ya tiene cuenta de Authentication. Si no tiene perfil en Firestore es una
      // cuenta huérfana (de un usuario "eliminado" antes, que solo borra el perfil) — se borra
      // de verdad y se reintenta, para que crear con el mismo correo funcione sin pasos extra.
      const existente = await auth.getUserByEmail(email)
      const perfilExistente = await db.collection('users').doc(existente.uid).get()
      if (perfilExistente.exists) {
        return res.status(409).json({ error: 'Ese correo ya está en uso por un usuario del sistema.' })
      }
      await auth.deleteUser(existente.uid)
      usuario = await auth.createUser({ email, displayName: nombre })
    }

    await db.collection('users').doc(usuario.uid).set({
      email,
      nombre,
      rol,
      activo: true,
      creadoEn: FieldValue.serverTimestamp(),
    })

    res.status(201).json({ uid: usuario.uid })
  } catch (err) {
    console.error('Error creando usuario:', err)
    res.status(500).json({ error: 'No se pudo crear el usuario.' })
  }
})

app.delete('/usuarios/:uid', exigirAdmin, async (req, res) => {
  const { uid } = req.params
  if (uid === req.adminUid) {
    return res.status(400).json({ error: 'No puedes eliminarte a ti mismo.' })
  }

  try {
    try {
      await auth.deleteUser(uid)
    } catch (err) {
      if (err.code !== 'auth/user-not-found') throw err
      // Ya no existía en Authentication (p. ej. borrado por fuera) — igual se limpia el perfil.
    }
    await db.collection('users').doc(uid).delete()
    res.status(204).end()
  } catch (err) {
    console.error('Error eliminando usuario:', err)
    res.status(500).json({ error: 'No se pudo eliminar el usuario.' })
  }
})

const puerto = process.env.PORT || 3000
app.listen(puerto, () => {
  console.log(`teo-stock-admin-api escuchando en el puerto ${puerto}`)
})
