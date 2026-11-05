import { describe, expect, it } from 'vitest'
import type { Transaction } from '../db/db'
import type { Category } from '../db/db'
import {
  PANJANG_NAMA_MAKS,
  pastikanKategoriPemasukan,
  validasiNamaKategori,
  type KategoriLama,
} from './kategori'

const tx = (id: number, type: 'income' | 'expense', categoryId: number): Transaction => ({
  id, type, amount: 1000, categoryId, sourceId: 1, note: '', date: '2026-11-01', createdAt: id, updatedAt: id,
})

const lama: KategoriLama[] = [
  { id: 1, name: 'Makan', color: '', isDefault: true },
  { id: 2, name: 'Jajan', color: '', isDefault: true },
]

describe('pastikanKategoriPemasukan', () => {
  it('menandai kategori lama sebagai pengeluaran dan menambah kategori pemasukan', () => {
    const h = pastikanKategoriPemasukan(lama, [])
    expect(h.categories.slice(0, 2).every((c) => c.kind === 'expense')).toBe(true)
    const pemasukan = h.categories.filter((c) => c.kind === 'income')
    expect(pemasukan.map((c) => c.name)).toEqual(['Uang saku', 'Gaji', 'Usaha', 'Hadiah', 'Lainnya'])
    // id baru tidak bertabrakan dengan yang lama
    expect(new Set(h.categories.map((c) => c.id)).size).toBe(h.categories.length)
    expect(Math.min(...pemasukan.map((c) => c.id))).toBe(3)
  })

  it('memindahkan pemasukan lama ke Lainnya, pengeluaran tidak berubah', () => {
    const h = pastikanKategoriPemasukan(lama, [tx(1, 'expense', 2), tx(2, 'income', 1)])
    const idLainnya = h.categories.find((c) => c.kind === 'income' && c.name === 'Lainnya')!.id
    expect(h.transactions[0].categoryId).toBe(2)
    expect(h.transactions[1].categoryId).toBe(idLainnya)
  })

  it('tidak mengubah apa pun jika kategori pemasukan sudah ada', () => {
    const sudah: KategoriLama[] = [...lama, { id: 3, name: 'Gaji', color: '', isDefault: true, kind: 'income' }]
    const data = [tx(1, 'income', 3)]
    const h = pastikanKategoriPemasukan(sudah, data)
    expect(h.categories).toHaveLength(3)
    expect(h.transactions).toBe(data)
  })
})

describe('validasiNamaKategori', () => {
  const daftar: Category[] = [
    { id: 1, name: 'Makan', color: '', kind: 'expense', isDefault: true },
    { id: 2, name: 'Lainnya', color: '', kind: 'expense', isDefault: true },
    { id: 3, name: 'Lainnya', color: '', kind: 'income', isDefault: true },
  ]

  it('merapikan spasi dan menerima nama yang sah', () => {
    expect(validasiNamaKategori('  Kos   bulanan ', 'expense', daftar)).toEqual({
      ok: true,
      nama: 'Kos bulanan',
    })
  })

  it('menolak nama kosong', () => {
    expect(validasiNamaKategori('   ', 'expense', daftar)).toMatchObject({ ok: false })
  })

  it('menolak nama yang terlalu panjang', () => {
    const panjang = 'a'.repeat(PANJANG_NAMA_MAKS + 1)
    expect(validasiNamaKategori(panjang, 'expense', daftar)).toMatchObject({ ok: false })
    expect(validasiNamaKategori('a'.repeat(PANJANG_NAMA_MAKS), 'expense', daftar)).toMatchObject({ ok: true })
  })

  it('menolak nama kembar di jenis yang sama tanpa membedakan huruf besar', () => {
    expect(validasiNamaKategori('makan', 'expense', daftar)).toMatchObject({ ok: false })
  })

  it('mengizinkan nama yang sama di jenis berbeda', () => {
    expect(validasiNamaKategori('Makan', 'income', daftar)).toMatchObject({ ok: true })
  })

  it('tidak menganggap kategori kembar dengan dirinya sendiri saat diubah', () => {
    expect(validasiNamaKategori('MAKAN', 'expense', daftar, 1)).toMatchObject({ ok: true })
  })
})