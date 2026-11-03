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
