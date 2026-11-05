import Dexie, { type EntityTable } from 'dexie'
import {
  KATEGORI_PEMASUKAN_BAWAAN,
  KATEGORI_PENGELUARAN_BAWAAN,
  pastikanKategoriPemasukan,
} from '../services/kategori'

export interface Transaction {
  id: number
  type: 'income' | 'expense'
  amount: number // rupiah, bilangan bulat
  categoryId: number
  sourceId: number
  note: string
  date: string // 'YYYY-MM-DD'
  recurringId?: number
  createdAt: number
  updatedAt: number
}

export interface Category {
  id: number
  name: string
  color: string
  kind: 'expense' | 'income' // jenis transaksi yang memakai kategori ini
  isDefault: boolean
}

export interface Source {
  id: number
  name: string
  type: 'cash' | 'bank' | 'ewallet'
}

export interface Budget {
  id: number
  periodType: 'weekly' | 'monthly'
  startDate: string
  totalAmount: number
}

export interface BudgetCategory {
  id: number
  budgetId: number
  categoryId: number
  limitAmount: number
}

export interface Setting {
  key: string
  value: string
}

export const db = new Dexie('trackerMoney') as Dexie & {
  transactions: EntityTable<Transaction, 'id'>
  categories: EntityTable<Category, 'id'>
  sources: EntityTable<Source, 'id'>
  budgets: EntityTable<Budget, 'id'>
  budgetCategories: EntityTable<BudgetCategory, 'id'>
  settings: EntityTable<Setting, 'key'>
}

const tabel = {
  transactions: '++id, date, categoryId, [type+date]',
  categories: '++id, name',
  sources: '++id, name',
  budgets: '++id, startDate',
  budgetCategories: '++id, budgetId, categoryId',
  settings: 'key',
}

db.version(1).stores(tabel)

// Versi 2: kategori punya jenis (pengeluaran atau pemasukan).
// Susunan tabel tidak berubah, hanya isi datanya yang disesuaikan.
db.version(2)
  .stores(tabel)
  .upgrade(async (tx) => {
    const categories = await tx.table('categories').toArray()
    const transactions = await tx.table('transactions').toArray()
    const hasil = pastikanKategoriPemasukan(categories, transactions)
    await tx.table('categories').bulkPut(hasil.categories)
    await tx
      .table('transactions')
      .bulkPut(hasil.transactions.filter((t) => t.type === 'income'))
  })

// Mengisi data awal saat aplikasi pertama kali dibuka
export async function seedIfEmpty() {
  await db.transaction('rw', db.categories, db.sources, async () => {
    if ((await db.categories.count()) === 0) {
      await db.categories.bulkAdd(
        [...KATEGORI_PENGELUARAN_BAWAAN, ...KATEGORI_PEMASUKAN_BAWAAN].map(
          (b) => ({ ...b, isDefault: true }),
        ),
      )
    }
    if ((await db.sources.count()) === 0) {
      await db.sources.bulkAdd([
        { name: 'Tunai', type: 'cash' },
        { name: 'GoPay', type: 'ewallet' },
        { name: 'DANA', type: 'ewallet' },
        { name: 'ShopeePay', type: 'ewallet' },
      ])
    }
  })
}