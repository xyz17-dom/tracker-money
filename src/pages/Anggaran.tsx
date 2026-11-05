import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import InputNominal from '../components/inputNominal'
import { db, type BudgetCategory } from '../db/db'
import { simpanAnggaran, simpanBatasKategori } from '../db/anggaranRepo'
import { hapusAnggaran } from '../db/dataRepo'
import {
  AMBANG_PERINGATAN,
  hitungRingkasan,
  persen,
  type PeriodType,
} from '../services/anggaran'
import { formatRupiah, labelRentang, todayString } from '../utils/format'

const PERIODE: { id: PeriodType; label: string; kata: string }[] = [
  { id: 'weekly', label: 'Mingguan', kata: 'minggu ini' },
  { id: 'monthly', label: 'Bulanan', kata: 'bulan ini' },
]

export default function Anggaran() {
  const [konfirmasiHapus, setKonfirmasiHapus] = useState(false)

  const budgets = useLiveQuery(() => db.budgets.toArray())
  const budget = budgets?.[0]

  const limits = useLiveQuery(
    async (): Promise<BudgetCategory[]> =>
      budget
        ? await db.budgetCategories.where('budgetId').equals(budget.id).toArray()
        : [],
    [budget?.id],
  )
  const categories = useLiveQuery(() =>
    db.categories.filter((c) => c.kind === 'expense').toArray(),
  )
  const transaksi = useLiveQuery(() => db.transactions.toArray())

  if (!budgets || !limits || !categories || !transaksi) {
    return <div className="p-4 text-sm text-teks-sekunder">Memuat...</div>
  }

  const tipe = budget?.periodType ?? 'weekly'
  const total = budget?.totalAmount ?? 0
  const info = PERIODE.find((p) => p.id === tipe) ?? PERIODE[0]

  const r = hitungRingkasan(transaksi, tipe, total, todayString())
  const batasMap = new Map(limits.map((l) => [l.categoryId, l.limitAmount] as const))
  const dialokasi = limits.reduce((jumlah, l) => jumlah + l.limitAmount, 0)
  const pTotal = persen(r.terpakai, total)
  const totalWaspada = total > 0 && pTotal >= AMBANG_PERINGATAN

  function ubahPeriode(t: PeriodType) {
    simpanAnggaran(t, total)
  }
  function ubahTotal(n: number) {
    simpanAnggaran(tipe, n)
  }
  function ubahBatas(categoryId: number, n: number) {
    if (budget) simpanBatasKategori(budget.id, categoryId, n)
  }
  async function hapus() {
    await hapusAnggaran()
    setKonfirmasiHapus(false)
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <h1 className="text-[22px] font-bold">Anggaran</h1>

      <div className="flex rounded-xl bg-track p-1">
        {PERIODE.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={tipe === p.id}
            onClick={() => ubahPeriode(p.id)}
            className={`min-h-10 flex-1 rounded-[9px] text-sm ${
              tipe === p.id ? 'bg-segmen-aktif font-bold' : 'text-teks-sekunder'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="rounded-[20px] bg-card p-4 shadow-sm">
        <p className="text-xs text-teks-sekunder">Total anggaran {info.kata}</p>
        <p className="text-[11px] text-teks-sekunder">
          {labelRentang(r.periode.mulai, r.periode.akhir)}
        </p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-bold text-teks-sekunder">Rp</span>
          <InputNominal
            key={total}
            id="total-anggaran"
            label="Total anggaran"
            nilai={total}
            onSimpan={ubahTotal}
            className="w-full bg-transparent text-3xl font-bold outline-none placeholder:text-teks-sekunder"
          />
        </div>

        {total > 0 && (
          <>
            <div className="mt-3 h-2 rounded-full bg-track">
              <div
                className={`h-2 rounded-full ${
                  totalWaspada ? 'bg-peringatan-bar' : 'bg-aksen'
                }`}
                style={{ width: `${Math.min(100, pTotal)}%` }}
              />
            </div>
            <p
              className={`mt-2 text-xs ${
                r.sisa < 0 ? 'text-peringatan-teks' : 'text-teks-sekunder'
              }`}
            >
              Terpakai {formatRupiah(r.terpakai)} ·{' '}
              {r.sisa < 0
                ? `Melebihi ${formatRupiah(-r.sisa)}`
                : `Sisa ${formatRupiah(r.sisa)}`}
            </p>
          </>
        )}

        {total === 0 && (
          <p className="mt-2 text-xs text-teks-sekunder">
            Isi total anggaran untuk mulai menghitung sisa uang Anda.
          </p>
        )}
      </div>

      {total > 0 && (
        <div className="rounded-[20px] bg-aksen-tint p-4 text-aksen-teks">
          <p className="text-xs">Pratinjau: boleh dipakai hari ini</p>
          <p className="text-2xl font-bold">{formatRupiah(r.bolehHariIni)}</p>
          <p className="text-xs">
            Sisa {r.sisaHari} hari · terpakai hari ini{' '}
            {formatRupiah(r.terpakaiHariIni)}
          </p>
        </div>
      )}

      <div className="mt-1">
        <h2 className="text-xs text-teks-sekunder">Batas per kategori</h2>
        <p className="text-[11px] text-teks-sekunder">
          Kosongkan kolom untuk tanpa batas.
        </p>
      </div>
      {!budget && (
        <p className="text-xs text-teks-sekunder">
          Isi total anggaran dulu, lalu atur batas tiap kategori.
        </p>
      )}
      {dialokasi > total && total > 0 && (
        <p
          role="alert"
          className="rounded-xl bg-peringatan-tint p-3 text-xs text-peringatan-teks"
        >
          Jumlah batas kategori ({formatRupiah(dialokasi)}) melebihi total
          anggaran ({formatRupiah(total)}).
        </p>
      )}

      {categories.map((c) => {
        const batas = batasMap.get(c.id) ?? 0
        const terpakai = r.terpakaiPerKategori.get(c.id) ?? 0
        const p = persen(terpakai, batas)
        const waspada = batas > 0 && p >= AMBANG_PERINGATAN

        return (
          <div key={c.id} className="rounded-[20px] bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="text-xs text-teks-sekunder">
                  Terpakai {formatRupiah(terpakai)}
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-xl bg-latar px-3">
                <span className="text-xs text-teks-sekunder">Rp</span>
                <InputNominal
                  key={batas}
                  id={`batas-${c.id}`}
                  label={`Batas ${c.name}`}
                  nilai={batas}
                  disabled={!budget}
                  onSimpan={(n) => ubahBatas(c.id, n)}
                  className="h-11 w-24 bg-transparent text-right text-sm outline-none placeholder:text-teks-sekunder disabled:opacity-40"
                />
              </div>
            </div>

            {batas > 0 && (
              <>
                <div className="mt-3 h-2 rounded-full bg-track">
                  <div
                    className={`h-2 rounded-full ${
                      waspada ? 'bg-peringatan-bar' : 'bg-aksen'
                    }`}
                    style={{ width: `${Math.min(100, p)}%` }}
                  />
                </div>
                <p
                  className={`mt-2 text-xs ${
                    waspada ? 'text-peringatan-teks' : 'text-teks-sekunder'
                  }`}
                >
                  {p >= 100
                    ? `Melebihi batas ${formatRupiah(terpakai - batas)}`
                    : `${p}% terpakai · sisa ${formatRupiah(batas - terpakai)}`}
                </p>
              </>
            )}
          </div>
        )
      })}

      {budget && (
        <div className="mt-2 flex flex-col items-center gap-3">
          {konfirmasiHapus ? (
            <div
              role="alert"
              className="flex w-full flex-col items-center gap-3 rounded-[20px] bg-peringatan-tint p-4"
            >
              <p className="text-center text-sm font-semibold text-peringatan-teks">
                Hapus anggaran dan semua batas kategori? Transaksimu tidak ikut
                terhapus.
              </p>
              <button
                type="button"
                onClick={() => setKonfirmasiHapus(false)}
                className="min-h-12 w-full max-w-[240px] rounded-2xl bg-card text-sm font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={hapus}
                className="min-h-12 w-full max-w-[240px] rounded-2xl bg-bahaya text-sm font-bold text-white"
              >
                Ya, hapus anggaran
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setKonfirmasiHapus(true)}
              className="min-h-12 w-full max-w-[240px] rounded-2xl bg-bahaya text-sm font-bold text-white"
            >
              Hapus anggaran
            </button>
          )}
        </div>
      )}
    </div>
  )
}