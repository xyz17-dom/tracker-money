import Dexie, { type EntityTable } from 'dexie'

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

db.version(1).stores({
  transactions: '++id, date, categoryId, [type+date]',
  categories: '++id, name',
  sources: '++id, name',
  budgets: '++id, startDate',
  budgetCategories: '++id, budgetId, categoryId',
  settings: 'key',
})

// Mengisi data awal saat aplikasi pertama kali dibuka
export async function seedIfEmpty() {
  await db.transaction('rw', db.categories, db.sources, async () => {
    if ((await db.categories.count()) === 0) {
      await db.categories.bulkAdd([
        { name: 'Makan', color: '#5B5BD6', isDefault: true },
        { name: 'Jajan', color: '#F6B8A0', isDefault: true },
        { name: 'Transport', color: '#8FD3C1', isDefault: true },
        { name: 'Hiburan', color: '#D9D9F2', isDefault: true },
        { name: 'Game', color: '#6C6CE5', isDefault: true },
        { name: 'Lainnya', color: '#A3A3BC', isDefault: true },
      ])
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