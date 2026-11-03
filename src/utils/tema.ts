export type Tema = 'system' | 'light' | 'dark'

const KUNCI = 'tema'
const MQ = '(prefers-color-scheme: dark)'

export function bacaTema(): Tema {
  try {
    const nilai = localStorage.getItem(KUNCI)
    if (nilai === 'light' || nilai === 'dark' || nilai === 'system') return nilai
  } catch {
    // penyimpanan tidak tersedia: pakai bawaan
  }
  return 'system'
}

// Memasang atribut data-theme di <html>; CSS di index.css yang mengubah warnanya
export function terapkanTema(tema: Tema) {
  const gelap = tema === 'dark' || (tema === 'system' && matchMedia(MQ).matches)
  document.documentElement.dataset.theme = gelap ? 'dark' : 'light'
}

export function simpanTema(tema: Tema) {
  try {
    localStorage.setItem(KUNCI, tema)
  } catch {
    // tetap diterapkan untuk sesi ini
  }
  terapkanTema(tema)
}

// Pada pilihan "Ikuti sistem", tampilan ikut berubah saat HP berpindah mode
export function pantauSistem() {
  matchMedia(MQ).addEventListener('change', () => {
    if (bacaTema() === 'system') terapkanTema('system')
  })
}