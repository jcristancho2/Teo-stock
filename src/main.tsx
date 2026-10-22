import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './styles/global.css'
import { aplicarTema, obtenerTemaInicial } from './utils/tema'

registerSW({ immediate: true })

// Aplica el tema antes del primer render para evitar el parpadeo claro→oscuro.
aplicarTema(obtenerTemaInicial())

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
