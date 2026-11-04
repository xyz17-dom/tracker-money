// Menyimpan Blob sebagai file yang diunduh pengguna
export function unduhBlob(namaFile: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = namaFile
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Ditunda sedikit agar peramban (terutama Safari) sempat memulai unduhan
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}