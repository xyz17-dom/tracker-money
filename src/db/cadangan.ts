import {
  db,
  type Budget,
  type BudgetCategory,
  type Setting,
  type Source,
  type Transaction,
} from './db'
import {
  pastikanKategoriPemasukan,
  type KategoriLama,
} from '../services/kategori'

// Versi 2: kategori punya jenis. Cadangan versi 1 tetap bisa diimpor.
const VERSI = 2
const VERSI_DIDUKUNG = [1, 2]

export async function ekspor(): Promise<string> {
  return JSON.stringify(
    {
      aplikasi: 'tracker-money',
      versi: VERSI,
      diekspor: new Date().toISOString(),
      transactions: await db.transactions.toArray(),
      categories: await db.categories.toArray(),
      sources: await db.sources.toArray(),
      budgets: await db.budgets.toArray(),
      budgetCategories: await db.budgetCategories.toArray(),
      settings: await db.settings.toArray(),
    },
    null,
    2,
  )
}

export function unduh(namaFile: string, isi: string) {
  const url = URL.createObjectURL(new Blob([isi], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = namaFile
  a.click()
  URL.revokeObjectURL(url)
}

// ---------- Impor: file dari luar tidak boleh dipercaya begitu saja ----------

function adalahObjek(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

function punyaId(x: unknown): boolean {
  return adalahObjek(x) && Number.isInteger(x.id)
}

function pengaturanValid(x: unknown): boolean {
  return adalahObjek(x) && typeof x.key === 'string' && typeof x.value === 'string'
}

function kategoriValid(x: unknown): boolean {
  return (
    punyaId(x) &&
    adalahObjek(x) &&
    typeof x.name === 'string' &&
    (x.kind === undefined || x.kind === 'expense' || x.kind === 'income')
  )
}

function transaksiValid(t: unknown): boolean {
  return (
    adalahObjek(t) &&
    Number.isInteger(t.id) &&
    (t.type === 'income' || t.type === 'expense') &&
    Number.isInteger(t.amount) &&
    (t.amount as number) > 0 &&
    Number.isInteger(t.categoryId) &&
    Number.isInteger(t.sourceId) &&
    typeof t.note === 'string' &&
    typeof t.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(t.date) &&
    Number.isInteger(t.createdAt) &&
    Number.isInteger(t.updatedAt)
  )
}

function ambilDaftar(data: Record<string, unknown>, nama: string): unknown[] {
  const daftar = data[nama]
  if (!Array.isArray(daftar)) {
    throw new Error(`Data "${nama}" tidak ada atau rusak.`)
  }
  return daftar
}

// Mengembalikan jumlah transaksi yang dipulihkan
export async function impor(teks: string): Promise<number> {
  let data: unknown
  try {
    // Beberapa aplikasi menambah penanda BOM di awal file; dibuang sebelum dibaca
    data = JSON.parse(teks.replace(/^\uFEFF/, ''))
  } catch {
    throw new Error(
      'File ini bukan file cadangan Tracker Money. Memasukkan catatan dari Excel atau foto belum bisa.',
    )
  }
  if (!adalahObjek(data) || data.aplikasi !== 'tracker-money') {
    throw new Error(
      'File ini bukan cadangan Tracker Money. Memasukkan catatan dari Excel atau foto belum bisa.',
    )
  }
  if (!VERSI_DIDUKUNG.includes(data.versi as number)) {
    throw new Error('Versi cadangan ini tidak didukung.')
  }

  const transaksi = ambilDaftar(data, 'transactions')
  const kategori = ambilDaftar(data, 'categories')
  const sumber = ambilDaftar(data, 'sources')
  const anggaran = ambilDaftar(data, 'budgets')
  const batas = ambilDaftar(data, 'budgetCategories')
  const pengaturan = ambilDaftar(data, 'settings')

  if (!transaksi.every(transaksiValid)) {
    throw new Error('Ada transaksi yang rusak di file cadangan.')
  }
  if (!kategori.every(kategoriValid)) {
    throw new Error('Ada kategori yang rusak di file cadangan.')
  }
  if (![sumber, anggaran, batas].every((d) => d.every(punyaId))) {
    throw new Error('Ada data yang rusak di file cadangan.')
  }
  if (!pengaturan.every(pengaturanValid)) {
    throw new Error('Ada pengaturan yang rusak di file cadangan.')
  }

  // Cadangan lama (versi 1) belum punya jenis kategori: disesuaikan di sini
  const disesuaikan = pastikanKategoriPemasukan(
    kategori as KategoriLama[],
    transaksi as Transaction[],
  )

  // Satu transaksi database: jika gagal di tengah jalan, data lama tetap utuh
  await db.transaction(
    'rw',
    [db.transactions, db.categories, db.sources, db.budgets, db.budgetCategories, db.settings],
    async () => {
      await Promise.all([
        db.transactions.clear(),
        db.categories.clear(),
        db.sources.clear(),
        db.budgets.clear(),
        db.budgetCategories.clear(),
        db.settings.clear(),
      ])
      await db.transactions.bulkAdd(disesuaikan.transactions)
      await db.categories.bulkAdd(disesuaikan.categories)
      await db.sources.bulkAdd(sumber as Source[])
      await db.budgets.bulkAdd(anggaran as Budget[])
      await db.budgetCategories.bulkAdd(batas as BudgetCategory[])
      await db.settings.bulkAdd(pengaturan as Setting[])
    },
  )

  return transaksi.length
}