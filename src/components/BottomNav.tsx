import { History, House, Settings, Wallet, type LucideIcon } from 'lucide-react'

export type Tab = 'beranda' | 'riwayat' | 'anggaran' | 'pengaturan'

const MENU: { id: Tab; label: string; Ikon: LucideIcon }[] = [
  { id: 'beranda', label: 'Beranda', Ikon: House },
  { id: 'riwayat', label: 'Riwayat', Ikon: History },
  { id: 'anggaran', label: 'Anggaran', Ikon: Wallet },
  { id: 'pengaturan', label: 'Pengaturan', Ikon: Settings },
]

type Props = {
  aktif: Tab
  onPilih: (tab: Tab) => void
}

export default function BottomNav({ aktif, onPilih }: Props) {
  return (
    <nav
      aria-label="Menu utama"
      className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-[430px] border-t border-track bg-card pb-[env(safe-area-inset-bottom)]"
    >
      {MENU.map(({ id, label, Ikon }) => {
        const dipilih = aktif === id
        return (
          <button
            key={id}
            type="button"
            aria-current={dipilih ? 'page' : undefined}
            onClick={() => onPilih(id)}
            className={`flex h-16 flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors duration-200 ${
              dipilih ? 'font-bold text-aksen-teks' : 'text-teks-sekunder'
            }`}
          >
            <span
              className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-200 ${
                dipilih ? 'bg-aksen-tint' : ''
              }`}
            >
              <Ikon
                size={22}
                strokeWidth={dipilih ? 2.25 : 1.75}
                className={`transition-transform duration-200 ${
                  dipilih ? 'scale-110' : ''
                }`}
              />
            </span>
            {label}
          </button>
        )
      })}
    </nav>
  )
}