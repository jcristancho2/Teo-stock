#!/usr/bin/env node
/**
 * Crea (o promueve) al primer administrador del sistema.
 *
 * Esto es necesario SOLO una vez por proyecto de Firebase: la app normal
 * exige ser admin para crear usuarios, así que el primer admin se crea con
 * este script, usando una cuenta de servicio con permisos de Admin SDK
 * (fuera del alcance de las reglas de seguridad de Firestore).
 *
 * Uso:
 *   FIREBASE_SERVICE_ACCOUNT=./service-account.json \
 *     node scripts/setFirstAdmin.cjs admin@extrucol.com "Carlos Cruz" "unaClaveTemporal123"
 *
 * El archivo service-account.json se descarga en:
 *   Firebase Console → Configuración del proyecto → Cuentas de servicio →
 *   Generar nueva clave privada.
 * NUNCA se sube a git (ya está en .gitignore).
 */

const admin = require('firebase-admin')

const [, , email, nombre, password] = process.argv

if (!email || !nombre) {
  console.error('Uso: node scripts/setFirstAdmin.cjs <correo> "<nombre>" [contraseña]')
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
    console.log(`Usuario creado: ${usuario.uid}`)
  }

  await auth.setCustomUserClaims(usuario.uid, { role: 'admin' })
  await db.collection('users').doc(usuario.uid).set(
    {
      email,
      nombre,
      rol: 'admin',
      activo: true,
      creadoEn: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  console.log(`Listo: ${email} ya es administrador. Pídele que cierre y vuelva a iniciar sesión en la app.`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
