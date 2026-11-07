import type { HariBatang } from '../services/anggaran'
import { formatRupiah } from '../utils/format'

export default function BatangHarian({ data }: { data: HariBatang[] }) {
  const maks = Math.max(0, ...data.map((d) => d.jumlah))
  const ringkasan = data
    .map((d) => `${d.tanggal} ${formatRupiah(d.jumlah)}`)
    .join(', ')

  return (
    <div role="img" aria-label={`Pengeluaran 7 hari terakhir: ${ringkasan}`}>
      <div className="flex h-[72px] items-end justify-between px-2">
        {data.map((d, i) => (
          <div
            key={d.tanggal}
            className={`animasi-batang w-6 rounded-md ${
              i === data.length - 1 ? 'bg-aksen' : 'bg-batang'
            }`}
            style={{
              height: maks > 0 ? `${Math.max(6, (d.jumlah / maks) * 100)}%` : '6%',
              animationDelay: `${i * 60}ms`,
            }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between px-2 text-xs text-teks-sekunder">
        {data.map((d, i) => (
          <span
            key={d.tanggal}
            className={`w-6 text-center ${
              i === data.length - 1 ? 'font-bold text-aksen-teks' : ''
            }`}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}