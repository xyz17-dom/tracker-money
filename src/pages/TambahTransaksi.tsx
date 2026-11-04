import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Transaction } from '../db/db'
import {
  hapusTransaksi,
  tambahTransaksi,
  ubahTransaksi,
} from '../db/transaksiRepo'
import { bacaFavorit } from '../db/pengaturanRepo'
import { formatRibuan, hanyaAngka } from '../utils/format'

type Props = {
  // Jika transaksi baru saja dihapus, ia dilaporkan agar bisa diurungkan
  onClose: (dihapus?: Transaction) => void
  transaksi?: Transaction // jika ada, layar ini mengubah transaksi tersebut
}

export default function TambahTransaksi({ onClose, transaksi }: Props) {
  const categories = useLiveQuery(() => db.categories.toArray())
  const sources = useLiveQuery(() => db.sources.toArray())
  const favorit = useLiveQuery(bacaFavorit)

  const mengubah = transaksi !== undefined

  const [type, setType] = useState<'income' | 'expense'>(
    transaksi?.type ?? 'expense',
  )
  const [nominal, setNominal] = useState(transaksi?.amount ?? 0)
  const [categoryId, setCategoryId] = useState<number | null>(
    transaksi?.categoryId ?? null,
  )
  const [sourceId, setSourceId] = useState<number | null>(
    transaksi?.sourceId ?? null,
  )
  const [note, setNote] = useState(transaksi?.note ?? '')
  const [konfirmasiHapus, setKonfirmasiHapus] = useState(false)

  // Jika sumber dana belum dipilih, pakai yang pertama (Tunai)
  const aktifSourceId = sourceId ?? sources?.[0]?.id ?? null
  const bisaSimpan = nominal > 0 && categoryId !== null && aktifSourceId !== null

  // Kategori favorit tampil paling atas; sisanya tetap berurutan seperti semula
  const kategoriUrut = [...(categories ?? [])].sort(
    (a, b) =>
      Number(favorit?.includes(b.id) ?? false) -
      Number(favorit?.includes(a.id) ?? false),
  )

  async function simpan() {
    if (nominal <= 0 || categoryId === null || aktifSourceId === null) return
    const input = {
      type,
      amount: nominal,
      categoryId,
      sourceId: aktifSourceId,
      note,
    }
    if (transaksi) {
      await ubahTransaksi(transaksi.id, input)
    } else {
      await tambahTransaksi(input)
    }
    onClose()
  }

  async function hapus() {
    if (!transaksi) return
    await hapusTransaksi(transaksi.id)
    onClose(transaksi)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[430px] flex-col gap-3 bg-latar p-4 font-sans text-teks">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">
          {mengubah ? 'Ubah transaksi' : 'Tambah transaksi'}
        </h1>
        <button
          type="button"
          aria-label="Tutup"
          onClick={() => onClose()}
          className="h-11 w-11 text-2xl"
        >
          ×
        </button>
      </div>

      <div className="flex rounded-xl bg-track p-1">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={type === t}
            onClick={() => setType(t)}
            className={`min-h-10 flex-1 rounded-[9px] text-sm ${
              type === t ? 'bg-segmen-aktif font-bold' : 'text-teks-sekunder'
            }`}
          >
            {t === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
          </button>
        ))}
      </div>

      <div className="rounded-[20px] bg-card px-4 py-6 text-center shadow-sm">
        <label htmlFor="nominal" className="text-xs text-teks-sekunder">
          Nominal
        </label>
        <div className="mt-1 flex items-baseline justify-center gap-2">
          <span className="text-xl font-bold text-teks-sekunder">Rp</span>
          <input
            id="nominal"
            inputMode="numeric"
            autoFocus={!mengubah}
            placeholder="0"
            value={nominal ? formatRibuan(nominal) : ''}
            onChange={(e) => setNominal(hanyaAngka(e.target.value))}
            className="w-full max-w-[220px] bg-transparent text-center text-4xl font-bold outline-none placeholder:text-teks-sekunder"
          />
        </div>
      </div>

      <p className="mt-1 text-xs text-teks-sekunder">Kategori</p>
      <div className="grid grid-cols-3 gap-2">
        {kategoriUrut.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={categoryId === c.id}
            onClick={() => setCategoryId(c.id)}
            className={`min-h-16 rounded-[20px] border-2 p-2 text-sm ${
              categoryId === c.id
                ? 'border-aksen bg-aksen-tint font-bold'
                : 'border-transparent bg-card'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <p className="mt-1 text-xs text-teks-sekunder">Sumber dana</p>
      <div className="flex flex-wrap gap-2">
        {sources?.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={aktifSourceId === s.id}
            onClick={() => setSourceId(s.id)}
            className={`min-h-11 rounded-full px-4 text-sm ${
              aktifSourceId === s.id ? 'bg-aksen text-white' : 'bg-card'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      <label htmlFor="catatan" className="mt-1 text-xs text-teks-sekunder">
        Catatan (opsional)
      </label>
      <input
        id="catatan"
        type="text"
        placeholder="Contoh: es teh"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="h-12 rounded-xl bg-card px-4 text-sm outline-none focus:ring-2 focus:ring-aksen"
      />

      <div className="mt-auto flex flex-col items-center gap-3 pt-2">
        {mengubah && konfirmasiHapus ? (
          <div
            role="alert"
            className="flex w-full flex-col items-center gap-3 rounded-[20px] bg-peringatan-tint p-4"
          >
            <p className="text-center text-sm font-semibold text-peringatan-teks">
              Hapus transaksi ini? Kamu masih bisa mengurungkannya beberapa
              detik setelahnya.
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
              Ya, hapus
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              disabled={!bisaSimpan}
              onClick={simpan}
              className="min-h-12 w-full max-w-[240px] rounded-2xl bg-aksen text-sm font-bold text-white disabled:opacity-40"
            >
              {mengubah ? 'Simpan perubahan' : 'Simpan'}
            </button>
            {mengubah && (
              <button
                type="button"
                onClick={() => setKonfirmasiHapus(true)}
                className="min-h-12 w-full max-w-[240px] rounded-2xl bg-bahaya text-sm font-bold text-white"
              >
                Hapus transaksi
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}