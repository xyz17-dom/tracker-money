import { db, type Category } from './db'
import { KUNCI_FAVORIT } from './pengaturanRepo'
import { PALET_KATEGORI, validasiNamaKategori } from '../services/kategori'

const namaJenis = (kind: Category['kind']) =>
  kind === 'expense' ? 'pengeluaran' : 'pemasukan'

export async function tambahKategori(
  nama: string,
  kind: Category['kind'],
): Promise<number> {
  const semua = await db.categories.toArray()
  const hasil = validasiNamaKategori(nama, kind, semua)
  if (!hasil.ok) throw new Error(hasil.pesan)
  const jumlah = semua.filter((c) => c.kind === kind).length
  return db.categories.add({
    name: hasil.nama,
    color: PALET_KATEGORI[jumlah % PALET_KATEGORI.length],
    kind,
    isDefault: false,
  })
}

export async function ubahNamaKategori(id: number, nama: string) {
  const semua = await db.categories.toArray()
  const ada = semua.find((c) => c.id === id)
  if (!ada) throw new Error('Kategori tidak ditemukan.')
  const hasil = validasiNamaKategori(nama, ada.kind, semua, id)
  if (!hasil.ok) throw new Error(hasil.pesan)
  await db.categories.update(id, { name: hasil.nama })
}

// Menghapus kategori. Jika masih dipakai transaksi, transaksi itu harus
// dipindahkan ke kategori pengganti yang sejenis. Batas anggaran kategori
// ini ikut dihapus, dan kategori favorit dibersihkan.
export async function hapusKategori(id: number, penggantiId?: number) {
  await db.transaction(
    'rw',
    db.categories,
    db.transactions,
    db.budgetCategories,
    db.settings,
    async () => {
      const kategori = await db.categories.get(id)
      if (!kategori) throw new Error('Kategori tidak ditemukan.')

      const sejenis = await db.categories
        .filter((c) => c.kind === kategori.kind)
        .toArray()
      if (sejenis.length <= 1) {
        throw new Error(
          `Minimal harus ada satu kategori ${namaJenis(kategori.kind)}.`,
        )
      }

      const dipakai = await db.transactions
        .where('categoryId')
        .equals(id)
        .count()
      if (dipakai > 0) {
        const pengganti = sejenis.find(
          (c) => c.id === penggantiId && c.id !== id,
        )
        if (!pengganti) {
          throw new Error(
            'Pilih kategori pengganti untuk transaksi yang memakai kategori ini.',
          )
        }
        await db.transactions
          .where('categoryId')
          .equals(id)
          .modify({ categoryId: pengganti.id, updatedAt: Date.now() })
      }

      await db.budgetCategories.where('categoryId').equals(id).delete()

      const favorit = await db.settings.get(KUNCI_FAVORIT)
      if (favorit) {
        try {
          const x: unknown = JSON.parse(favorit.value)
          if (Array.isArray(x)) {
            await db.settings.put({
              key: KUNCI_FAVORIT,
              value: JSON.stringify(x.filter((n) => n !== id)),
            })
          }
        } catch {
          // data favorit rusak: dibiarkan, bacaFavorit menganggapnya kosong
        }
      }

      await db.categories.delete(id)
    },
  )
}