import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import BottomNav, { type Tab } from './components/BottomNav'
import { db, type Transaction } from './db/db'
import { KUNCI_ONBOARDING } from './db/pengaturanRepo'
import { pulihkanTransaksi } from './db/transaksiRepo'
import Anggaran from './pages/Anggaran'
import Beranda from './pages/Beranda'
import Kategori from './pages/Kategori'
import Onboarding from './pages/Onboarding'
import Pengaturan from './pages/Pengaturan'
import Riwayat from './pages/Riwayat'
import TambahTransaksi from './pages/TambahTransaksi'

export default function App() {
  const [tab, setTab] = useState<Tab>('beranda')
  const [tambahTerbuka, setTambahTerbuka] = useState(false)
  const [diedit, setDiedit] = useState<Transaction | null>(null)
  const [kategoriTerbuka, setKategoriTerbuka] = useState(false)
  // Transaksi yang baru dihapus, disimpan sebentar agar bisa diurungkan
  const [terhapus, setTerhapus] = useState<Transaction | null>(null)

  // Pesan "Transaksi dihapus" hilang sendiri setelah 6 detik
  useEffect(() => {
    if (!terhapus) return
    const timer = setTimeout(() => setTerhapus(null), 6000)
    return () => clearTimeout(timer)
  }, [terhapus])

  // Onboarding dianggap selesai jika sudah ditandai, atau jika sudah ada data
  // (pengguna lama tidak perlu diminta mengisi ulang)
  const onboardingSelesai = useLiveQuery(async () => {
    const s = await db.settings.get(KUNCI_ONBOARDING)
    if (s?.value === 'ya') return true
    const [anggaran, transaksi] = await Promise.all([
      db.budgets.count(),
      db.transactions.count(),
    ])
    return anggaran > 0 || transaksi > 0
  })

  // Setelah semua data dihapus, onboarding muncul lagi; setelahnya mulai dari Beranda
  useEffect(() => {
    if (onboardingSelesai === false) setTab('beranda')
  }, [onboardingSelesai])

  if (onboardingSelesai === undefined) return null
  if (!onboardingSelesai) return <Onboarding />

  // Layar penuh naik dari bawah
  if (kategoriTerbuka) {
    return (
      <div className="animasi-naik">
        <Kategori onClose={() => setKategoriTerbuka(false)} />
      </div>
    )
  }

  if (tambahTerbuka) {
    return (
      <div className="animasi-naik">
        <TambahTransaksi onClose={() => setTambahTerbuka(false)} />
      </div>
    )
  }

  if (diedit) {
    return (
      <div className="animasi-naik">
        <TambahTransaksi
          key={diedit.id}
          transaksi={diedit}
          onClose={(dihapus) => {
            setDiedit(null)
            if (dihapus) setTerhapus(dihapus)
          }}
        />
      </div>
    )
  }

  async function urungkan() {
    if (!terhapus) return
    await pulihkanTransaksi(terhapus)
    setTerhapus(null)
  }

  const bisaTambah = tab === 'beranda' || tab === 'riwayat'

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-latar pb-24 font-sans text-teks">
      {/* key={tab}: tiap pindah tab, isinya masuk dengan gerak halus */}
      <div key={tab} className="animasi-halaman">
        {tab === 'beranda' && (
          <Beranda onBukaAnggaran={() => setTab('anggaran')} />
        )}
        {tab === 'riwayat' && <Riwayat onPilih={setDiedit} />}
        {tab === 'anggaran' && <Anggaran />}
        {tab === 'pengaturan' && (
          <Pengaturan
            onBukaAnggaran={() => setTab('anggaran')}
            onBukaKategori={() => setKategoriTerbuka(true)}
          />
        )}
      </div>

      {terhapus && (
        <div
          role="status"
          className="animasi-toast fixed inset-x-0 bottom-[calc(9rem+env(safe-area-inset-bottom))] z-20 mx-auto flex max-w-[430px] justify-center px-4"
        >
          <div className="flex items-center gap-3 rounded-2xl bg-teks py-2 pl-4 pr-2 text-sm text-latar shadow-lg">
            <span>Transaksi dihapus</span>
            <button
              type="button"
              onClick={urungkan}
              className="min-h-11 rounded-xl px-3 font-bold underline"
            >
              Urungkan
            </button>
          </div>
        </div>
      )}

      {bisaTambah && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 mx-auto flex max-w-[430px] justify-end pr-5">
          <button
            type="button"
            aria-label="Tambah transaksi"
            onClick={() => setTambahTerbuka(true)}
            className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-aksen text-white shadow-lg"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      )}

      <BottomNav aktif={tab} onPilih={setTab} />
    </div>
  )
}