import { formatRupiah } from '../utils/format'

// Tiga kategori terbesar diberi warna sendiri, sisanya digabung
const WARNA = ['var(--aksen)', 'var(--grafik-2)', 'var(--grafik-3)']
const WARNA_LAIN = 'var(--batang)'

const R = 40
const KELILING = 2 * Math.PI * R

type Props = {
  perKategori: Map<number, number>
  namaKategori: Map<number, string>
}

export default function DonutKategori({ perKategori, namaKategori }: Props) {
  const urut = [...perKategori].sort((a, b) => b[1] - a[1])

  const irisan = urut.slice(0, 3).map(([idKategori, nilai], i) => ({
    nama: namaKategori.get(idKategori) ?? 'Kategori',
    nilai,
    warna: WARNA[i],
  }))
  const sisa = urut.slice(3).reduce((jumlah, [, nilai]) => jumlah + nilai, 0)
  if (sisa > 0) irisan.push({ nama: 'Kategori lain', nilai: sisa, warna: WARNA_LAIN })

  const total = irisan.reduce((jumlah, s) => jumlah + s.nilai, 0)

  if (total === 0) {
    return (
      <p className="py-4 text-center text-sm text-teks-sekunder">
        Belum ada pengeluaran pada periode ini.
      </p>
    )
  }

  const ringkasan = irisan
    .map((s) => `${s.nama} ${formatRupiah(s.nilai)}`)
    .join(', ')

  return (
    <div className="flex items-center gap-5">
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label={`Pengeluaran per kategori: ${ringkasan}`}
        className="h-24 w-24 flex-none"
      >
        <circle cx="50" cy="50" r={R} fill="none" stroke="var(--track)" strokeWidth="14" />
        {irisan.map((s, i) => {
          const panjang = (s.nilai / total) * KELILING
          const geser = irisan
            .slice(0, i)
            .reduce((jumlah, x) => jumlah + (x.nilai / total) * KELILING, 0)
          return (
            <circle
              key={s.nama}
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={s.warna}
              strokeWidth="14"
              strokeDasharray={`${panjang} ${KELILING - panjang}`}
              strokeDashoffset={-geser}
              transform="rotate(-90 50 50)"
            />
          )
        })}
      </svg>

      <ul className="flex-1 space-y-1.5 text-[13px]">
        {irisan.map((s) => (
          <li key={s.nama} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 flex-none rounded-full"
              style={{ backgroundColor: s.warna }}
            />
            <span className="flex-1 truncate">{s.nama}</span>
            <span className="text-teks-sekunder">
              {Math.round((s.nilai / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}