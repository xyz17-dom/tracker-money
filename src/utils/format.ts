import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

// 25000 -> "25.000"
export function formatRibuan(angka: number): string {
  return new Intl.NumberFormat('id-ID').format(angka)
}

// 25000 -> "Rp 25.000"
export function formatRupiah(angka: number): string {
  return 'Rp ' + formatRibuan(angka)
}

// "Rp 25.0a0" -> 2500. Hanya angka yang diambil, maksimal 10 digit.
export function hanyaAngka(teks: string): number {
  return Number(teks.replace(/\D/g, '').slice(0, 10))
}

// Tanggal lokal perangkat, bentuk 'YYYY-MM-DD'
export function todayString(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

//"2026-11-03" -> "Hari ini" / "Kemarin" / "senin, 2 Nov 2026"
export function labelHari(tanggal:string): string {
  const d = parseISO (tanggal)
  if (isToday (d)) return 'Hari ini'
  if (isYesterday(d)) return 'Kemarin'
  return format(d, 'EEE, d MMM yyyy', { locale: id})
}

// ("2026-11-02", "2026-11-08") -> "2 Nov – 8 Nov 2026"
export function labelRentang(mulai: string, akhir: string): string {
  const a = format(parseISO(mulai), 'd MMM', { locale: id })
  const b = format(parseISO(akhir), 'd MMM yyyy', { locale: id })
  return `${a} – ${b}`
}