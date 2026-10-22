# Teo — Disponibilidad de stock (Extrucol)

App web para que el equipo comercial consulte disponibilidad de inventario
sin tener que abrir el Excel del sistema cada vez, y para que el admin
cargue el Excel diario y gestione usuarios. Construida con **React + Vite +
TypeScript** en el frontend y **Firebase** (Auth, Firestore, Cloud
Functions, Hosting) como backend.

## Qué hace

- **Admin**: sube el Excel que se descarga del sistema cada día. La app
  detecta (o te deja indicar) qué columna es referencia, producto, cantidad
  disponible, bodega y unidad, y reemplaza la disponibilidad de cada
  referencia en Firestore.
- **Comercial**: ve la disponibilidad en tiempo real, busca por referencia
  o producto, y registra un **despacho** cuando separa unidades para un
  cliente. El stock se descuenta automáticamente en el momento, con una
  transacción atómica en el servidor (no hay forma de que dos despachos
  simultáneos dejen el número mal).
- **Datos dudosos** (negativos, vacíos, no numéricos) nunca se inventan: se
  marcan "por verificar" y no se pueden despachar hasta la próxima carga.
- Todo movimiento queda en un historial con usuario, fecha, cliente y
  cantidad.

## Por qué está hecho así (decisiones clave)

- **El descuento de stock nunca se escribe directo desde el navegador.**
  Pasa por la Cloud Function `registrarDespacho`, que corre en el servidor
  con permisos de administrador y hace la resta dentro de una transacción.
  Las reglas de Firestore (`firestore.rules`) bloquean explícitamente la
  escritura directa a `stock` y `movimientos` para que esto no se pueda
  saltar.
- **Los roles viven en dos lugares sincronizados**: el documento
  `users/{uid}` en Firestore (para mostrarlos y editarlos fácil en la app) y
  los *custom claims* de Firebase Auth (de donde leen las reglas de
  seguridad y las Cloud Functions). La función `syncUserRoleClaim` los
  mantiene sincronizados automáticamente.
- **El mapeo de columnas del Excel es configurable**, no está "quemado" en
  el código. Como todavía no había un ejemplo real del Excel de Extrucol al
  construir esto, el admin elige la primera vez qué columna es cuál, y la
  app lo recuerda para las próximas cargas (lo guarda en
  `config/excelMapping`). Si el sistema cambia los nombres de columna, se
  vuelve a mapear sin tocar código.

## Estructura del proyecto

```
src/            Frontend (React + TypeScript)
functions/      Cloud Functions (lógica de servidor)
scripts/        Script de una sola vez para crear el primer administrador
firestore.rules Reglas de seguridad de Firestore
firebase.json   Configuración de despliegue (Hosting, Functions, Firestore)
```

## Puesta en marcha

### 1. Crear el proyecto de Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com) y crea un proyecto nuevo.
2. **Authentication** → Sign-in method → habilita **Correo electrónico/contraseña**.
3. **Firestore Database** → crear base de datos, modo producción, la región más cercana (ej. `us-east1` o `southamerica-east1`).
4. **Configuración del proyecto** → **Tus apps** → agrega una app Web. Copia los valores que te da.
5. **Configuración del proyecto** → **Cuentas de servicio** → genera una nueva clave privada (se descarga un `.json`). Guárdala fuera del repo, por ejemplo como `service-account.json` en la raíz (ya está en `.gitignore`).
6. En **Uso y facturación**, cambia el proyecto al plan **Blaze** (pago por uso). Es obligatorio para que las Cloud Functions funcionen; para este volumen de uso normalmente te mantienes dentro de la capa gratuita.

### 2. Instalar dependencias

```bash
npm install
npm install --prefix scripts
npm install --prefix functions
```

### 3. Configurar las variables de entorno del frontend

```bash
cp .env.example .env
```

Y pega ahí los valores del paso 1.4.

### 4. Instalar la CLI de Firebase y enlazar el proyecto

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # elige el proyecto que creaste
```

### 5. Crear el primer administrador

Todavía no existe ningún admin que pueda crear usuarios desde la app, así
que el primero se crea con este script (usa la cuenta de servicio del paso 1.5):

```bash
FIREBASE_SERVICE_ACCOUNT=./service-account.json \
  node scripts/setFirstAdmin.cjs tu-correo@extrucol.com "Tu Nombre" "unaClaveTemporalSegura"
```

Desde ahí, ese usuario puede crear al resto (admins y comerciales) directamente en **Usuarios** dentro de la app.

### 6. Desplegar reglas y funciones

```bash
firebase deploy --only firestore:rules,functions
```

### 7. Correr en desarrollo

```bash
npm run dev
```

### 8. Publicar el frontend (cuando esté listo)

```bash
npm run build
firebase deploy --only hosting
```

## Uso diario

1. El admin inicia sesión → **Cargar Excel** → selecciona el archivo del día → confirma el mapeo de columnas (solo la primera vez, luego queda recordado) → confirma la carga.
2. El equipo comercial inicia sesión → **Disponibilidad** → busca la referencia → si hay stock, pulsa **Despachar**, indica cantidad (y opcionalmente cliente/nota) → el stock se descuenta al instante para todo el equipo.
3. Si una referencia no tiene stock, la app indica que si el cliente confirma el pedido, se debe producir — no deja despachar.
4. Si un dato se ve raro (negativo, vacío), queda "por verificar" y tampoco se puede despachar hasta la próxima carga del Excel.
5. **Historial** muestra todos los despachos con fecha, usuario y cliente.

## Pendiente para afinar con datos reales

- Cuando tengas un Excel real de Extrucol, prueba la carga una vez y ajusta
  el mapeo de columnas si la sugerencia automática no acierta exactamente.
- Si luego quieres que el Excel se traiga solo (sin subirlo a mano) desde el
  sistema de Extrucol, una copia en Google Drive/Sheets, o por API, eso se
  agrega como una fuente adicional sin cambiar el resto de la app — el
  resto de la lógica (validación, descuento, historial) queda igual.
