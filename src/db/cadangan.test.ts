import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'

describe('impor cadangan', () => {
  it('menerima cadangan versi 1 dan menyesuaikan kategorinya', async () => {
    await Dexie.delete('trackerMoney')
    const { db } = await import('./db')
    const { impor, ekspor } = await import('./cadangan')
    await db.open()
    const cadanganLama = JSON.stringify({
      aplikasi: 'tracker-money',
      versi: 1,
      transactions: [
        { id: 1, type: 'income', amount: 5000, categoryId: 1, sourceId: 1, note: '', date: '2026-11-01', createdAt: 1, updatedAt: 1 },
      ],
      categories: [{ id: 1, name: 'Makan', color: '', isDefault: true }],
      sources: [{ id: 1, name: 'Tunai', type: 'cash' }],
      budgets: [],
      budgetCategories: [],
      settings: [],
    })
    expect(await impor(cadanganLama)).toBe(1)
    const kategori = await db.categories.toArray()
    expect(kategori.filter((c) => c.kind === 'income')).toHaveLength(5)
    const t = await db.transactions.get(1)
    const lainnya = kategori.find((c) => c.kind === 'income' && c.name === 'Lainnya')!
    expect(t?.categoryId).toBe(lainnya.id)

    // Ekspor lalu impor lagi (versi 2) harus utuh
    const berkas = await ekspor()
    expect(JSON.parse(berkas).versi).toBe(2)
    expect(await impor(berkas)).toBe(1)
    expect(await db.categories.count()).toBe(6)
    db.close()
  })

  it('menolak file yang bukan cadangan dan data tetap utuh', async () => {
    const { db } = await import('./db')
    const { impor } = await import('./cadangan')
    await db.open()
    const sebelum = await db.categories.count()
    await expect(impor('halo')).rejects.toThrow('bukan file cadangan')
    await expect(impor('{"aplikasi":"lain"}')).rejects.toThrow('bukan cadangan')
    expect(await db.categories.count()).toBe(sebelum)
    db.close()
  })
})