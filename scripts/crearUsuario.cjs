#!/usr/bin/env node
/**
 * Crea (o actualiza el rol de) un usuario directo con el Admin SDK, sin pasar
 * por la Cloud Function `crearUsuario` del repo (requiere plan Blaze).
 * Úsalo en plan Spark para dev local: crea el usuario en Auth, el perfil en
 * Firestore y el custom claim de rol, igual que haría la función real.
 *
 * Uso:
 *   FIREBASE_SERVICE_ACCOUNT=./service-account.json \
 *     node scripts/crearUsuario.cjs correo@ejemplo.com "Nombre Apellido" claveTemporal123 comercial
 *
 * El rol es "admin" o "comercial" (por defecto "comercial" si se omite).
 */

const admin = require('firebase-admin')

const [, , email, nombre, password, rolArg] = process.argv
const rol = rolArg === 'admin' ? 'admin' : 'comercial'

if (!email || !nombre) {
  console.error('Uso: node scripts/crearUsuario.cjs <correo> "<nombre>" [contraseña] [admin|comercial]')
  process.exit(1)
}

const credencialesPath = process.env.FIREBASE_SERVICE_ACCOUNT
if (!credencialesPath) {
  console.error('Falta la variable de entorno FIREBASE_SERVICE_ACCOUNT con la ruta al JSON de la cuenta de servicio.')
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert(require(require('path').resolve(credencialesPath))),
})

async function main() {
  const auth = admin.auth()
  const db = admin.firestore()

  let usuario
  try {
    usuario = await auth.getUserByEmail(email)
    console.log(`Usuario existente encontrado: ${usuario.uid}`)
  } catch {
    if (!password) {
      console.error('El usuario no existe aún en Authentication. Debes indicar una contraseña inicial como tercer argumento.')
      process.exit(1)
    }
    usuario = await auth.createUser({ email, password, displayName: nombre })
    console.log(`Usuario creado en Auth: ${usuario.uid}`)
  }

  await auth.setCustomUserClaims(usuario.uid, { role: rol })
  await db.collection('users').doc(usuario.uid).set(
    {
      email,
      nombre,
      rol,
      activo: true,
      creadoEn: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  console.log(`Listo: ${email} es "${rol}". Pídele que cierre y vuelva a iniciar sesión en la app.`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
