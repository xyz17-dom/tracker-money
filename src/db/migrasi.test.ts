import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'

describe('migrasi database versi 1 ke 2', () => {
  it('menambah kategori pemasukan dan memindahkan pemasukan lama', async () => {
    // Membuat database seperti milik pengguna lama (versi 1)
    const lama = new Dexie('trackerMoney')
    lama.version(1).stores({
      transactions: '++id, date, categoryId, [type+date]',
      categories: '++id, name',
      sources: '++id, name',
      budgets: '++id, startDate',
      budgetCategories: '++id, budgetId, categoryId',
      settings: 'key',
    })
    await lama.open()
    await lama.table('categories').bulkAdd([
      { name: 'Makan', color: '', isDefault: true },
      { name: 'Jajan', color: '', isDefault: true },
    ])
    const dasar = { sourceId: 1, note: '', date: '2026-11-01', createdAt: 1, updatedAt: 1 }
    await lama.table('transactions').bulkAdd([
      { ...dasar, type: 'expense', amount: 8000, categoryId: 2 },
      { ...dasar, type: 'income', amount: 350000, categoryId: 1 },
    ])
    lama.close()

    // Membuka dengan kode terbaru: migrasi berjalan
    const { db } = await import('./db')
    await db.open()
    const kategori = await db.categories.toArray()
    const transaksi = await db.transactions.orderBy('id').toArray()

    expect(kategori).toHaveLength(7)
    expect(kategori.filter((c) => c.kind === 'expense').map((c) => c.name)).toEqual(['Makan', 'Jajan'])
    const idLainnya = kategori.find((c) => c.kind === 'income' && c.name === 'Lainnya')!.id
    expect(transaksi[0]).toMatchObject({ type: 'expense', categoryId: 2, amount: 8000 })
    expect(transaksi[1]).toMatchObject({ type: 'income', categoryId: idLainnya, amount: 350000 })
    db.close()
  })

  it('pengguna baru mendapat kategori pengeluaran dan pemasukan', async () => {
    await Dexie.delete('trackerMoney')
    const { db, seedIfEmpty } = await import('./db')
    await db.open()
    await seedIfEmpty()
    const kategori = await db.categories.toArray()
    expect(kategori.filter((c) => c.kind === 'expense')).toHaveLength(6)
    expect(kategori.filter((c) => c.kind === 'income')).toHaveLength(5)
    db.close()
  })
})