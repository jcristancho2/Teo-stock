#!/usr/bin/env node
/**
 * Borra DE VERDAD un usuario: la cuenta de Firebase Authentication y su
 * perfil en Firestore. El botón "Eliminar" del panel de admin solo borra el
 * perfil (el navegador no puede borrar cuentas de Authentication ajenas sin
 * Admin SDK) — por eso el correo sigue "ocupado" y "Crear usuario" falla con
 * "ya existe" si lo intentas de nuevo desde el panel. Corre este script
 * cuando quieras liberar el correo del todo.
 *
 * Uso:
 *   FIREBASE_SERVICE_ACCOUNT=./service-account.json \
 *     node scripts/eliminarUsuario.cjs correo@ejemplo.com
 */

const admin = require('firebase-admin')

const [, , email] = process.argv

if (!email) {
  console.error('Uso: node scripts/eliminarUsuario.cjs <correo>')
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

  let usuario = null
  try {
    usuario = await auth.getUserByEmail(email)
  } catch {
    console.log('No hay ninguna cuenta de Authentication con ese correo. Nada que borrar ahí.')
  }

  if (usuario) {
    await auth.deleteUser(usuario.uid)
    console.log(`Cuenta de Authentication borrada: ${usuario.uid}`)
    await db.collection('users').doc(usuario.uid).delete()
    console.log('Perfil en Firestore borrado (si existía).')
  }

  console.log(`Listo: ${email} queda libre para crear de nuevo desde el panel.`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
