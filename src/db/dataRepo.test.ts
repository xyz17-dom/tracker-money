import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, seedIfEmpty } from './db'
import { hapusAnggaran, hapusSemuaData } from './dataRepo'

// Setiap uji dimulai dari database kosong yang baru diisi data bawaan,
// ditambah satu anggaran, satu batas kategori, satu transaksi, dan satu pengaturan
beforeEach(async () => {
  await db.delete()
  await db.open()
  await seedIfEmpty()
  const idMakan = (await db.categories.where('name').equals('Makan').first())!.id
  const idAnggaran = await db.budgets.add({
    periodType: 'weekly',
    startDate: '2026-11-02',
    totalAmount: 350000,
  })
  await db.budgetCategories.add({
    budgetId: idAnggaran,
    categoryId: idMakan,
    limitAmount: 100000,
  })
  await db.transactions.add({
    type: 'expense',
    amount: 8000,
    categoryId: idMakan,
    sourceId: 1,
    note: 'Es teh',
    date: '2026-11-03',
    createdAt: 1,
    updatedAt: 1,
  })
  await db.settings.put({ key: 'kategoriFavorit', value: '[1]' })
})

describe('hapusAnggaran', () => {
  it('menghapus anggaran dan batas kategori, tetapi transaksi tetap ada', async () => {
    await hapusAnggaran()
    expect(await db.budgets.count()).toBe(0)
    expect(await db.budgetCategories.count()).toBe(0)
    expect(await db.transactions.count()).toBe(1)
    expect(await db.categories.count()).toBe(11)
    // onboarding tidak muncul lagi
    expect((await db.settings.get('onboardingSelesai'))?.value).toBe('ya')
    // pengaturan lain tidak ikut terhapus
    expect((await db.settings.get('kategoriFavorit'))?.value).toBe('[1]')
  })
})

describe('hapusSemuaData', () => {
  it('mengosongkan semuanya lalu membuat ulang data bawaan', async () => {
    await hapusSemuaData()
    expect(await db.transactions.count()).toBe(0)
    expect(await db.budgets.count()).toBe(0)
    expect(await db.budgetCategories.count()).toBe(0)
    expect(await db.settings.count()).toBe(0)
    expect(await db.categories.count()).toBe(11)
    expect(await db.sources.count()).toBe(4)
  })
})