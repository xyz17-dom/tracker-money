import { db } from './db'
import { todayString } from '../utils/format'
import type { PeriodType } from '../services/anggaran'

// Aplikasi memakai satu anggaran aktif. Jika belum ada, dibuat; jika ada, diperbarui.
export async function simpanAnggaran(
  periodType: PeriodType,
  totalAmount: number,
) {
  const ada = await db.budgets.toCollection().first()
  if (ada) {
    await db.budgets.update(ada.id, { periodType, totalAmount })
    return ada.id
  }
  return db.budgets.add({ periodType, totalAmount, startDate: todayString() })
}

// Batas 0 berarti "tanpa batas": barisnya dihapus
export async function simpanBatasKategori(
  budgetId: number,
  categoryId: number,
  limitAmount: number,
) {
  const ada = await db.budgetCategories
    .where('budgetId')
    .equals(budgetId)
    .and((b) => b.categoryId === categoryId)
    .first()

  if (limitAmount <= 0) {
    if (ada) await db.budgetCategories.delete(ada.id)
    return
  }
  if (ada) {
    await db.budgetCategories.update(ada.id, { limitAmount })
  } else {
    await db.budgetCategories.add({ budgetId, categoryId, limitAmount })
  }
}