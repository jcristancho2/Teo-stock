import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'

// Todos los valores vienen de variables de entorno (.env). Ver .env.example.
// Nunca se pone la config "a mano" aquí: así el mismo código sirve para
// cualquier proyecto de Firebase (pruebas, producción) sin tocar código.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

if (!firebaseConfig.apiKey) {
  // Falla rápido y con un mensaje claro en vez de un error críptico de Firebase.
  console.error(
    '[Teo] Falta la configuración de Firebase. Copia .env.example a .env y completa los valores de tu proyecto.'
  )
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app)
