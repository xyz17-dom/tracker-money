import { describe, expect, it } from 'vitest'
import type { Transaction } from '../db/db'
import { susunLaporan, type Masukan } from './laporan'

function tx(
  id: number,
  date: string,
  amount: number,
  type: 'income' | 'expense',
  categoryId: number,
  note = '',
): Transaction {
  return {
    id,
    type,
    amount,
    categoryId,
    sourceId: 1,
    note,
    date,
    createdAt: id,
    updatedAt: id,
  }
}

const dasar: Masukan = {
  transaksi: [],
  categories: [
    { id: 1, name: 'Makan', color: '', kind: 'expense', isDefault: true },
    { id: 2, name: 'Jajan', color: '', kind: 'expense', isDefault: true },
  ],
  sources: [{ id: 1, name: 'Tunai', type: 'cash' }],
  budget: undefined,
  limits: [],
  hariIni: '2026-11-04',
}

describe('susunLaporan', () => {
  it('mengurutkan transaksi dari yang terlama dan memberi nama', () => {
    const l = susunLaporan({
      ...dasar,
      transaksi: [
        tx(2, '2026-11-03', 8000, 'expense', 2, 'Es teh'),
        tx(1, '2026-11-01', 12000, 'expense', 1),
      ],
    })
    expect(l.transaksi.map((t) => t.tanggal)).toEqual(['2026-11-01', '2026-11-03'])
    expect(l.transaksi[1]).toMatchObject({
      jenis: 'Pengeluaran',
      kategori: 'Jajan',
      sumber: 'Tunai',
      catatan: 'Es teh',
      nominal: 8000,
    })
  })

  it('memakai nama pengganti jika kategori atau sumber tidak ditemukan', () => {
    const l = susunLaporan({
      ...dasar,
      transaksi: [{ ...tx(1, '2026-11-01', 5000, 'expense', 99), sourceId: 99 }],
    })
    expect(l.transaksi[0]).toMatchObject({
      kategori: 'Tanpa kategori',
      sumber: 'Tanpa sumber',
    })
  })

  it('merangkum per bulan dan per kategori', () => {
    const l = susunLaporan({
      ...dasar,
      transaksi: [
        tx(1, '2026-10-31', 350000, 'income', 1),
        tx(2, '2026-11-01', 15000, 'expense', 2),
        tx(3, '2026-11-03', 64000, 'expense', 2),
        tx(4, '2026-11-04', 6000, 'expense', 1),
      ],
    })
    expect(l.perBulan).toEqual([
      { bulan: 'Oktober 2026', pemasukan: 350000, pengeluaran: 0, selisih: 350000 },
      { bulan: 'November 2026', pemasukan: 0, pengeluaran: 85000, selisih: -85000 },
    ])
    // Pemasukan tidak ikut; kategori terbesar di urutan pertama
    expect(l.perKategori).toEqual([
      { kategori: 'Jajan', jumlah: 2, total: 79000 },
      { kategori: 'Makan', jumlah: 1, total: 6000 },
    ])
  })

  it('menandai anggaran belum diatur', () => {
    const l = susunLaporan(dasar)
    expect(l.anggaran.diatur).toBe(false)
    expect(l.anggaran.baris).toEqual([])
  })

  it('menghitung terpakai dan sisa per kategori pada periode berjalan', () => {
    const l = susunLaporan({
      ...dasar,
      transaksi: [
        tx(1, '2026-11-01', 99999, 'expense', 2), // di luar minggu 2 sampai 8 Nov
        tx(2, '2026-11-03', 64000, 'expense', 2),
      ],
      budget: { id: 1, periodType: 'weekly', startDate: '2026-11-02', totalAmount: 350000 },
      limits: [{ id: 1, budgetId: 1, categoryId: 2, limitAmount: 80000 }],
    })
    expect(l.anggaran).toMatchObject({
      diatur: true,
      periode: 'Mingguan',
      total: 350000,
      terpakai: 64000,
      sisa: 286000,
    })
    expect(l.anggaran.baris).toEqual([
      { kategori: 'Jajan', batas: 80000, terpakai: 64000, sisa: 16000 },
    ])
  })
})