import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays
} from 'date-fns'
import { id } from 'date-fns/locale'
import type { Transaction } from '../db/db'
import { formatRupiah } from '../utils/format'

export type PeriodType = 'weekly' | 'monthly'

// Batas persen untuk mulai memberi peringatan
export const AMBANG_PERINGATAN = 80

export type Periode = { mulai: string; akhir: string }

const fmt = (d: Date) => format(d, 'yyyy-MM-dd')

// Mingguan: Senin sampai Minggu. Bulanan: tanggal 1 sampai akhir bulan.
export function rentangPeriode(tipe: PeriodType, hariIni: string): Periode {
  const d = parseISO(hariIni)
  if (tipe === 'weekly') {
    const mulai = startOfWeek(d, { weekStartsOn: 1 })
    return { mulai: fmt(mulai), akhir: fmt(addDays(mulai, 6)) }
  }
  return { mulai: fmt(startOfMonth(d)), akhir: fmt(endOfMonth(d)) }
}

export function persen(terpakai: number, batas: number): number {
  if (batas <= 0) return 0
  return Math.round((terpakai / batas) * 100)
}

export type Ringkasan = {
  periode: Periode
  total: number
  terpakai: number
  sisa: number // bisa negatif jika melebihi anggaran
  sisaHari: number // termasuk hari ini
  bolehHariIni: number // jatah harian di awal hari ini
  terpakaiHariIni: number
  sisaHariIni: number // bisa negatif jika jatah hari ini terlewati
  terpakaiPerKategori: Map<number, number>
}

export function hitungRingkasan(
  transaksi: Transaction[],
  tipe: PeriodType,
  total: number,
  hariIni: string,
): Ringkasan {
  const periode = rentangPeriode(tipe, hariIni)

  // Hanya pengeluaran di dalam periode yang dihitung
  const dalam = transaksi.filter(
    (t) =>
      t.type === 'expense' && t.date >= periode.mulai && t.date <= periode.akhir,
  )

  let terpakai = 0
  let sebelumHariIni = 0
  let terpakaiHariIni = 0
  const terpakaiPerKategori = new Map<number, number>()

  for (const t of dalam) {
    terpakai += t.amount
    if (t.date < hariIni) sebelumHariIni += t.amount
    if (t.date === hariIni) terpakaiHariIni += t.amount
    terpakaiPerKategori.set(
      t.categoryId,
      (terpakaiPerKategori.get(t.categoryId) ?? 0) + t.amount,
    )
  }

  const sisaHari =
    differenceInCalendarDays(parseISO(periode.akhir), parseISO(hariIni)) + 1

  // Jatah hari ini = (anggaran - pengeluaran sebelum hari ini) dibagi sisa hari
  const bolehHariIni = Math.max(
    0,
    Math.floor((total - sebelumHariIni) / sisaHari),
  )

  return {
    periode,
    total,
    terpakai,
    sisa: total - terpakai,
    sisaHari,
    bolehHariIni,
    terpakaiHariIni,
    sisaHariIni: bolehHariIni - terpakaiHariIni,
    terpakaiPerKategori,
  }
}

// ---------- Data grafik batang ----------

export type HariBatang = { tanggal: string; label: string; jumlah: number }

// Total pengeluaran per hari untuk `jumlah` hari berakhir di hari ini
export function pengeluaranHarian(
  transaksi: Transaction[],
  hariIni: string,
  jumlah = 7,
): HariBatang[] {
  const akhir = parseISO(hariIni)
  const hasil: HariBatang[] = []
  for (let i = jumlah - 1; i >= 0; i--) {
    const d = subDays(akhir, i)
    const tanggal = fmt(d)
    const total = transaksi
      .filter((t) => t.type === 'expense' && t.date === tanggal)
      .reduce((jumlahAwal, t) => jumlahAwal + t.amount, 0)
    hasil.push({ tanggal, label: format(d, 'EEEEE', { locale: id }), jumlah: total })
  }
  return hasil
}

// ---------- Peringatan boros ----------

export type Peringatan = {
  kunci: string // unik per periode dan tingkat, dipakai untuk menutup banner
  judul: string
  detail: string
  berat: boolean // true = sudah melewati 100%
}

const rp = formatRupiah

export function cariPeringatan(
  r: Ringkasan,
  batas: Map<number, number>,
  nama: Map<number, string>,
): Peringatan[] {
  const hasil: Peringatan[] = []
  const awal = r.periode.mulai

  // 1. Total anggaran periode
  if (r.total > 0) {
    const p = persen(r.terpakai, r.total)
    if (p >= 100) {
      hasil.push({
        kunci: `${awal}:total:100`,
        judul: 'Anggaran periode ini sudah habis',
        detail:
          r.terpakai > r.total
            ? `Melebihi ${rp(r.terpakai - r.total)}.`
            : 'Tidak ada sisa lagi.',
        berat: true,
      })
    } else if (p >= AMBANG_PERINGATAN) {
      hasil.push({
        kunci: `${awal}:total:80`,
        judul: `Anggaran sudah ${p}% terpakai`,
        detail: `Sisa ${rp(r.sisa)} untuk ${r.sisaHari} hari.`,
        berat: false,
      })
    }
  }

  // 2. Batas per kategori
  for (const [idKategori, limit] of batas) {
    if (limit <= 0) continue
    const terpakai = r.terpakaiPerKategori.get(idKategori) ?? 0
    const p = persen(terpakai, limit)
    const namaKategori = nama.get(idKategori) ?? 'Kategori'
    if (p >= 100) {
      hasil.push({
        kunci: `${awal}:kat${idKategori}:100`,
        judul: `${namaKategori} sudah melebihi batas`,
        detail:
          terpakai > limit
            ? `Lebih ${rp(terpakai - limit)} dari batas ${rp(limit)}.`
            : `Batas ${rp(limit)} sudah terpakai seluruhnya.`,
        berat: true,
      })
    } else if (p >= AMBANG_PERINGATAN) {
      hasil.push({
        kunci: `${awal}:kat${idKategori}:80`,
        judul: `${namaKategori} sudah ${p}% dari anggaran`,
        detail: `Sisa ${rp(limit - terpakai)} sampai akhir periode.`,
        berat: false,
      })
    }
  }

  // 3. Jatah harian terlewati (hanya jika anggaran total belum habis)
  if (r.total > 0 && r.bolehHariIni > 0 && r.sisaHariIni < 0) {
    hasil.push({
      kunci: `${awal}:harian:${r.sisaHari}`,
      judul: 'Pengeluaran hari ini melebihi jatah',
      detail: `Lebih ${rp(-r.sisaHariIni)} dari jatah ${rp(r.bolehHariIni)}.`,
      berat: false,
    })
  }

  // Yang paling serius di atas
  return hasil.sort((a, b) => Number(b.berat) - Number(a.berat))
}