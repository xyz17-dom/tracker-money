import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/plus-jakarta-sans'
import './index.css'
import App from './App.tsx'
import { seedIfEmpty } from './db/db.ts'
import { bacaTema, pantauSistem, terapkanTema } from './utils/tema'

seedIfEmpty()
terapkanTema(bacaTema())
pantauSistem()
navigator.storage?.persist?.()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Layar pembuka (di index.html) ditampilkan minimal sekitar 0,9 detik supaya
// geraknya sempat terlihat, lalu memudar. Pada pengguna yang memilih "kurangi
// gerak", layar pembuka langsung disembunyikan.
const splash = document.getElementById('splash')
if (splash) {
  const kurangiGerak = matchMedia('(prefers-reduced-motion: reduce)').matches
  const sisaWaktu = kurangiGerak ? 0 : Math.max(0, 900 - performance.now())
  setTimeout(() => {
    splash.classList.add('selesai')
    setTimeout(() => splash.remove(), 450)
  }, sisaWaktu)
}