import { useState } from 'react'
import BottomNav, { type Tab } from './components/BottomNav'
import type { Transaction } from './db/db'
import Riwayat from './pages/Riwayat'
import TambahTransaksi from './pages/TambahTransaksi'
import Anggaran from './pages/Anggaran'
import Beranda from './pages/Beranda'
import Pengaturan from './pages/Pengaturan'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db/db'
import { KUNCI_ONBOARDING } from './db/pengaturanRepo'
import Onboarding from './pages/Onboarding'

export default function App() {
  // Sementara dimulai dari Riwayat karena Beranda belum dibuat
  const [tab, setTab] = useState<Tab>('beranda')
  const [tambahTerbuka, setTambahTerbuka] = useState(false)
  const [diedit, setDiedit] = useState<Transaction | null>(null)

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
  
  if (onboardingSelesai === undefined) return null
  if (!onboardingSelesai) return <Onboarding />

  if (tambahTerbuka) {
    return <TambahTransaksi onClose={() => setTambahTerbuka(false)} />
  }

  if (diedit) {
    return (
      <TambahTransaksi
        key={diedit.id}
        transaksi={diedit}
        onClose={() => setDiedit(null)}
      />
    )
  }

  const bisaTambah = tab === 'beranda' || tab === 'riwayat'

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-latar pb-24 font-sans text-teks">
      {tab === 'beranda' && <Beranda onBukaAnggaran={() => setTab('anggaran')} />}
      {tab === 'riwayat' && <Riwayat onPilih={setDiedit} />}
      {tab === 'anggaran' && <Anggaran />}
      {tab === 'pengaturan' && (
        <Pengaturan onBukaAnggaran={() => setTab('anggaran')} />
        )}

      {bisaTambah && (
        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-10 mx-auto flex max-w-[430px] justify-end pr-5">
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