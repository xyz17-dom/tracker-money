import { db, seedIfEmpty } from './db'
import { KUNCI_ONBOARDING } from './pengaturanRepo'

// Menghapus anggaran beserta semua batas kategorinya.
// Transaksi tidak disentuh sama sekali.
export async function hapusAnggaran() {
  await db.transaction(
    'rw',
    db.budgets,
    db.budgetCategories,
    db.settings,
    async () => {
      await db.budgets.clear()
      await db.budgetCategories.clear()
      // Tanda ini mencegah onboarding muncul lagi pada pengguna yang
      // anggarannya dihapus tetapi belum punya transaksi
      await db.settings.put({ key: KUNCI_ONBOARDING, value: 'ya' })
    },
  )
}

// Mengembalikan aplikasi ke keadaan baru: semua data dihapus, kategori dan
// sumber dana bawaan dibuat ulang, dan onboarding akan muncul lagi.
// Pilihan tema tidak ikut terhapus karena disimpan terpisah di perangkat.
export async function hapusSemuaData() {
  await db.transaction(
    'rw',
    [
      db.transactions,
      db.categories,
      db.sources,
      db.budgets,
      db.budgetCategories,
      db.settings,
    ],
    async () => {
      await Promise.all([
        db.transactions.clear(),
        db.categories.clear(),
        db.sources.clear(),
        db.budgets.clear(),
        db.budgetCategories.clear(),
        db.settings.clear(),
      ])
      await seedIfEmpty()
    },
  )
}