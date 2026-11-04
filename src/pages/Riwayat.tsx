import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Transaction } from '../db/db'
import { formatRupiah, labelHari } from '../utils/format'

type Filter = 'semua' | 'expense' | 'income'

const FILTER: { id: Filter; label: string }[] = [
  { id: 'semua', label: 'Semua' },
  { id: 'expense', label: 'Pengeluaran' },
  { id: 'income', label: 'Pemasukan' },
]

type Props = { onPilih: (transaksi: Transaction) => void }

export default function Riwayat({ onPilih }: Props) {
  const [filter, setFilter] = useState<Filter>('semua')

  const transaksi = useLiveQuery(() => db.transactions.toArray())
  const categories = useLiveQuery(() => db.categories.toArray())
  const sources = useLiveQuery(() => db.sources.toArray())

  const namaKategori = new Map(categories?.map((c) => [c.id, c.name] as const))
  const namaSumber = new Map(sources?.map((s) => [s.id, s.name] as const))

  // Saring sesuai filter, lalu urutkan: tanggal terbaru dulu, lalu waktu catat terbaru
  const tampil = (transaksi ?? [])
    .filter((t) => filter === 'semua' || t.type === filter)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)

  // Kelompokkan per tanggal
  const perHari = new Map<string, Transaction[]>()
  for (const t of tampil) {
    perHari.set(t.date, [...(perHari.get(t.date) ?? []), t])
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div>
        <h1 className="text-[22px] font-bold">Riwayat</h1>
        {tampil.length > 0 && (
          <p className="mt-0.5 text-xs text-teks-sekunder">
            Ketuk transaksi untuk mengubah atau menghapus.
          </p>
        )}
      </div>

      <div className="flex gap-2">
        {FILTER.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`min-h-11 rounded-full px-4 text-[13px] ${
              filter === f.id ? 'bg-aksen text-white' : 'bg-card'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {transaksi && tampil.length === 0 && (
        <p className="mt-6 text-center text-sm text-teks-sekunder">
          {filter === 'semua'
            ? 'Belum ada transaksi. Ketuk + untuk mencatat.'
            : 'Tidak ada transaksi untuk filter ini.'}
        </p>
      )}

      {[...perHari].map(([tanggal, daftar]) => (
        <section key={tanggal} className="flex flex-col gap-2">
          <h2 className="mt-1 text-xs text-teks-sekunder">{labelHari(tanggal)}</h2>
          <div className="rounded-[20px] bg-card px-4 shadow-sm">
            {daftar.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onPilih(t)}
                className="flex min-h-14 w-full items-center gap-3 border-b border-track text-left last:border-b-0"
              >
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-aksen-tint text-sm font-bold text-aksen-teks"
                >
                  {(namaKategori.get(t.categoryId) ?? '?').charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {t.note || namaKategori.get(t.categoryId) || 'Tanpa kategori'}
                  </span>
                  <span className="block text-xs text-teks-sekunder">
                    {namaKategori.get(t.categoryId)} · {namaSumber.get(t.sourceId)}
                  </span>
                </span>
                <span
                  className={`text-sm font-bold ${
                    t.type === 'income' ? 'text-pemasukan' : ''
                  }`}
                >
                  {t.type === 'income' ? '+' : '−'}
                  {formatRupiah(t.amount)}
                </span>
                <ChevronRight
                  size={18}
                  className="flex-none text-teks-sekunder"
                />
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}