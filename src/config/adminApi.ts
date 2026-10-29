// Backend mínimo con Admin SDK (ver server/), desplegado aparte en Render: hace lo que el
// navegador no puede hacer solo — crear/eliminar cuentas de Authentication de verdad, y
// iniciar sesión solo con correo. Suple a las Cloud Functions del repo, que no pueden
// desplegar en el plan Spark de Firebase.
export const URL_API_ADMIN = import.meta.env.VITE_ADMIN_API_URL || 'https://teo-stock-admin-api.onrender.com'
