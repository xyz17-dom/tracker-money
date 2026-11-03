import { db } from './db'
import { simpanAnggaran } from './anggaranRepo'
import type { PeriodType } from '../services/anggaran'

export const KUNCI_PENGINGAT = 'pengingatBoros' // 'on' atau 'off'
export const KUNCI_ONBOARDING = 'onboardingSelesai' // 'ya'
export const KUNCI_FAVORIT = 'kategoriFavorit' // teks JSON, mis. "[1,3]"

export async function simpanPengaturan(key: string, value: string) {
  await db.settings.put({ key, value })
}

// Daftar id kategori favorit; data yang rusak dianggap kosong
export async function bacaFavorit(): Promise<number[]> {
  const s = await db.settings.get(KUNCI_FAVORIT)
  if (!s) return []
  try {
    const x: unknown = JSON.parse(s.value)
    return Array.isArray(x)
      ? x.filter((n): n is number => Number.isInteger(n))
      : []
  } catch {
    return []
  }
}

export async function lewatiOnboarding() {
  await simpanPengaturan(KUNCI_ONBOARDING, 'ya')
}

export async function selesaikanOnboarding(input: {
  periodType: PeriodType
  totalAmount: number
  favorit: number[]
}) {
  if (!Number.isInteger(input.totalAmount) || input.totalAmount <= 0) {
    throw new Error('Nominal harus bilangan bulat lebih dari 0')
  }
  // Satu transaksi database: semuanya tersimpan, atau tidak sama sekali
  await db.transaction('rw', db.budgets, db.settings, async () => {
    await simpanAnggaran(input.periodType, input.totalAmount)
    await simpanPengaturan(KUNCI_FAVORIT, JSON.stringify(input.favorit))
    await simpanPengaturan(KUNCI_ONBOARDING, 'ya')
  })
}