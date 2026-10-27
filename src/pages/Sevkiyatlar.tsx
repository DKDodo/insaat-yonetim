import { Download, Pencil, Plus, Search, Trash2, Truck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SantiyeSecimi } from '../components/formlar'
import { Baslik, Bos, Dugme, Etiket, Girdi, Kart, useBildirim } from '../components/ui'
import { para, sayi, tarihGoster } from '../lib/format'
import { malzemeTutari, sevkiyatToplami, toplam } from '../lib/hesap'
import { adBul, csvIndir, sil, type TumVeri } from '../lib/veri'

export default function Sevkiyatlar({ veri }: { veri: TumVeri }) {
  const git = useNavigate()
  const bildir = useBildirim()
  const [santiyeId, setSantiyeId] = useState('')
  const [bas, setBas] = useState('')
  const [son, setSon] = useState('')
  const [ara, setAra] = useState('')

  const liste = useMemo(() => {
    const a = ara.trim().toLocaleLowerCase('tr-TR')
    return veri.sevkiyatlar.filter(
      (s) =>
        (!santiyeId || s.santiyeId === santiyeId) &&
        (!bas || s.tarih >= bas) &&
        (!son || s.tarih <= son) &&
        (!a ||
          s.kalemler.some((k) => k.ad.toLocaleLowerCase('tr-TR').includes(a)) ||
          (s.irsaliyeNo ?? '').toLocaleLowerCase('tr-TR').includes(a) ||
          adBul(veri.santiyeler, s.santiyeId).toLocaleLowerCase('tr-TR').includes(a)),
    )
  }, [veri, santiyeId, bas, son, ara])

  const disaAktar = () => {
    const satirlar: (string | number)[][] = []
    for (const s of liste)
      for (const k of s.kalemler)
        satirlar.push([tarihGoster(s.tarih), adBul(veri.santiyeler, s.santiyeId), adBul(veri.cariler, s.tedarikciId), s.irsaliyeNo ?? '', k.ad, k.miktar, k.birim, k.birimFiyat, Math.round(k.miktar * k.birimFiyat * 100) / 100])
    csvIndir('giden-malzemeler.csv', ['Tarih', 'Şantiye', 'Tedarikçi', 'İrsaliye', 'Malzeme', 'Miktar', 'Birim', 'Birim fiyat', 'Tutar'], satirlar)
  }

  return (
    <div>
      <Baslik
        baslik="Giden Malzemeler"
        alt={`${liste.length} sevkiyat · ${para(toplam(liste, sevkiyatToplami))}`}
        sag={
          <>
            <Dugme onClick={disaAktar} disabled={!liste.length}>
              <Download size={17} /> Excel
            </Dugme>
            <Dugme tur="ana" onClick={() => git('/gonder')}>
              <Plus size={18} /> Gönder
            </Dugme>
          </>
        }
      />
      <Kart className="mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Etiket etiket="Ara">
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-stone-400" />
            <Girdi value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Malzeme, şantiye, irsaliye" className="pl-9" />
          </div>
        </Etiket>
        <Etiket etiket="Şantiye">
          <SantiyeSecimi veri={veri} deger={santiyeId} degistir={setSantiyeId} bosEtiket="Tümü" />
        </Etiket>
        <Etiket etiket="Başlangıç">
          <Girdi type="date" value={bas} onChange={(e) => setBas(e.target.value)} />
        </Etiket>
        <Etiket etiket="Bitiş">
          <Girdi type="date" value={son} onChange={(e) => setSon(e.target.value)} />
        </Etiket>
      </Kart>

      {liste.length ? (
        <div className="grid gap-3">
          {liste.map((s) => (
            <Kart key={s.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <button type="button" onClick={() => git(`/santiyeler/${s.santiyeId}`)} className="font-semibold text-stone-900 hover:underline dark:text-white">
                    {adBul(veri.santiyeler, s.santiyeId) || 'Şantiye silinmiş'}
                  </button>
                  <div className="text-[13px] text-stone-500">
                    {tarihGoster(s.tarih)}
                    {s.irsaliyeNo && ` · İrsaliye ${s.irsaliyeNo}`}
                    {s.tedarikciId && ` · ${adBul(veri.cariler, s.tedarikciId)}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold tabular-nums">{para(sevkiyatToplami(s))}</div>
                </div>
              </div>
              <ul className="mt-3 grid gap-1 text-sm">
                {s.kalemler.map((k, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="min-w-0 truncate">
                      {k.ad} <span className="text-stone-500">· {sayi(k.miktar)} {k.birim} × {para(k.birimFiyat)}</span>
                    </span>
                    <span className="shrink-0 tabular-nums">{para(k.miktar * k.birimFiyat)}</span>
                  </li>
                ))}
                {(s.nakliye > 0 || s.hizmet > 0) && (
                  <li className="flex justify-between gap-3 text-stone-500">
                    <span>Malzeme {para(malzemeTutari(s))}{s.nakliye > 0 && ` · Nakliye ${para(s.nakliye)}`}{s.hizmet > 0 && ` · Hizmet ${para(s.hizmet)}`}</span>
                  </li>
                )}
              </ul>
              {s.not && <p className="mt-2 text-sm text-stone-500">{s.not}</p>}
              <div className="mt-3 flex gap-2">
                <Dugme kucuk onClick={() => git(`/gonder/${s.id}`)}>
                  <Pencil size={15} /> Düzenle
                </Dugme>
                <Dugme
                  kucuk
                  tur="hayalet"
                  className="text-red-600"
                  onClick={async () => {
                    const geri = await sil('sevkiyatlar', s.id)
                    bildir('Sevkiyat silindi', geri)
                  }}
                >
                  <Trash2 size={15} /> Sil
                </Dugme>
              </div>
            </Kart>
          ))}
        </div>
      ) : (
        <Kart>
          <Bos simge={<Truck size={40} />} baslik="Sevkiyat bulunamadı" aciklama="Süzgeci değiştirin ya da yeni malzeme gönderin." />
        </Kart>
      )}
    </div>
  )
}
