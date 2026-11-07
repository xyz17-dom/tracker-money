import { useRef, useState, type ChangeEvent } from 'react'
import {
  ChevronRight,
  Download,
  FileSpreadsheet,
  Monitor,
  Moon,
  Sun,
  Tags,
  Upload,
  type LucideIcon,
} from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { ekspor, impor, unduh } from '../db/cadangan'
import { hapusSemuaData } from '../db/dataRepo'
import { buatLaporanExcel } from '../db/eksporExcel'
import { KUNCI_PENGINGAT, simpanPengaturan } from '../db/pengaturanRepo'
import { todayString } from '../utils/format'
import { bacaTema, simpanTema, type Tema } from '../utils/tema'
import { unduhBlob } from '../utils/unduh'

const TEMA: { id: Tema; label: string; Ikon: LucideIcon }[] = [
  { id: 'system', label: 'Ikuti sistem', Ikon: Monitor },
  { id: 'light', label: 'Terang', Ikon: Sun },
  { id: 'dark', label: 'Gelap', Ikon: Moon },
]

type Status = { jenis: 'ok' | 'galat'; teks: string } | null

type Props = {
  onBukaAnggaran: () => void
  onBukaKategori: () => void
}

export default function Pengaturan({ onBukaAnggaran, onBukaKategori }: Props) {
  const [tema, setTema] = useState<Tema>(bacaTema)
  const [status, setStatus] = useState<Status>(null)
  const [berkas, setBerkas] = useState<File | null>(null)
  const [menyiapkanExcel, setMenyiapkanExcel] = useState(false)
  const [konfirmasiSemua, setKonfirmasiSemua] = useState(false)
  const [ketikan, setKetikan] = useState('')
  const [menghapus, setMenghapus] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const budget = useLiveQuery(() => db.budgets.toCollection().first())
  const pengingat = useLiveQuery(
    async () => (await db.settings.get(KUNCI_PENGINGAT))?.value ?? 'on',
  )

  const labelPeriode = budget?.periodType === 'monthly' ? 'Bulanan' : 'Mingguan'
  const pengingatAktif = pengingat !== 'off'
  const kataCocok = ketikan.trim().toUpperCase() === 'HAPUS'

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

  async function unduhExcel() {
    setMenyiapkanExcel(true)
    setStatus(null)
    try {
      unduhBlob(`tracker-money-laporan-${todayString()}.xlsx`, await buatLaporanExcel())
      setStatus({ jenis: 'ok', teks: 'Laporan Excel diunduh.' })
    } catch {
      setStatus({ jenis: 'galat', teks: 'Gagal membuat laporan Excel. Coba lagi.' })
    } finally {
      setMenyiapkanExcel(false)
    }
  }

  async function hapusSemua() {
    if (!kataCocok) return
    setMenghapus(true)
    try {
      // Setelah data kosong, App.tsx otomatis menampilkan onboarding
      await hapusSemuaData()
      setKonfirmasiSemua(false)
      setKetikan('')
    } catch {
      setStatus({ jenis: 'galat', teks: 'Gagal menghapus data. Coba lagi.' })
    } finally {
      setMenghapus(false)
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
      <div className="flex min-h-16 items-center justify-between gap-3 rounded-[20px] bg-card px-4 shadow-sm">
        <p className="text-sm">Tema</p>
        <div role="group" aria-label="Pilih tema" className="flex rounded-xl bg-track p-1">
          {TEMA.map(({ id, label, Ikon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={tema === id}
              aria-label={label}
              title={label}
              onClick={() => pilihTema(id)}
              className={`flex h-11 w-12 items-center justify-center rounded-[9px] ${
                tema === id
                  ? 'bg-segmen-aktif text-aksen-teks'
                  : 'text-teks-sekunder'
              }`}
            >
              <Ikon size={18} strokeWidth={tema === id ? 2.25 : 1.75} />
            </button>
          ))}
        </div>
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

      <h2 className="mt-1 text-xs text-teks-sekunder">Kategori</h2>
      <div className="rounded-[20px] bg-card px-4 shadow-sm">
        <button
          type="button"
          onClick={onBukaKategori}
          className="flex min-h-16 w-full items-center gap-3 text-left"
        >
          <Tags size={20} className="flex-none text-aksen-teks" />
          <span className="flex-1">
            <span className="block text-sm">Kelola kategori</span>
            <span className="block text-xs text-teks-sekunder">
              Tambah, ubah nama, atau hapus kategori pengeluaran dan pemasukan.
            </span>
          </span>
          <ChevronRight size={18} className="flex-none text-teks-sekunder" />
        </button>
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
          disabled={menyiapkanExcel}
          onClick={unduhExcel}
          className="flex min-h-16 w-full items-center gap-3 border-b border-track text-left disabled:opacity-60"
        >
          <FileSpreadsheet size={20} className="flex-none text-aksen-teks" />
          <span className="flex-1">
            <span className="block text-sm">Ekspor laporan Excel (.xlsx)</span>
            <span className="block text-xs text-teks-sekunder">
              {menyiapkanExcel
                ? 'Menyiapkan laporan...'
                : 'Untuk dibaca atau diolah di Excel. Bukan untuk diimpor kembali.'}
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

      <h2 className="mt-1 text-xs text-peringatan-teks">Zona berbahaya</h2>
      <div className="rounded-[20px] bg-card p-4 shadow-sm">
        {!konfirmasiSemua ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-full">
              <p className="text-sm font-semibold">Hapus semua data</p>
              <p className="mt-1 text-xs text-teks-sekunder">
                Menghapus semua transaksi, anggaran, dan pengaturan di HP ini,
                lalu memulai dari awal. Pilihan tema tidak ikut terhapus.
                Tindakan ini tidak bisa dibatalkan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setKonfirmasiSemua(true)}
              className="min-h-12 w-full max-w-[240px] rounded-2xl bg-bahaya text-sm font-bold text-white"
            >
              Hapus semua data
            </button>
          </div>
        ) : (
          <div role="alert" className="flex flex-col items-center gap-3">
            <p className="w-full text-sm font-semibold text-peringatan-teks">
              Semua datamu akan hilang. Simpan cadangan dulu supaya bisa
              dipulihkan lewat Impor.
            </p>
            <button
              type="button"
              onClick={unduhCadangan}
              className="min-h-12 w-full max-w-[240px] rounded-2xl bg-aksen text-sm font-bold text-white"
            >
              Unduh cadangan dulu
            </button>
            <label htmlFor="ketik-hapus" className="w-full text-xs text-teks-sekunder">
              Ketik HAPUS untuk melanjutkan
            </label>
            <input
              id="ketik-hapus"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="HAPUS"
              value={ketikan}
              onChange={(e) => setKetikan(e.target.value)}
              className="h-12 w-full rounded-xl bg-latar px-4 text-sm outline-none focus:ring-2 focus:ring-bahaya"
            />
            <button
              type="button"
              onClick={() => {
                setKonfirmasiSemua(false)
                setKetikan('')
              }}
              className="min-h-12 w-full max-w-[240px] rounded-2xl bg-latar text-sm font-semibold"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!kataCocok || menghapus}
              onClick={hapusSemua}
              className="min-h-12 w-full max-w-[240px] rounded-2xl bg-bahaya text-sm font-bold text-white disabled:opacity-40"
            >
              {menghapus ? 'Menghapus...' : 'Ya, hapus semua'}
            </button>
          </div>
        )}
      </div>

      <p className="mt-2 text-center text-xs text-teks-sekunder">
        Tracker Money · versi 0.1
      </p>
    </div>
  )
}