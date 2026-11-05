import 'fake-indexeddb/auto'
import { format, addDays } from 'date-fns'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, seedIfEmpty } from './db'
import { tambahTransaksi, ubahTransaksi } from './transaksiRepo'
import { todayString } from '../utils/format'

beforeEach(async () => {
  await db.delete()
  await db.open()
  await seedIfEmpty()
})

const dasar = { type: 'expense' as const, amount: 8000, categoryId: 1, sourceId: 1, note: ' Es teh ' }

describe('transaksi dengan tanggal', () => {
  it('menyimpan tanggal yang dipilih dan merapikan catatan', async () => {
    const id = await tambahTransaksi({ ...dasar, date: '2026-10-30' })
    const t = await db.transactions.get(id)
    expect(t).toMatchObject({ date: '2026-10-30', note: 'Es teh', amount: 8000 })
  })

  it('menolak tanggal di masa depan', async () => {
    const besok = format(addDays(new Date(), 1), 'yyyy-MM-dd')
    await expect(tambahTransaksi({ ...dasar, date: besok })).rejects.toThrow('masa depan')
    expect(await db.transactions.count()).toBe(0)
  })

  it('menerima hari ini dan menolak tanggal yang tidak valid', async () => {
    await expect(tambahTransaksi({ ...dasar, date: todayString() })).resolves.toBeTypeOf('number')
    await expect(tambahTransaksi({ ...dasar, date: '2026-02-30' })).rejects.toThrow('tidak valid')
  })

  it('mengubah tanggal transaksi yang sudah ada', async () => {
    const id = await tambahTransaksi({ ...dasar, date: todayString() })
    await ubahTransaksi(id, { ...dasar, date: '2026-10-01' })
    expect((await db.transactions.get(id))?.date).toBe('2026-10-01')
  })
})