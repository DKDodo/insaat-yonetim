import { RotateCcw, Trash2 } from 'lucide-react'
import { db, CARI_TURLERI, type Avans, type Cari, type Hareket, type Isci, type Malzeme, type Santiye, type Sevkiyat, type Silinen, type TabloAdi, type Vade } from '../db'
import { para, tarihGoster } from '../lib/format'
import { sevkiyatToplami } from '../lib/hesap'
import { degisiklikOldu } from '../lib/otoyedek'
import { adBul, geriYukle, kaliciSil, useCanli, type TumVeri } from '../lib/veri'
import { Bos, Dugme, Kart, Rozet, useBildirim } from './ui'

export const TABLO_ADLARI: Record<TabloAdi, string> = {
  cariler: 'Cari',
  santiyeler: 'Şantiye',
  malzemeler: 'Malzeme',
  sevkiyatlar: 'Sevkiyat',
  hareketler: 'Gelir / gider',
  vadeler: 'Ödeme / tahsilat',
  isciler: 'İşçi',
  avanslar: 'Avans',
}

/* Silinen kaydın tek satırlık özeti: ne olduğu anlaşılsın diye. */
function ozet(s: Silinen, veri: TumVeri): { baslik: string; alt: string; tutar?: number } {
  const k = s.kayit as Record<string, unknown>
  switch (s.tablo) {
    case 'vadeler': {
      const v = k as unknown as Vade
      return {
        baslik: `${v.yon === 'tahsilat' ? 'Tahsilat' : 'Ödeme'} · ${adBul(veri.cariler, v.cariId) || v.aciklama || 'Cari yok'}`,
        alt: `Vade ${tarihGoster(v.vade)}${v.durum === 'tamam' ? ' · tamamlanmıştı' : ''}${v.aciklama && v.cariId ? ' · ' + v.aciklama : ''}`,
        tutar: v.tutar,
      }
    }
    case 'hareketler': {
      const h = k as unknown as Hareket
      return { baslik: `${h.tur === 'gelir' ? 'Gelir' : 'Gider'} · ${h.aciklama || h.kategori}`, alt: `${tarihGoster(h.tarih)} · ${h.kategori}${h.cariId ? ' · ' + adBul(veri.cariler, h.cariId) : ''}`, tutar: h.tutar }
    }
    case 'sevkiyatlar': {
      const x = k as unknown as Sevkiyat
      return { baslik: `Sevkiyat · ${adBul(veri.santiyeler, x.santiyeId) || 'şantiye yok'}`, alt: `${tarihGoster(x.tarih)} · ${x.kalemler.map((m) => m.ad).join(', ')}`, tutar: sevkiyatToplami(x) }
    }
    case 'avanslar': {
      const a = k as unknown as Avans
      return { baslik: `Avans · ${adBul(veri.isciler, a.isciId) || 'işçi yok'}`, alt: tarihGoster(a.tarih), tutar: a.tutar }
    }
    case 'cariler': {
      const c = k as unknown as Cari
      return { baslik: c.ad, alt: CARI_TURLERI[c.tur] }
    }
    case 'santiyeler': {
      const x = k as unknown as Santiye
      return { baslik: x.ad, alt: adBul(veri.cariler, x.firmaId) || 'Şantiye' }
    }
    case 'malzemeler': {
      const m = k as unknown as Malzeme
      return { baslik: m.ad, alt: `${para(m.fiyat)} / ${m.birim}` }
    }
    case 'isciler': {
      const i = k as unknown as Isci
      return { baslik: i.ad, alt: i.gorev || 'İşçi' }
    }
  }
}

export function SilinenlerListesi({ veri, tablo }: { veri: TumVeri; tablo?: TabloAdi }) {
  const bildir = useBildirim()
  const liste = useCanli(async () => {
    const l = tablo ? await db.silinenler.where('tablo').equals(tablo).toArray() : await db.silinenler.toArray()
    return l.sort((a, b) => b.silinme.localeCompare(a.silinme))
  }, [tablo])

  if (!liste) return null
  if (!liste.length)
    return (
      <Kart>
        <Bos simge={<Trash2 size={40} />} baslik="Silinen kayıt yok" aciklama="Sildiğiniz kayıtlar buraya düşer; istediğiniz zaman geri alabilirsiniz." />
      </Kart>
    )

  return (
    <div>
      <p className="mb-3 text-sm text-stone-500">
        Silinen kayıtlar kalıcı olarak silinmez; burada bekler ve yedeklere de girer. Geri aldığınızda eski yerine döner.
      </p>
      <Kart>
        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {liste.map((s) => {
            const o = ozet(s, veri)
            return (
              <div key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!tablo && <Rozet>{TABLO_ADLARI[s.tablo]}</Rozet>}
                    <span className="truncate font-medium text-stone-900 dark:text-stone-100">{o.baslik}</span>
                  </div>
                  <div className="truncate text-[13px] text-stone-500">
                    {o.alt} · silindi {new Date(s.silinme).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {o.tutar !== undefined && <div className="font-semibold tabular-nums">{para(o.tutar)}</div>}
                <div className="flex gap-2">
                  <Dugme
                    kucuk
                    tur="ana"
                    onClick={async () => {
                      await geriYukle(s.id)
                      bildir('Geri alındı, eski yerine döndü')
                    }}
                  >
                    <RotateCcw size={15} /> Geri al
                  </Dugme>
                  <Dugme
                    kucuk
                    tur="hayalet"
                    aria-label="Kalıcı sil"
                    title="Kalıcı sil"
                    className="text-red-600"
                    onClick={async () => {
                      if (!confirm('Bu kayıt kalıcı olarak silinecek ve geri alınamayacak. Emin misiniz?')) return
                      await kaliciSil([s.id])
                      degisiklikOldu()
                      bildir('Kalıcı olarak silindi')
                    }}
                  >
                    <Trash2 size={15} />
                  </Dugme>
                </div>
              </div>
            )
          })}
        </div>
      </Kart>
    </div>
  )
}
