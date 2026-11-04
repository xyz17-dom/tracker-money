import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'
import type {
  Budget,
  BudgetCategory,
  Category,
  Source,
  Transaction,
} from '../db/db'
import { labelRentang } from '../utils/format'
import { hitungRingkasan } from './anggaran'

export type BarisTransaksi = {
  tanggal: string // 'YYYY-MM-DD'
  jenis: 'Pemasukan' | 'Pengeluaran'
  kategori: string
  sumber: string
  catatan: string
  nominal: number
}

export type BarisBulan = {
  bulan: string
  pemasukan: number
  pengeluaran: number
  selisih: number
}

export type BarisKategori = { kategori: string; jumlah: number; total: number }

export type BarisAnggaran = {
  kategori: string
  batas: number
  terpakai: number
  sisa: number
}

export type Laporan = {
  transaksi: BarisTransaksi[]
  perBulan: BarisBulan[]
  perKategori: BarisKategori[]
  anggaran: {
    diatur: boolean
    periode: string
    rentang: string
    total: number
    terpakai: number
    sisa: number
    baris: BarisAnggaran[]
  }
}

export type Masukan = {
  transaksi: Transaction[]
  categories: Category[]
  sources: Source[]
  budget: Budget | undefined
  limits: BudgetCategory[]
  hariIni: string // 'YYYY-MM-DD'
}

// Fungsi murni: menyusun isi laporan dari data, tanpa menyentuh database
export function susunLaporan(m: Masukan): Laporan {
  const namaKategori = new Map(m.categories.map((c) => [c.id, c.name] as const))
  const namaSumber = new Map(m.sources.map((s) => [s.id, s.name] as const))

  // Urut kronologis: tanggal terlama dulu, lalu waktu pencatatan
  const urut = [...m.transaksi].sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt,
  )

  const transaksi: BarisTransaksi[] = urut.map((t) => ({
    tanggal: t.date,
    jenis: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    kategori: namaKategori.get(t.categoryId) ?? 'Tanpa kategori',
    sumber: namaSumber.get(t.sourceId) ?? 'Tanpa sumber',
    catatan: t.note,
    nominal: t.amount,
  }))

  // Ringkasan per bulan
  const bulanMap = new Map<string, { masuk: number; keluar: number }>()
  for (const t of urut) {
    const kunci = t.date.slice(0, 7) // 'YYYY-MM'
    const sel = bulanMap.get(kunci) ?? { masuk: 0, keluar: 0 }
    if (t.type === 'income') sel.masuk += t.amount
    else sel.keluar += t.amount
    bulanMap.set(kunci, sel)
  }
  const perBulan: BarisBulan[] = [...bulanMap]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([kunci, v]) => ({
      bulan: format(parseISO(`${kunci}-01`), 'MMMM yyyy', { locale: id }),
      pemasukan: v.masuk,
      pengeluaran: v.keluar,
      selisih: v.masuk - v.keluar,
    }))

  // Pengeluaran per kategori (sepanjang waktu), terbesar dulu
  const kategoriMap = new Map<number, { jumlah: number; total: number }>()
  for (const t of urut) {
    if (t.type !== 'expense') continue
    const sel = kategoriMap.get(t.categoryId) ?? { jumlah: 0, total: 0 }
    sel.jumlah += 1
    sel.total += t.amount
    kategoriMap.set(t.categoryId, sel)
  }
  const perKategori: BarisKategori[] = [...kategoriMap]
    .map(([idKategori, v]) => ({
      kategori: namaKategori.get(idKategori) ?? 'Tanpa kategori',
      jumlah: v.jumlah,
      total: v.total,
    }))
    .sort((a, b) => b.total - a.total)

  // Anggaran periode berjalan
  if (!m.budget) {
    return {
      transaksi,
      perBulan,
      perKategori,
      anggaran: {
        diatur: false,
        periode: '',
        rentang: '',
        total: 0,
        terpakai: 0,
        sisa: 0,
        baris: [],
      },
    }
  }

  const r = hitungRingkasan(
    m.transaksi,
    m.budget.periodType,
    m.budget.totalAmount,
    m.hariIni,
  )
  const batasMap = new Map(m.limits.map((l) => [l.categoryId, l.limitAmount] as const))
  const baris: BarisAnggaran[] = m.categories
    .filter((c) => (batasMap.get(c.id) ?? 0) > 0)
    .map((c) => {
      const batas = batasMap.get(c.id) ?? 0
      const terpakai = r.terpakaiPerKategori.get(c.id) ?? 0
      return { kategori: c.name, batas, terpakai, sisa: batas - terpakai }
    })

  return {
    transaksi,
    perBulan,
    perKategori,
    anggaran: {
      diatur: true,
      periode: m.budget.periodType === 'monthly' ? 'Bulanan' : 'Mingguan',
      rentang: labelRentang(r.periode.mulai, r.periode.akhir),
      total: r.total,
      terpakai: r.terpakai,
      sisa: r.sisa,
      baris,
    },
  }
}