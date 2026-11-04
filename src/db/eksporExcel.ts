import { db } from './db'
import { susunLaporan } from '../services/laporan'
import { susunLembar } from '../services/lembarExcel'
import { todayString } from '../utils/format'

// Membaca data, menyusun laporan, dan menghasilkan file .xlsx (Blob)
export async function buatLaporanExcel(): Promise<Blob> {
  const [transaksi, categories, sources, budget] = await Promise.all([
    db.transactions.toArray(),
    db.categories.toArray(),
    db.sources.toArray(),
    db.budgets.toCollection().first(),
  ])
  const limits = budget
    ? await db.budgetCategories.where('budgetId').equals(budget.id).toArray()
    : []

  const laporan = susunLaporan({
    transaksi,
    categories,
    sources,
    budget,
    limits,
    hariIni: todayString(),
  })

  // Pustaka Excel baru dimuat saat tombol ditekan, supaya aplikasi tetap ringan
  const { default: writeExcelFile } = await import('write-excel-file/universal')
  return writeExcelFile(susunLembar(laporan)).toBlob()
}