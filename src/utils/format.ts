import { format, isToday, isValid, isYesterday, parseISO, subDays } from 'date-fns'
import { id } from 'date-fns/locale'

export function formatRibuan(angka: number): string {
  return new Intl.NumberFormat('id-ID').format(angka)
}
export function formatRupiah(angka: number): string {
  return 'Rp ' + formatRibuan(angka)
}
export function hanyaAngka(teks: string): number {
  return Number(teks.replace(/\D/g, '').slice(0, 10))
}
export function todayString(): string {
  return format(new Date(), 'yyyy-MM-dd')
}
export function labelHari(tanggal: string): string {
  const d = parseISO(tanggal)
  if (isToday(d)) return 'Hari ini'
  if (isYesterday(d)) return 'Kemarin'
  return format(d, 'EEEE, d MMM yyyy', { locale: id })
}
export function labelRentang(mulai: string, akhir: string): string {
  const a = format(parseISO(mulai), 'd MMM', { locale: id })
  const b = format(parseISO(akhir), 'd MMM yyyy', { locale: id })
  return `${a} – ${b}`
}

// Tanggal kemarin, bentuk 'YYYY-MM-DD'
export function kemarinString(): string {
  return format(subDays(new Date(), 1), 'yyyy-MM-dd')
}

// 'YYYY-MM-DD' yang benar-benar ada di kalender (2026-02-30 ditolak)
export function tanggalValid(teks: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(teks)) return false
  const d = parseISO(teks)
  return isValid(d) && format(d, 'yyyy-MM-dd') === teks
}