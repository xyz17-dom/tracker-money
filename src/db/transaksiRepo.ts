import { db, type Transaction } from './db'
import { todayString } from '../utils/format'

type InputTransaksi = Pick<
  Transaction,
  'type' | 'amount' | 'categoryId' | 'sourceId' | 'note'
>

function cekNominal(amount: number) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Nominal harus bilangan bulat lebih dari 0')
  }
}

export async function tambahTransaksi(input: InputTransaksi) {
  cekNominal(input.amount)
  const sekarang = Date.now()
  return db.transactions.add({
    ...input,
    note: input.note.trim(),
    date: todayString(),
    createdAt: sekarang,
    updatedAt: sekarang,
  })
}

export async function ubahTransaksi(id: number, input: InputTransaksi) {
  cekNominal(input.amount)
  const ada = await db.transactions.get(id)
  if (!ada) throw new Error('Transaksi tidak ditemukan')
  await db.transactions.update(id, {
    ...input,
    note: input.note.trim(),
    updatedAt: Date.now(),
  })
}

export async function hapusTransaksi(id: number) {
  await db.transactions.delete(id)
}