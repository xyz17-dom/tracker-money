import { db, type Transaction } from './db'
import { tanggalValid, todayString } from '../utils/format'

type InputTransaksi = Pick<
  Transaction,
  'type' | 'amount' | 'categoryId' | 'sourceId' | 'note' | 'date'
>

function cekNominal(amount: number) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Nominal harus bilangan bulat lebih dari 0')
  }
}

function cekTanggal(tanggal: string) {
  if (!tanggalValid(tanggal)) {
    throw new Error('Tanggal tidak valid')
  }
  if (tanggal > todayString()) {
    throw new Error('Tanggal tidak boleh di masa depan')
  }
}

export async function tambahTransaksi(input: InputTransaksi) {
  cekNominal(input.amount)
  cekTanggal(input.date)
  const sekarang = Date.now()
  return db.transactions.add({
    ...input,
    note: input.note.trim(),
    createdAt: sekarang,
    updatedAt: sekarang,
  })
}

export async function ubahTransaksi(id: number, input: InputTransaksi) {
  cekNominal(input.amount)
  cekTanggal(input.date)
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

// Mengembalikan transaksi yang baru dihapus, lengkap dengan id dan tanggalnya
export async function pulihkanTransaksi(transaksi: Transaction) {
  await db.transactions.put(transaksi)
}