import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import BatangHarian from '../components/BatangHarian'
import DonutKategori from '../components/DonutKategori'
import { db, type BudgetCategory } from '../db/db'
import { KUNCI_PENGINGAT } from '../db/pengaturanRepo'
import {
  AMBANG_PERINGATAN,
  cariPeringatan,
  hitungRingkasan,
  pengeluaranHarian,
  persen,
} from '../services/anggaran'
import { formatRupiah, labelRentang, todayString } from '../utils/format'

type Props = { onBukaAnggaran: () => void }

export default function Beranda({ onBukaAnggaran }: Props) {
  const [ditutup, setDitutup] = useState<string[]>([])

  const budgets = useLiveQuery(() => db.budgets.toArray())
  const budget = budgets?.[0]
  const limits = useLiveQuery(
    async (): Promise<BudgetCategory[]> =>
      budget
        ? await db.budgetCategories.where('budgetId').equals(budget.id).toArray()
        : [],
    [budget?.id],
  )
  const categories = useLiveQuery(() => db.categories.toArray())
  const transaksi = useLiveQuery(() => db.transactions.toArray())
  const pengingat = useLiveQuery(
    async () => (await db.settings.get(KUNCI_PENGINGAT))?.value ?? 'on',
  )

  console.log({ budgets, limits, categories, transaksi, pengingat})
  if (!budgets || !limits || !categories || !transaksi || pengingat === undefined) {
    return <div className="p-4 text-sm text-teks-sekunder">Memuat...</div>
  }

  const hariIni = todayString()
  const tipe = budget?.periodType ?? 'weekly'
  const total = budget?.totalAmount ?? 0
  const judulPeriode = tipe === 'weekly' ? 'Minggu ini' : 'Bulan ini'

  const r = hitungRingkasan(transaksi, tipe, total, hariIni)
  const namaKategori = new Map(categories.map((c) => [c.id, c.name] as const))
  const batasMap = new Map(limits.map((l) => [l.categoryId, l.limitAmount] as const))

  // Maksimal dua banner agar layar tidak penuh
  const peringatan = 
  pengingat === 'on'
  ? cariPeringatan(r, batasMap, namaKategori)
  .filter((p) => !ditutup.includes(p.kunci))
  .slice(0, 2)
  : []

  const pTotal = persen(r.terpakai, total)
  const waspada = total > 0 && pTotal >= AMBANG_PERINGATAN

  return (
    <div className="flex flex-col gap-3 p-4">
      <div>
        <p className="text-xs text-teks-sekunder">
          {judulPeriode} · {labelRentang(r.periode.mulai, r.periode.akhir)}
        </p>
        <h1 className="text-[22px] font-bold">Beranda</h1>
      </div>

      {peringatan.map((p) => (
        <div
          key={p.kunci}
          role="alert"
          className="flex items-center gap-2 rounded-2xl bg-peringatan-tint py-2 pl-4 pr-2"
        >
          <div className="flex-1">
            <p className="text-sm font-bold text-peringatan-teks">{p.judul}</p>
            <p className="mt-0.5 text-xs text-peringatan-teks">{p.detail}</p>
          </div>
          <button
            type="button"
            aria-label="Tutup pengingat"
            onClick={() => setDitutup((d) => [...d, p.kunci])}
            className="h-11 w-11 text-xl text-peringatan-teks"
          >
            ×
          </button>
        </div>
      ))}

      {total === 0 ? (
        <div className="rounded-[20px] bg-card p-4 shadow-sm">
          <p className="font-semibold">Anggaran belum diatur</p>
          <p className="mt-1 text-sm text-teks-sekunder">
            Isi total anggaran agar aplikasi bisa menghitung sisa uang dan
            jatah harian Anda.
          </p>
          <button
            type="button"
            onClick={onBukaAnggaran}
            className="mt-3 min-h-11 rounded-2xl bg-aksen px-5 text-sm font-bold text-white"
          >
            Atur anggaran
          </button>
        </div>
      ) : (
        <>
          <div className="rounded-[20px] bg-card p-4 shadow-sm">
            <p className="text-xs text-teks-sekunder">
              Sisa anggaran {judulPeriode.toLowerCase()}
            </p>
            <p
              className={`my-1 text-[32px] font-bold leading-tight ${
                r.sisa < 0 ? 'text-peringatan-teks' : ''
              }`}
            >
              {r.sisa < 0 ? `−${formatRupiah(-r.sisa)}` : formatRupiah(r.sisa)}
            </p>
            <div className="mt-3 h-2 rounded-full bg-track">
              <div
                className={`h-2 rounded-full ${
                  waspada ? 'bg-peringatan-bar' : 'bg-aksen'
                }`}
                style={{ width: `${Math.min(100, pTotal)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-teks-sekunder">
              <span>Terpakai {formatRupiah(r.terpakai)}</span>
              <span>Anggaran {formatRupiah(total)}</span>
            </div>
          </div>

          <div className="rounded-[20px] bg-aksen p-4 text-white shadow-sm">
            <p className="text-xs">Boleh dipakai hari ini</p>
            <p className="my-0.5 text-[28px] font-bold leading-tight">
              {formatRupiah(r.bolehHariIni)}
            </p>
            <p className="text-xs">
              {r.sisaHariIni >= 0
                ? `Sisa ${r.sisaHari} hari · terpakai hari ini ${formatRupiah(r.terpakaiHariIni)}`
                : `Melebihi jatah ${formatRupiah(-r.sisaHariIni)} · sisa ${r.sisaHari} hari`}
            </p>
          </div>
        </>
      )}

      <div className="rounded-[20px] bg-card p-4 shadow-sm">
        <p className="mb-3 text-xs text-teks-sekunder">Pengeluaran per kategori</p>
        <DonutKategori
          perKategori={r.terpakaiPerKategori}
          namaKategori={namaKategori}
        />
      </div>

      <div className="rounded-[20px] bg-card p-4 shadow-sm">
        <p className="mb-2 text-xs text-teks-sekunder">Pengeluaran 7 hari</p>
        <BatangHarian data={pengeluaranHarian(transaksi, hariIni)} />
      </div>
    </div>
  )
}