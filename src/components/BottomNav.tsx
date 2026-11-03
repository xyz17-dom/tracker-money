export type Tab = 'beranda' | 'riwayat' | 'anggaran' | 'pengaturan'

const MENU: { id: Tab; label: string }[] = [
  { id: 'beranda', label: 'Beranda' },
  { id: 'riwayat', label: 'Riwayat' },
  { id: 'anggaran', label: 'Anggaran' },
  { id: 'pengaturan', label: 'Pengaturan' },
]

type Props = {
  aktif: Tab
  onPilih: (tab: Tab) => void
}

export default function BottomNav({ aktif, onPilih }: Props) {
  return (
    <nav
      aria-label="Menu utama"
      className="fixed inset-x-0 bottom-0 z-10 mx-auto flex h-16 max-w-[430px] border-t border-track bg-card"
    >
      {MENU.map((m) => (
        <button
          key={m.id}
          type="button"
          aria-current={aktif === m.id ? 'page' : undefined}
          onClick={() => onPilih(m.id)}
          className={`flex-1 text-[13px] ${
            aktif === m.id ? 'font-bold text-aksen-teks' : 'text-teks-sekunder'
          }`}
        >
          {m.label}
        </button>
      ))}
    </nav>
  )
}