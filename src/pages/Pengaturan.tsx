import { useRef, useState, type ChangeEvent } from 'react'
import { Download, Upload } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { ekspor, impor, unduh } from '../db/cadangan'
import { KUNCI_PENGINGAT, simpanPengaturan } from '../db/pengaturanRepo'
import { todayString } from '../utils/format'
import { bacaTema, simpanTema, type Tema } from '../utils/tema'

const TEMA: { id: Tema; label: string }[] = [
  { id: 'system', label: 'Ikuti sistem' },
  { id: 'light', label: 'Terang' },
  { id: 'dark', label: 'Gelap' },
]

type Status = { jenis: 'ok' | 'galat'; teks: string } | null

type Props = { onBukaAnggaran: () => void }

export default function Pengaturan({ onBukaAnggaran }: Props) {
  const [tema, setTema] = useState<Tema>(bacaTema)
  const [status, setStatus] = useState<Status>(null)
  const [berkas, setBerkas] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const budget = useLiveQuery(() => db.budgets.toCollection().first())
  const pengingat = useLiveQuery(
    async () => (await db.settings.get(KUNCI_PENGINGAT))?.value ?? 'on',
  )

  const labelPeriode = budget?.periodType === 'monthly' ? 'Bulanan' : 'Mingguan'
  const pengingatAktif = pengingat !== 'off'

  function pilihTema(t: Tema) {
    setTema(t)
    simpanTema(t)
  }

  async function ubahPengingat() {
    await simpanPengaturan(KUNCI_PENGINGAT, pengingatAktif ? 'off' : 'on')
  }

  async function unduhCadangan() {
    try {
      unduh(`tracker-money-${todayString()}.json`, await ekspor())
      setStatus({
        jenis: 'ok',
        teks: 'Cadangan diunduh. Simpan file itu di tempat yang aman.',
      })
    } catch {
      setStatus({ jenis: 'galat', teks: 'Gagal membuat cadangan.' })
    }
  }

  function pilihBerkas(e: ChangeEvent<HTMLInputElement>) {
    setBerkas(e.target.files?.[0] ?? null)
    setStatus(null)
    e.target.value = '' // supaya file yang sama bisa dipilih lagi
  }

  async function jalankanImpor() {
    if (!berkas) return
    try {
      const jumlah = await impor(await berkas.text())
      setStatus({ jenis: 'ok', teks: `Berhasil memulihkan ${jumlah} transaksi.` })
    } catch (e) {
      setStatus({
        jenis: 'galat',
        teks: e instanceof Error ? e.message : 'Gagal mengimpor data.',
      })
    } finally {
      setBerkas(null)
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <h1 className="text-[22px] font-bold">Pengaturan</h1>

      <h2 className="mt-1 text-xs text-teks-sekunder">Tampilan</h2>
      <div className="rounded-[20px] bg-card p-4 shadow-sm">
        <p className="mb-2.5 text-sm">Tema</p>
        <div className="flex rounded-xl bg-track p-1">
          {TEMA.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={tema === t.id}
              onClick={() => pilihTema(t.id)}
              className={`min-h-10 flex-1 rounded-[9px] text-[13px] ${
                tema === t.id ? 'bg-segmen-aktif font-bold' : 'text-teks-sekunder'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-teks-sekunder">
          Memakai HP Samsung dan warnanya tidak sesuai pilihan? Pasang aplikasi
          lewat Chrome, atau matikan mode gelap paksa di Samsung Internet.
        </p>
      </div>

      <h2 className="mt-1 text-xs text-teks-sekunder">Anggaran</h2>
      <div className="rounded-[20px] bg-card px-4 shadow-sm">
        <button
          type="button"
          onClick={onBukaAnggaran}
          className="flex min-h-14 w-full items-center justify-between border-b border-track text-sm"
        >
          <span>Periode anggaran</span>
          <span className="text-[13px] text-teks-sekunder">{labelPeriode} ›</span>
        </button>

        <div className="flex min-h-16 items-center gap-3">
          <div className="flex-1">
            <p className="text-sm">Pengingat boros</p>
            <p className="text-xs text-teks-sekunder">
              Ingatkan saat mencapai 80% dan 100%
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={pengingatAktif}
            aria-label="Pengingat boros"
            onClick={ubahPengingat}
            className={`relative h-7 w-12 flex-none rounded-full transition-colors ${
              pengingatAktif ? 'bg-aksen' : 'bg-track'
            }`}
          >
            <span
              className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition-all ${
                pengingatAktif ? 'left-[23px]' : 'left-[3px]'
              }`}
            />
          </button>
        </div>
      </div>

      <h2 className="mt-1 text-xs text-teks-sekunder">Data</h2>
      <div className="rounded-[20px] bg-card px-4 shadow-sm">
        <button
          type="button"
          onClick={unduhCadangan}
          className="flex min-h-16 w-full items-center gap-3 border-b border-track text-left"
        >
          <Download size={20} className="flex-none text-aksen-teks" />
          <span className="flex-1">
            <span className="block text-sm">Ekspor cadangan (.json)</span>
            <span className="block text-xs text-teks-sekunder">
              Simpan semua datamu ke sebuah file.
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex min-h-16 w-full items-center gap-3 text-left"
        >
          <Upload size={20} className="flex-none text-aksen-teks" />
          <span className="flex-1">
            <span className="block text-sm">Impor cadangan (.json)</span>
            <span className="block text-xs text-teks-sekunder">
              Hanya untuk file cadangan dari Tracker Money. Menggantikan semua
              data saat ini.
            </span>
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          onChange={pilihBerkas}
          className="hidden"
          aria-label="Pilih file cadangan"
        />
      </div>

      <p className="rounded-xl bg-aksen-tint p-3 text-xs text-aksen-teks">
        Semua datamu tersimpan di HP ini dan tidak dikirim ke mana pun. Pindah
        HP? Ekspor cadangan dulu, lalu impor di HP baru.
      </p>

      {berkas && (
        <div role="alert" className="rounded-[20px] bg-peringatan-tint p-4">
          <p className="text-sm font-semibold text-peringatan-teks">
            Impor <strong>{berkas.name}</strong> akan menggantikan semua data saat
            ini. Lanjutkan?
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setBerkas(null)}
              className="min-h-11 flex-1 rounded-xl bg-card text-sm font-semibold"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={jalankanImpor}
              className="min-h-11 flex-1 rounded-xl bg-bahaya text-sm font-bold text-white"
            >
              Ya, ganti data
            </button>
          </div>
        </div>
      )}

      {status && (
        <p
          role="status"
          className={`rounded-xl p-3 text-xs ${
            status.jenis === 'galat'
              ? 'bg-peringatan-tint text-peringatan-teks'
              : 'bg-aksen-tint text-aksen-teks'
          }`}
        >
          {status.teks}
        </p>
      )}

      <p className="mt-2 text-center text-xs text-teks-sekunder">
        Tracker Money · versi 0.1
      </p>
    </div>
  )
}