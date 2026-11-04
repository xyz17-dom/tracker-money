import type { Cell, SheetData } from 'write-excel-file/universal'
import type { Laporan } from './laporan'

export type Lembar = {
  sheet: string
  data: SheetData
  columns: { width: number }[]
  stickyRowsCount?: number
}

const FORMAT_ANGKA = '#,##0'
const FORMAT_TANGGAL = 'dd/mm/yyyy'

const judul = (value: string): Cell => ({ value, fontWeight: 'bold' })

const kepala = (value: string): Cell => ({
  value,
  fontWeight: 'bold',
  backgroundColor: '#ECECFC',
})

const angka = (value: number): Cell => ({
  value,
  type: Number,
  format: FORMAT_ANGKA,
})

const angkaTebal = (value: number): Cell => ({
  value,
  type: Number,
  format: FORMAT_ANGKA,
  fontWeight: 'bold',
})

// 'YYYY-MM-DD' -> tanggal Excel. Dipakai UTC supaya hari tidak bergeser
// oleh zona waktu perangkat.
function tanggalExcel(teks: string): Date {
  return new Date(
    Date.UTC(
      Number(teks.slice(0, 4)),
      Number(teks.slice(5, 7)) - 1,
      Number(teks.slice(8, 10)),
    ),
  )
}

export function susunLembar(laporan: Laporan): Lembar[] {
  // ---------- Lembar 1: Transaksi ----------
  const transaksi: SheetData = [
    [
      kepala('Tanggal'),
      kepala('Jenis'),
      kepala('Kategori'),
      kepala('Sumber dana'),
      kepala('Catatan'),
      kepala('Nominal (Rp)'),
    ],
    ...laporan.transaksi.map((t): Cell[] => [
      { value: tanggalExcel(t.tanggal), type: Date, format: FORMAT_TANGGAL },
      t.jenis,
      t.kategori,
      t.sumber,
      t.catatan,
      angka(t.nominal),
    ]),
  ]

  // ---------- Lembar 2: Ringkasan ----------
  const ringkasan: SheetData = [
    [judul('Ringkasan per bulan')],
    [kepala('Bulan'), kepala('Pemasukan'), kepala('Pengeluaran'), kepala('Selisih')],
    ...laporan.perBulan.map((b): Cell[] => [
      b.bulan,
      angka(b.pemasukan),
      angka(b.pengeluaran),
      angka(b.selisih),
    ]),
    [],
    [judul('Pengeluaran per kategori')],
    [kepala('Kategori'), kepala('Jumlah transaksi'), kepala('Total (Rp)')],
    ...laporan.perKategori.map((k): Cell[] => [
      k.kategori,
      { value: k.jumlah, type: Number },
      angka(k.total),
    ]),
  ]

  // ---------- Lembar 3: Anggaran ----------
  const a = laporan.anggaran
  const anggaran: SheetData = a.diatur
    ? [
        [judul('Periode'), a.periode],
        [judul('Rentang'), a.rentang],
        [judul('Total anggaran'), angka(a.total)],
        [],
        [kepala('Kategori'), kepala('Batas'), kepala('Terpakai'), kepala('Sisa')],
        ...a.baris.map((b): Cell[] => [
          b.kategori,
          angka(b.batas),
          angka(b.terpakai),
          angka(b.sisa),
        ]),
        [
          judul('Total semua kategori'),
          angkaTebal(a.total),
          angkaTebal(a.terpakai),
          angkaTebal(a.sisa),
        ],
      ]
    : [[judul('Anggaran belum diatur.')]]

  return [
    {
      sheet: 'Transaksi',
      data: transaksi,
      columns: [
        { width: 12 },
        { width: 14 },
        { width: 16 },
        { width: 16 },
        { width: 30 },
        { width: 16 },
      ],
      stickyRowsCount: 1,
    },
    {
      sheet: 'Ringkasan',
      data: ringkasan,
      columns: [{ width: 24 }, { width: 18 }, { width: 18 }, { width: 18 }],
    },
    {
      sheet: 'Anggaran',
      data: anggaran,
      columns: [{ width: 22 }, { width: 18 }, { width: 18 }, { width: 18 }],
    },
  ]
}