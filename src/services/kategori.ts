import type { Category, Transaction } from '../db/db'

type Bawaan = Omit<Category, 'id' | 'isDefault'>

export const KATEGORI_PENGELUARAN_BAWAAN: Bawaan[] = [
  { name: 'Makan', color: '#5B5BD6', kind: 'expense' },
  { name: 'Jajan', color: '#F6B8A0', kind: 'expense' },
  { name: 'Transport', color: '#8FD3C1', kind: 'expense' },
  { name: 'Hiburan', color: '#D9D9F2', kind: 'expense' },
  { name: 'Game', color: '#6C6CE5', kind: 'expense' },
  { name: 'Lainnya', color: '#A3A3BC', kind: 'expense' },
]

export const KATEGORI_PEMASUKAN_BAWAAN: Bawaan[] = [
  { name: 'Uang saku', color: '#1B7F5C', kind: 'income' },
  { name: 'Gaji', color: '#5B5BD6', kind: 'income' },
  { name: 'Usaha', color: '#F6B8A0', kind: 'income' },
  { name: 'Hadiah', color: '#8FD3C1', kind: 'income' },
  { name: 'Lainnya', color: '#A3A3BC', kind: 'income' },
]

// Data lama (sebelum ada pembagian jenis) belum punya `kind`
export type KategoriLama = Omit<Category, 'kind'> & { kind?: Category['kind'] }

// Fungsi murni, dipakai oleh migrasi database dan oleh impor cadangan lama:
// 1. kategori tanpa jenis dianggap kategori pengeluaran,
// 2. jika belum ada kategori pemasukan, kategori bawaan ditambahkan,
// 3. pemasukan lama (yang dulu terpaksa memakai kategori pengeluaran)
//    dipindahkan ke "Lainnya" milik pemasukan.
export function pastikanKategoriPemasukan(
  categories: KategoriLama[],
  transactions: Transaction[],
): { categories: Category[]; transactions: Transaction[] } {
  const normal: Category[] = categories.map((c) => ({
    ...c,
    kind: c.kind ?? 'expense',
  }))

  if (normal.some((c) => c.kind === 'income')) {
    return { categories: normal, transactions }
  }

  let idBerikut = normal.reduce((maks, c) => Math.max(maks, c.id), 0) + 1
  const baru: Category[] = KATEGORI_PEMASUKAN_BAWAAN.map((b) => ({
    ...b,
    id: idBerikut++,
    isDefault: true,
  }))
  const idLainnya = baru.find((c) => c.name === 'Lainnya')?.id ?? baru[0].id

  return {
    categories: [...normal, ...baru],
    transactions: transactions.map((t) =>
      t.type === 'income' ? { ...t, categoryId: idLainnya } : t,
    ),
  }
}