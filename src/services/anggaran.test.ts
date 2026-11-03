import { describe, expect, it } from 'vitest'
import type { Transaction } from '../db/db'
import {
  cariPeringatan,
  hitungRingkasan,
  pengeluaranHarian,
  rentangPeriode,
} from './anggaran'

function tx(
  date: string,
  amount: number,
  ganti: Partial<Transaction> = {},
): Transaction {
  return {
    id: 1,
    type: 'expense',
    amount,
    categoryId: 1,
    sourceId: 1,
    note: '',
    date,
    createdAt: 0,
    updatedAt: 0,
    ...ganti,
  }
}

describe('rentangPeriode', () => {
  it('minggu berjalan dari Senin sampai Minggu', () => {
    expect(rentangPeriode('weekly', '2026-11-04')).toEqual({
      mulai: '2026-11-02',
      akhir: '2026-11-08',
    })
  })

  it('bulan berjalan dari tanggal 1 sampai akhir bulan', () => {
    expect(rentangPeriode('monthly', '2026-11-15')).toEqual({
      mulai: '2026-11-01',
      akhir: '2026-11-30',
    })
  })
})

describe('hitungRingkasan', () => {
  it('menghitung jatah harian dan sisa', () => {
    const data = [
      tx('2026-11-02', 50000),
      tx('2026-11-04', 55000),
      tx('2026-11-05', 20000),
    ]
    const r = hitungRingkasan(data, 'weekly', 350000, '2026-11-05')
    expect(r.sisaHari).toBe(4)
    expect(r.bolehHariIni).toBe(61250)
    expect(r.terpakai).toBe(125000)
    expect(r.sisa).toBe(225000)
    expect(r.terpakaiHariIni).toBe(20000)
    expect(r.sisaHariIni).toBe(41250)
  })

  it('mengabaikan pemasukan dan transaksi di luar periode', () => {
    const data = [
      tx('2026-10-30', 99999),
      tx('2026-11-05', 99999, { type: 'income' }),
    ]
    const r = hitungRingkasan(data, 'weekly', 350000, '2026-11-05')
    expect(r.terpakai).toBe(0)
  })

  it('jatah harian tidak negatif saat anggaran terlewati', () => {
    const data = [tx('2026-11-03', 150000)]
    const r = hitungRingkasan(data, 'weekly', 100000, '2026-11-05')
    expect(r.bolehHariIni).toBe(0)
    expect(r.sisa).toBe(-50000)
  })
})

describe('pengeluaranHarian', () => {
  it('menghasilkan 7 hari berakhir hari ini, termasuk hari kosong', () => {
    const data = [
      tx('2026-11-05', 20000),
      tx('2026-11-05', 5000),
      tx('2026-11-03', 10000),
      tx('2026-10-20', 99999),
    ]
    const h = pengeluaranHarian(data, '2026-11-05')
    expect(h).toHaveLength(7)
    expect(h[0].tanggal).toBe('2026-10-30')
    expect(h[4].jumlah).toBe(10000)
    expect(h[5].jumlah).toBe(0)
    expect(h[6]).toMatchObject({ tanggal: '2026-11-05', jumlah: 25000 })
  })
})

describe('cariPeringatan', () => {
  const nama = new Map([[1, 'Jajan']])
  const batas = new Map([[1, 80000]])

  it('memberi peringatan saat kategori mencapai 80%', () => {
    const r = hitungRingkasan([tx('2026-11-05', 64000)], 'weekly', 350000, '2026-11-05')
    const p = cariPeringatan(r, batas, nama)
    expect(p).toHaveLength(1)
    expect(p[0].judul).toBe('Jajan sudah 80% dari anggaran')
    expect(p[0].berat).toBe(false)
  })

  it('tidak memberi peringatan di bawah 80%', () => {
    const r = hitungRingkasan([tx('2026-11-05', 40000)], 'weekly', 350000, '2026-11-05')
    expect(cariPeringatan(r, batas, nama)).toHaveLength(0)
  })

  it('menaruh peringatan 100% di urutan pertama', () => {
    const r = hitungRingkasan([tx('2026-11-05', 90000)], 'weekly', 350000, '2026-11-05')
    const p = cariPeringatan(r, batas, nama)
    expect(p[0].berat).toBe(true)
    expect(p[0].judul).toBe('Jajan sudah melebihi batas')
  })
})