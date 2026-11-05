import { describe, expect, it } from 'vitest'
import type { Transaction } from '../db/db'
import { pastikanKategoriPemasukan, type KategoriLama } from './kategori'

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