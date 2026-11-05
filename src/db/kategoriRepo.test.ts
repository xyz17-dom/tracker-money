import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, seedIfEmpty } from './db'
import { hapusKategori, tambahKategori, ubahNamaKategori } from './kategoriRepo'

beforeEach(async () => {
  await db.delete()
  await db.open()
  await seedIfEmpty()
})

const idKategori = async (nama: string, kind: 'expense' | 'income') =>
  (await db.categories.filter((c) => c.kind === kind && c.name === nama).first())!.id

async function catat(categoryId: number, amount = 1000) {
  await db.transactions.add({
    type: 'expense', amount, categoryId, sourceId: 1, note: '',
    date: '2026-11-01', createdAt: 1, updatedAt: 1,
  })
}

describe('tambahKategori dan ubahNamaKategori', () => {
  it('menambah kategori buatan pengguna', async () => {
    const id = await tambahKategori('  Kos  ', 'expense')
    expect(await db.categories.get(id)).toMatchObject({
      name: 'Kos', kind: 'expense', isDefault: false,
    })
  })

  it('menolak nama kembar dan nama kosong', async () => {
    await expect(tambahKategori('makan', 'expense')).rejects.toThrow('sudah dipakai')
    await expect(tambahKategori('  ', 'expense')).rejects.toThrow('tidak boleh kosong')
  })

  it('mengubah nama dan menolak yang kembar dengan kategori lain', async () => {
    const id = await tambahKategori('Kos', 'expense')
    await ubahNamaKategori(id, 'Sewa kos')
    expect((await db.categories.get(id))?.name).toBe('Sewa kos')
    await expect(ubahNamaKategori(id, 'Makan')).rejects.toThrow('sudah dipakai')
  })
})

describe('hapusKategori', () => {
  it('menghapus kategori yang belum dipakai beserta batas dan favoritnya', async () => {
    const id = await tambahKategori('Kos', 'expense')
    const idAnggaran = await db.budgets.add({ periodType: 'monthly', startDate: '2026-11-01', totalAmount: 1000000 })
    await db.budgetCategories.add({ budgetId: idAnggaran, categoryId: id, limitAmount: 500000 })
    await db.settings.put({ key: 'kategoriFavorit', value: JSON.stringify([id, 1]) })
    await hapusKategori(id)
    expect(await db.categories.get(id)).toBeUndefined()
    expect(await db.budgetCategories.count()).toBe(0)
    expect(JSON.parse((await db.settings.get('kategoriFavorit'))!.value)).toEqual([1])
  })

  it('memindahkan transaksi ke kategori pengganti', async () => {
    const jajan = await idKategori('Jajan', 'expense')
    const makan = await idKategori('Makan', 'expense')
    await catat(jajan)
    await catat(jajan, 2000)
    await hapusKategori(jajan, makan)
    expect(await db.categories.get(jajan)).toBeUndefined()
    const t = await db.transactions.toArray()
    expect(t.every((x) => x.categoryId === makan)).toBe(true)
    expect(t).toHaveLength(2)
  })

  it('menolak jika masih dipakai dan tidak ada pengganti; data tidak berubah', async () => {
    const jajan = await idKategori('Jajan', 'expense')
    await catat(jajan)
    await expect(hapusKategori(jajan)).rejects.toThrow('pengganti')
    expect(await db.categories.get(jajan)).toBeDefined()
    expect((await db.transactions.toArray())[0].categoryId).toBe(jajan)
  })

  it('menolak pengganti yang berbeda jenis atau dirinya sendiri', async () => {
    const jajan = await idKategori('Jajan', 'expense')
    const gaji = await idKategori('Gaji', 'income')
    await catat(jajan)
    await expect(hapusKategori(jajan, gaji)).rejects.toThrow('pengganti')
    await expect(hapusKategori(jajan, jajan)).rejects.toThrow('pengganti')
    expect(await db.categories.get(jajan)).toBeDefined()
  })

  it('menolak menghapus kategori terakhir dari satu jenis', async () => {
    const pemasukan = await db.categories.filter((c) => c.kind === 'income').toArray()
    for (const c of pemasukan.slice(1)) await hapusKategori(c.id)
    await expect(hapusKategori(pemasukan[0].id)).rejects.toThrow('Minimal')
    expect(await db.categories.filter((c) => c.kind === 'income').count()).toBe(1)
  })
})