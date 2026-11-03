import { useState } from 'react'
import { formatRibuan, hanyaAngka } from '../utils/format'

type Props = {
  id: string
  label: string
  nilai: number
  onSimpan: (nilai: number) => void
  disabled?: boolean
  className?: string
}

// Kolom nominal: tampil berformat ribuan, disimpan saat fokus berpindah.
// Beri `key` yang berubah mengikuti `nilai` supaya isian ikut diperbarui.
export default function InputNominal({
  id,
  label,
  nilai,
  onSimpan,
  disabled,
  className,
}: Props) {
  const [draft, setDraft] = useState<number | null>(null)
  const tampil = draft ?? nilai

  return (
    <input
      id={id}
      aria-label={label}
      inputMode="numeric"
      placeholder="0"
      disabled={disabled}
      value={tampil ? formatRibuan(tampil) : ''}
      onChange={(e) => setDraft(hanyaAngka(e.target.value))}
      onBlur={() => {
        if (draft !== null && draft !== nilai) onSimpan(draft)
      }}
      className={className}
    />
  )
}