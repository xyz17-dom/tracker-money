import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { lewatiOnboarding, selesaikanOnboarding } from '../db/pengaturanRepo'
import type { PeriodType } from '../services/anggaran'
import { formatRibuan, formatRupiah, hanyaAngka } from '../utils/format'

const PILIHAN_PERIODE: { id: PeriodType; judul: string; ket: string }[] = [
  { id: 'weekly', judul: 'Mingguan', ket: 'Cocok untuk uang saku mingguan' },
  { id: 'monthly', judul: 'Bulanan', ket: 'Cocok untuk uang bulanan atau gaji' },
]

const SARAN: Record<PeriodType, number[]> = {
  weekly: [100000, 250000, 500000],
  monthly: [500000, 1000000, 2000000],
}

export default function Onboarding() {
  const categories = useLiveQuery(() => db.categories.toArray())

  const [langkah, setLangkah] = useState(1)
  const [periode, setPeriode] = useState<PeriodType>('weekly')
  const [total, setTotal] = useState(0)
  const [favorit, setFavorit] = useState<number[]>([])
  const [menyimpan, setMenyimpan] = useState(false)
  const [galat, setGalat] = useState('')

  const kata = periode === 'weekly' ? 'minggu' : 'bulan'

  function ubahFavorit(id: number) {
    setFavorit((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))
  }

  async function mulai() {
    setMenyimpan(true)
    setGalat('')
    try {
      // Setelah tersimpan, App.tsx otomatis berpindah ke aplikasi utama
      await selesaikanOnboarding({
        periodType: periode,
        totalAmount: total,
        favorit,
      })
    } catch {
      setGalat('Gagal menyimpan. Coba lagi.')
      setMenyimpan(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[430px] flex-col gap-4 bg-latar p-4 font-sans text-teks">
      <div className="flex items-center justify-between">
        <p className="text-xs text-teks-sekunder">Langkah {langkah} dari 3</p>
        <button
          type="button"
          onClick={lewatiOnboarding}
          className="min-h-11 px-2 text-sm text-teks-sekunder"
        >
          Lewati
        </button>
      </div>

      <div className="flex gap-1.5" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full ${
              n <= langkah ? 'bg-aksen' : 'bg-track'
            }`}
          />
        ))}
      </div>

      {langkah === 1 && (
        <>
          <div>
            <h1 className="text-[22px] font-bold">Selamat datang di Tracker Money</h1>
            <p className="mt-1 text-sm text-teks-sekunder">
              Uang Anda biasanya datang tiap kapan?
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {PILIHAN_PERIODE.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={periode === p.id}
                onClick={() => setPeriode(p.id)}
                className={`rounded-[20px] border-2 p-4 text-left ${
                  periode === p.id
                    ? 'border-aksen bg-aksen-tint'
                    : 'border-transparent bg-card'
                }`}
              >
                <span className="block font-bold">{p.judul}</span>
                <span className="block text-sm text-teks-sekunder">{p.ket}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {langkah === 2 && (
        <>
          <div>
            <h1 className="text-[22px] font-bold">
              Berapa uang saku atau pemasukan Anda per {kata}?
            </h1>
            <p className="mt-1 text-sm text-teks-sekunder">
              Angka ini menjadi total anggaran. Bisa diubah kapan saja di tab
              Anggaran.
            </p>
          </div>
          <div className="rounded-[20px] bg-card px-4 py-6 text-center shadow-sm">
            <label htmlFor="uang-saku" className="text-xs text-teks-sekunder">
              Nominal per {kata}
            </label>
            <div className="mt-1 flex items-baseline justify-center gap-2">
              <span className="text-xl font-bold text-teks-sekunder">Rp</span>
              <input
                id="uang-saku"
                inputMode="numeric"
                autoFocus
                placeholder="0"
                value={total ? formatRibuan(total) : ''}
                onChange={(e) => setTotal(hanyaAngka(e.target.value))}
                className="w-full max-w-[220px] bg-transparent text-center text-4xl font-bold outline-none placeholder:text-teks-sekunder"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {SARAN[periode].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTotal(n)}
                className="min-h-11 rounded-full bg-card px-4 text-[13px]"
              >
                {formatRupiah(n)}
              </button>
            ))}
          </div>
        </>
      )}

      {langkah === 3 && (
        <>
          <div>
            <h1 className="text-[22px] font-bold">
              Kategori apa yang paling sering Anda pakai?
            </h1>
            <p className="mt-1 text-sm text-teks-sekunder">
              Kategori pilihan tampil paling atas saat mencatat. Boleh
              dikosongkan.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories?.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={favorit.includes(c.id)}
                onClick={() => ubahFavorit(c.id)}
                className={`min-h-11 rounded-full px-4 text-sm ${
                  favorit.includes(c.id) ? 'bg-aksen text-white' : 'bg-card'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </>
      )}

      {galat && (
        <p role="alert" className="rounded-xl bg-peringatan-tint p-3 text-xs text-peringatan-teks">
          {galat}
        </p>
      )}

      <div className="mt-auto flex gap-2">
        {langkah > 1 && (
          <button
            type="button"
            onClick={() => setLangkah(langkah - 1)}
            className="min-h-[52px] rounded-2xl bg-card px-5 text-base font-semibold"
          >
            Kembali
          </button>
        )}
        <button
          type="button"
          disabled={(langkah === 2 && total <= 0) || menyimpan}
          onClick={langkah < 3 ? () => setLangkah(langkah + 1) : mulai}
          className="min-h-[52px] flex-1 rounded-2xl bg-aksen text-base font-bold text-white disabled:opacity-40"
        >
          {langkah < 3 ? 'Lanjut' : 'Mulai'}
        </button>
      </div>
    </div>
  )
}