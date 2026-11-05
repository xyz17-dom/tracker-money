import { useState, type FormEvent } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Category } from '../db/db'
import {
  hapusKategori,
  tambahKategori,
  ubahNamaKategori,
} from '../db/kategoriRepo'
import { PANJANG_NAMA_MAKS } from '../services/kategori'

const JENIS: { id: Category['kind']; label: string }[] = [
  { id: 'expense', label: 'Pengeluaran' },
  { id: 'income', label: 'Pemasukan' },
]

const pesanGalat = (e: unknown) =>
  e instanceof Error ? e.message : 'Terjadi kesalahan. Coba lagi.'

type Props = { onClose: () => void }

export default function Kategori({ onClose }: Props) {
  const [kind, setKind] = useState<Category['kind']>('expense')
  const [namaBaru, setNamaBaru] = useState('')
  const [galat, setGalat] = useState('')
  const [ubahId, setUbahId] = useState<number | null>(null)
  const [ubahNama, setUbahNama] = useState('')
  const [hapusId, setHapusId] = useState<number | null>(null)
  const [pengganti, setPengganti] = useState<number | null>(null)

  const categories = useLiveQuery(() => db.categories.toArray())
  const transaksi = useLiveQuery(() => db.transactions.toArray())

  if (!categories || !transaksi) {
    return <div className="p-4 text-sm text-teks-sekunder">Memuat...</div>
  }

  const dipakai = new Map<number, number>()
  for (const t of transaksi) {
    dipakai.set(t.categoryId, (dipakai.get(t.categoryId) ?? 0) + 1)
  }

  const daftar = categories.filter((c) => c.kind === kind)
  const namaJenis = kind === 'expense' ? 'pengeluaran' : 'pemasukan'

  function ubahJenis(k: Category['kind']) {
    setKind(k)
    setUbahId(null)
    setHapusId(null)
    setGalat('')
  }

  async function tambah(e: FormEvent) {
    e.preventDefault()
    setGalat('')
    try {
      await tambahKategori(namaBaru, kind)
      setNamaBaru('')
    } catch (err) {
      setGalat(pesanGalat(err))
    }
  }

  function mulaiUbah(c: Category) {
    setUbahId(c.id)
    setUbahNama(c.name)
    setHapusId(null)
    setGalat('')
  }

  async function simpanUbah(e: FormEvent) {
    e.preventDefault()
    if (ubahId === null) return
    setGalat('')
    try {
      await ubahNamaKategori(ubahId, ubahNama)
      setUbahId(null)
    } catch (err) {
      setGalat(pesanGalat(err))
    }
  }

  function mulaiHapus(c: Category) {
    setHapusId(c.id)
    setUbahId(null)
    setPengganti(daftar.find((x) => x.id !== c.id)?.id ?? null)
    setGalat('')
  }

  async function konfirmasiHapus() {
    if (hapusId === null) return
    setGalat('')
    try {
      await hapusKategori(hapusId, pengganti ?? undefined)
      setHapusId(null)
    } catch (err) {
      setGalat(pesanGalat(err))
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[430px] flex-col gap-3 bg-latar p-4 font-sans text-teks">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Kelola kategori</h1>
        <button
          type="button"
          aria-label="Tutup"
          onClick={onClose}
          className="h-11 w-11 text-2xl"
        >
          ×
        </button>
      </div>

      <div className="flex rounded-xl bg-track p-1">
        {JENIS.map((j) => (
          <button
            key={j.id}
            type="button"
            aria-pressed={kind === j.id}
            onClick={() => ubahJenis(j.id)}
            className={`min-h-10 flex-1 rounded-[9px] text-sm ${
              kind === j.id ? 'bg-segmen-aktif font-bold' : 'text-teks-sekunder'
            }`}
          >
            {j.label}
          </button>
        ))}
      </div>

      <form onSubmit={tambah} className="rounded-[20px] bg-card p-4 shadow-sm">
        <label htmlFor="nama-kategori" className="text-xs text-teks-sekunder">
          Kategori {namaJenis} baru
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="nama-kategori"
            type="text"
            maxLength={PANJANG_NAMA_MAKS}
            autoComplete="off"
            placeholder={kind === 'expense' ? 'Contoh: Kos' : 'Contoh: Beasiswa'}
            value={namaBaru}
            onChange={(e) => setNamaBaru(e.target.value)}
            className="h-12 min-w-0 flex-1 rounded-xl bg-latar px-4 text-sm outline-none focus:ring-2 focus:ring-aksen"
          />
          <button
            type="submit"
            className="min-h-12 rounded-2xl bg-aksen px-5 text-sm font-bold text-white"
          >
            Tambah
          </button>
        </div>
      </form>

      {galat && (
        <p
          role="alert"
          className="rounded-xl bg-peringatan-tint p-3 text-xs text-peringatan-teks"
        >
          {galat}
        </p>
      )}

      <div className="rounded-[20px] bg-card px-4 shadow-sm">
        {daftar.map((c) => {
          const n = dipakai.get(c.id) ?? 0

          if (ubahId === c.id) {
            return (
              <form
                key={c.id}
                onSubmit={simpanUbah}
                className="flex flex-col gap-2 border-b border-track py-3 last:border-b-0"
              >
                <label htmlFor={`ubah-${c.id}`} className="text-xs text-teks-sekunder">
                  Nama kategori
                </label>
                <input
                  id={`ubah-${c.id}`}
                  type="text"
                  autoFocus
                  maxLength={PANJANG_NAMA_MAKS}
                  autoComplete="off"
                  value={ubahNama}
                  onChange={(e) => setUbahNama(e.target.value)}
                  className="h-12 rounded-xl bg-latar px-4 text-sm outline-none focus:ring-2 focus:ring-aksen"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setUbahId(null)}
                    className="min-h-11 rounded-xl bg-latar px-4 text-sm font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="min-h-11 rounded-xl bg-aksen px-4 text-sm font-bold text-white"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            )
          }

          if (hapusId === c.id) {
            const lain = daftar.filter((x) => x.id !== c.id)
            return (
              <div
                key={c.id}
                role="alert"
                className="my-3 flex flex-col items-center gap-3 rounded-[20px] bg-peringatan-tint p-4"
              >
                <p className="w-full text-sm font-semibold text-peringatan-teks">
                  {lain.length === 0
                    ? `Minimal harus ada satu kategori ${namaJenis}.`
                    : n > 0
                      ? `Kategori "${c.name}" dipakai ${n} transaksi. Pindahkan transaksinya ke:`
                      : `Hapus kategori "${c.name}"?`}
                </p>
                {n > 0 && lain.length > 0 && (
                  <>
                    <label htmlFor="pengganti" className="sr-only">
                      Kategori pengganti
                    </label>
                    <select
                      id="pengganti"
                      value={pengganti ?? ''}
                      onChange={(e) => setPengganti(Number(e.target.value))}
                      className="h-12 w-full rounded-xl bg-card px-3 text-sm"
                    >
                      {lain.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                {kind === 'expense' && lain.length > 0 && (
                  <p className="w-full text-xs text-peringatan-teks">
                    Batas anggaran kategori ini ikut dihapus.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setHapusId(null)}
                  className="min-h-12 w-full max-w-[240px] rounded-2xl bg-card text-sm font-semibold"
                >
                  Batal
                </button>
                {lain.length > 0 && (
                  <button
                    type="button"
                    onClick={konfirmasiHapus}
                    className="min-h-12 w-full max-w-[240px] rounded-2xl bg-bahaya text-sm font-bold text-white"
                  >
                    Ya, hapus
                  </button>
                )}
              </div>
            )
          }

          return (
            <div
              key={c.id}
              className="flex min-h-16 items-center gap-1 border-b border-track last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{c.name}</p>
                <p className="text-xs text-teks-sekunder">
                  {c.isDefault ? 'Bawaan · ' : ''}
                  {n} transaksi
                </p>
              </div>
              <button
                type="button"
                aria-label={`Ubah nama ${c.name}`}
                onClick={() => mulaiUbah(c)}
                className="flex h-11 w-11 items-center justify-center text-teks-sekunder"
              >
                <Pencil size={18} />
              </button>
              <button
                type="button"
                aria-label={`Hapus ${c.name}`}
                onClick={() => mulaiHapus(c)}
                className="flex h-11 w-11 items-center justify-center text-teks-sekunder"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}