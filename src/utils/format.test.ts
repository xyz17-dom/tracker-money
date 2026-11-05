import { format, subDays } from 'date-fns'
import { describe, expect, it } from 'vitest'
import { kemarinString, tanggalValid, todayString } from './format'

describe('tanggalValid', () => {
  it('menerima tanggal yang ada di kalender', () => {
    expect(tanggalValid('2026-11-05')).toBe(true)
    expect(tanggalValid('2028-02-29')).toBe(true) // tahun kabisat
  })

  it('menolak tanggal yang tidak ada atau salah bentuk', () => {
    expect(tanggalValid('2026-02-30')).toBe(false)
    expect(tanggalValid('2027-02-29')).toBe(false)
    expect(tanggalValid('2026-13-01')).toBe(false)
    expect(tanggalValid('05/11/2026')).toBe(false)
    expect(tanggalValid('')).toBe(false)
  })
})

describe('kemarinString', () => {
  it('satu hari sebelum hari ini', () => {
    expect(kemarinString()).toBe(format(subDays(new Date(), 1), 'yyyy-MM-dd'))
    expect(kemarinString() < todayString()).toBe(true)
  })
})