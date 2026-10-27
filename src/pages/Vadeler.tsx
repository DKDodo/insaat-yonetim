import { CalendarClock, Check, Clock, Pencil, Plus, ScrollText, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { odemeSekliYazisi, VadeFormu, vadeBasligi } from '../components/formlar'
import { SilinenlerListesi } from '../components/SilinenlerListesi'
import { Baslik, Bos, Dugme, Kart, Ozet, Rozet, Sekmeler, cx, useBildirim } from '../components/ui'
import { db, type OdemeSekli, type Vade, type VadeYon } from '../db'
import { bugun, gunEkle, para, simdi, tarihGoster, vadeYazisi, yeniId } from '../lib/format'
import { toplam } from '../lib/hesap'
import { kaldir } from '../lib/esitleme'
import { adBul, sil, useCanli, type TumVeri } from '../lib/veri'

type Gorunum = 'bekleyen' | 'tamam' | 'silinen'

export default function Vadeler({ veri }: { veri: TumVeri }) {
  const bildir = useBildirim()
  const [gorunum, setGorunum] = useState<Gorunum>('bekleyen')
  const silinenSayisi = useCanli(() => db.silinenler.where('tablo').equals('vadeler').count()) ?? 0
  const [yon, setYon] = useState<VadeYon | 'hepsi' | 'cek'>('hepsi')
  const [pencere, setPencere] = useState<{ acik: boolean; kayit?: Vade; yon?: VadeYon; sekil?: OdemeSekli }>({ acik: false })
  const b = bugun()

  const bekleyen = veri.vadeler.filter((v) => v.durum === 'bekliyor')
  const liste = veri.vadeler
    .filter((v) => (gorunum === 'bekleyen' ? v.durum === 'bekliyor' : v.durum === 'tamam'))
    .filter((v) => yon === 'hepsi' || (yon === 'cek' ? v.odemeSekli === 'cek' : v.yon === yon))
  if (gorunum === 'tamam') liste.reverse()

  const gruplar: [string, Vade[]][] =
    gorunum === 'bekleyen'
      ? [
          ['Vadesi geçenler', liste.filter((v) => v.vade < b)],
          ['Bu hafta', liste.filter((v) => v.vade >= b && v.vade <= gunEkle(b, 7))],
          ['Bu ay ve sonrası', liste.filter((v) => v.vade > gunEkle(b, 7))],
        ]
      : [['Tamamlananlar', liste]]

  /* Vadeyi tamamlamak kasaya gerçek bir tahsilat / ödeme yazar. */
  const tamamla = async (v: Vade) => {
    const hId = yeniId()
    await db.transaction('rw', db.vadeler, db.hareketler, async () => {
      await db.vadeler.update(v.id, { durum: 'tamam', tamamTarihi: b })
      await db.hareketler.add({
        id: hId,
        tarih: b,
        tur: v.yon === 'tahsilat' ? 'gelir' : 'gider',
        kategori: v.yon === 'tahsilat' ? 'Tahsilat' : 'Ödeme',
        tutar: v.tutar,
        cariId: v.cariId,
        santiyeId: v.santiyeId,
        aciklama: v.aciklama,
        odemeSekli: v.odemeSekli,
        cek: v.cek,
        vadeId: v.id,
        olusturma: simdi(),
      })
    })
    bildir(v.yon === 'tahsilat' ? 'Tahsil edildi, kasaya işlendi (Tamamlanan sekmesinde)' : 'Ödendi, kasaya işlendi (Tamamlanan sekmesinde)', async () => {
      await db.transaction('rw', db.vadeler, db.hareketler, db.silmeler, async () => {
        await db.vadeler.update(v.id, { durum: 'bekliyor', tamamTarihi: undefined })
        await kaldir('hareketler', [hId])
      })
    })
  }

  /* "Edilmedi"ye dönüş: vade yeniden bekler, ona bağlı kasa kaydı kaldırılır. */
  const geriAc = async (v: Vade) => {
    await db.transaction('rw', db.vadeler, db.hareketler, db.silmeler, async () => {
      const bagli = await db.hareketler.where('vadeId').equals(v.id).primaryKeys()
      await db.vadeler.update(v.id, { durum: 'bekliyor', tamamTarihi: undefined })
      await kaldir('hareketler', bagli as string[])
    })
    bildir('Vade yeniden açıldı, kasa kaydı kaldırıldı')
  }

  return (
    <div>
      <Baslik
        baslik="Ödeme ve Tahsilat"
        alt="Yaklaşan ödemeleriniz ve tahsil edeceğiniz paralar. Tamamlayınca kasaya kendiliğinden işlenir."
        sag={
          <>
            <Dugme onClick={() => setPencere({ acik: true, yon: 'tahsilat', sekil: 'cek' })}>
              <ScrollText size={18} /> Çek
            </Dugme>
            <Dugme onClick={() => setPencere({ acik: true, yon: 'odeme' })}>
              <Plus size={18} /> Ödeme
            </Dugme>
            <Dugme tur="ana" onClick={() => setPencere({ acik: true, yon: 'tahsilat' })}>
              <Plus size={18} /> Tahsilat
            </Dugme>
          </>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Ozet etiket="Tahsil edilecek" deger={para(toplam(bekleyen.filter((v) => v.yon === 'tahsilat'), (v) => v.tutar))} ton="iyi" />
        <Ozet etiket="Ödenecek" deger={para(toplam(bekleyen.filter((v) => v.yon === 'odeme'), (v) => v.tutar))} ton="uyari" />
        <Ozet
          etiket="Vadesi geçen"
          deger={para(toplam(bekleyen.filter((v) => v.vade < b), (v) => v.tutar))}
          ton={bekleyen.some((v) => v.vade < b) ? 'kotu' : undefined}
          alt={`${bekleyen.filter((v) => v.vade < b).length} kayıt`}
        />
      </div>
      <div className="flex flex-wrap gap-x-3">
        <Sekmeler
          secili={gorunum}
          sec={setGorunum}
          secenekler={[
            ['bekleyen', 'Bekleyen', bekleyen.length],
            ['tamam', 'Tamamlanan', veri.vadeler.length - bekleyen.length],
            ['silinen', 'Silinenler', silinenSayisi],
          ]}
        />
        <Sekmeler
          secili={yon}
          sec={setYon}
          secenekler={[
            ['hepsi', 'Hepsi'],
            ['tahsilat', 'Tahsilat'],
            ['odeme', 'Ödeme'],
            ['cek', 'Çekler'],
          ]}
        />
      </div>

      {gorunum === 'silinen' ? (
        <SilinenlerListesi veri={veri} tablo="vadeler" />
      ) : liste.length ? (
        <div className="grid gap-5">
          {gruplar
            .filter(([, l]) => l.length)
            .map(([ad, l]) => (
              <section key={ad}>
                <h2 className={cx('mb-2 text-sm font-semibold', ad === 'Vadesi geçenler' ? 'text-red-600 dark:text-red-400' : 'text-stone-500')}>
                  {ad} · {para(toplam(l, (v) => v.tutar))}
                </h2>
                <Kart>
                  <div className="divide-y divide-stone-100 dark:divide-stone-800">
                    {l.map((v) => {
                      const gecti = v.durum === 'bekliyor' && v.vade < b
                      return (
                        <div key={v.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium text-stone-900 dark:text-stone-100">
                                {vadeBasligi(v, adBul(veri.cariler, v.cariId))}
                              </span>
                              <Rozet ton={v.yon === 'tahsilat' ? 'yesil' : 'sari'}>{v.yon === 'tahsilat' ? 'Tahsilat' : 'Ödeme'}</Rozet>
                              {v.odemeSekli === 'cek' && <Rozet ton="mavi">{v.yon === 'tahsilat' ? 'Alınan çek' : 'Verilen çek'}</Rozet>}
                            </div>
                            <div className={cx('text-[13px]', gecti ? 'text-red-600 dark:text-red-400' : 'text-stone-500')}>
                              {tarihGoster(v.vade)} · {v.durum === 'tamam' ? `Tamamlandı ${tarihGoster(v.tamamTarihi)}` : vadeYazisi(v.vade)}
                              {v.santiyeId && ` · ${adBul(veri.santiyeler, v.santiyeId)}`}
                              {v.odemeSekli && ` · ${odemeSekliYazisi(v.odemeSekli, v.cek)}`}
                              {v.cek?.kesideci && ` · Keşideci: ${v.cek.kesideci}`}
                              {v.aciklama && adBul(veri.cariler, v.cariId) && ` · ${v.aciklama}`}
                            </div>
                          </div>
                          <div className="text-right text-lg font-semibold tabular-nums">{para(v.tutar)}</div>
                          <div className="flex w-full gap-2 sm:w-auto">
                            <DurumAnahtari v={v} tamamla={() => tamamla(v)} geriAc={() => geriAc(v)} />
                            <Dugme kucuk tur="hayalet" aria-label="Düzenle" onClick={() => setPencere({ acik: true, kayit: v })}>
                              <Pencil size={15} />
                            </Dugme>
                            <Dugme kucuk tur="hayalet" aria-label="Sil" className="text-red-600" onClick={async () => bildir('Vade silindi', await sil('vadeler', v.id))}>
                              <Trash2 size={15} />
                            </Dugme>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Kart>
              </section>
            ))}
        </div>
      ) : (
        <Kart>
          <Bos simge={<CalendarClock size={40} />} baslik={gorunum === 'bekleyen' ? 'Bekleyen vade yok' : 'Tamamlanan vade yok'} aciklama="Çek, senet, fatura vadesi ya da sözlü anlaşmaları ekleyin; zamanı gelince panoda görünür." />
        </Kart>
      )}
      <VadeFormu acik={pencere.acik} kapat={() => setPencere({ acik: false })} kayit={pencere.kayit} veri={veri} varsayilanYon={pencere.yon} varsayilanSekil={pencere.sekil} />
    </div>
  )
}

/* İki seçenekli durum: Tahsil edilmedi / Tahsil edildi (ödemede Ödenmedi / Ödendi). Seçili olan belirgin. */
function DurumAnahtari({ v, tamamla, geriAc }: { v: Vade; tamamla: () => void; geriAc: () => void }) {
  const tamam = v.durum === 'tamam'
  const [hayir, evet] = v.yon === 'tahsilat' ? ['Edilmedi', 'Tahsil edildi'] : ['Ödenmedi', 'Ödendi']
  return (
    <div role="radiogroup" aria-label="Durum" className="flex flex-1 rounded-xl bg-stone-200/70 p-1 sm:flex-none dark:bg-stone-800">
      <button
        type="button"
        role="radio"
        aria-checked={!tamam}
        onClick={() => tamam && geriAc()}
        className={cx(
          'flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition sm:flex-none',
          !tamam ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-600 dark:text-white' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200',
        )}
      >
        <Clock size={14} /> {hayir}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={tamam}
        onClick={() => !tamam && tamamla()}
        className={cx(
          'flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition sm:flex-none',
          tamam ? 'bg-emerald-600 text-white shadow-sm' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200',
        )}
      >
        <Check size={14} /> {evet}
      </button>
    </div>
  )
}
