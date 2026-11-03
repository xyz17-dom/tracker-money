export default function Segera({ judul }: { judul: string }) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <h1 className="text-[22px] font-bold">{judul}</h1>
      <div className="rounded-[20px] bg-card p-6 text-center shadow-sm">
        <p className="font-semibold">Segera hadir</p>
        <p className="mt-1 text-sm text-teks-sekunder">
          Layar ini akan dibuat pada langkah berikutnya.
        </p>
      </div>
    </div>
  )
}