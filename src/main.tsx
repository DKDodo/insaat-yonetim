import '@fontsource/dancing-script/latin-ext-600.css'
import '@fontsource/dancing-script/latin-600.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'
import { kancalariKur } from './lib/esitleme'
import { temaBaslat } from './lib/tema'

temaBaslat()

/* Bulut eşitlemesi için her yerel yazmayı işaretleyen kancalar; ilk yazmadan önce kurulmalı. */
kancalariKur()

/* Tarayıcının verileri kendiliğinden silmemesi için kalıcı depolama iste. */
navigator.storage?.persist?.().catch(() => {})

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
