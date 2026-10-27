import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Building2, CalendarClock, Plus, Truck, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { vadeBasligi } from '../components/formlar'
import { Baslik, Bos, Dugme, Kart, Liste, Ozet, Rozet, Satir, useBildirim } from '../components/ui'
import { ayBasi, aySonu, bugun, gunEkle, gunFarki, para, tarihGoster, vadeYazisi } from '../lib/format'
import { santiyeOzeti, sevkiyatToplami, toplam } from '../lib/hesap'
import { ornekKayitlariBul, ornekVerileriKaldir } from '../lib/ornek'
import { sonElleYedek, useYedekDurumu } from '../lib/otoyedek'
import { adBul, useCanli, type TumVeri } from '../lib/veri'

export default function Pano({ veri }: { veri: TumVeri }) {
  const git = useNavigate()
  const b = bugun()
  const ay1 = ayBasi(b)
  const ay2 = aySonu(b)

  const buAySevk = veri.sevkiyatlar.filter((s) => s.tarih >= ay1 && s.tarih <= ay2)
  const buAyGiden = toplam(buAySevk, sevkiyatToplami)
  const gelir = toplam(veri.hareketler.filter((h) => h.tur === 'gelir'), (h) => h.tutar)
  const gider = toplam(veri.hareketler.filter((h) => h.tur === 'gider'), (h) => h.tutar)
  const avans = toplam(veri.avanslar, (a) => a.tutar)
  const kasa = gelir - gider - avans

  const bekleyen = veri.vadeler.filter((v) => v.durum === 'bekliyor')
  const geciken = bekleyen.filter((v) => v.vade < b)
  const yaklasan = bekleyen.filter((v) => v.vade >= b && v.vade <= gunEkle(b, 14))
  const tahsilEdilecek = toplam(bekleyen.filter((v) => v.yon === 'tahsilat'), (v) => v.tutar)
  const odenecek = toplam(bekleyen.filter((v) => v.yon === 'odeme'), (v) => v.tutar)

  const aktifSantiyeler = veri.santiyeler
    .filter((s) => s.durum === 'aktif')
    .map((s) => ({ s, o: santiyeOzeti(s.id, veri.sevkiyatlar, veri.hareketler, veri.avanslar) }))
    .sort((a, b) => (b.o.sonSevkiyat ?? '').localeCompare(a.o.sonSevkiyat ?? '') || b.o.maliyet - a.o.maliyet)
    .slice(0, 5)

  const bos = !veri.santiyeler.length && !veri.sevkiyatlar.length && !veri.hareketler.length
  const yd = useYedekDurumu()
  const bildir = useBildirim()
  /* Veri her değiştiğinde yeniden sayılır */
  const ornekSayisi = useCanli(async () => (await ornekKayitlariBul()).toplam, [veri]) ?? 0
  const elle = sonElleYedek()
  const yedekUyarisi = bos
    ? ''
    : yd.masaustu
      ? yd.sonHata
        ? "Otomatik yedek alınamadı. Ayarlar'dan hemen elle yedek indirin."
        : ''
      : !elle || Date.now() - Date.parse(elle) > 7 * 86400000
        ? elle
          ? "Son yedeğin üzerinden 7 günden fazla geçti. Ayarlar'dan yedek indirin."
          : "Bu cihazda henüz yedek alınmadı. Ayarlar'dan yedek indirin."
        : ''

  return (
    <div>
      <Baslik
        baslik="Pano"
        alt={new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
        sag={
          <span className="hidden md:block">
            <Dugme tur="ana" onClick={() => git('/gonder')}>
              <Plus size={18} /> Malzeme gönder
            </Dugme>
          </span>
        }
      />

      {bos && (
        <Kart className="mb-5 p-5">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-white">Hoş geldin 👷</h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Başlamak için bir şantiye ekleyip ona malzeme gönder. Malzemeler yazdıkça kendiliğinden kataloğa eklenir, fiyatlar hatırlanır.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Dugme tur="ana" onClick={() => git('/gonder')}>
              <Truck size={18} /> İlk malzemeyi gönder
            </Dugme>
            <Dugme onClick={() => git('/ayarlar')}>Örnek verilerle dene</Dugme>
          </div>
        </Kart>
      )}

      {ornekSayisi > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-900 ring-1 ring-sky-200 dark:bg-sky-950/50 dark:text-sky-100 dark:ring-sky-900">
          <span className="min-w-0 flex-1">
            <b>Örnek veriler yüklü.</b> Denemeyi bitirince kaldırın; sizin girdiğiniz kayıtlara dokunulmaz.
          </span>
          <Dugme
            kucuk
            onClick={async () => {
              if (!confirm(`${ornekSayisi} örnek kayıt kaldırılacak. Sizin girdiğiniz kayıtlara dokunulmaz. Devam edilsin mi?`)) return
              bildir(`${await ornekVerileriKaldir()} örnek kayıt kaldırıldı`)
            }}
          >
            Örnek verileri kaldır
          </Dugme>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Ozet etiket="Bu ay giden" deger={para(buAyGiden)} alt={`${buAySevk.length} sevkiyat`} simge={<Truck size={15} />} />
        <Ozet etiket="Kasa" deger={para(kasa)} ton={kasa < 0 ? 'kotu' : undefined} alt="Gelir − gider − avans" simge={<Wallet size={15} />} />
        <Ozet etiket="Tahsil edilecek" deger={para(tahsilEdilecek)} ton="iyi" alt={`${bekleyen.filter((v) => v.yon === 'tahsilat').length} vade`} simge={<ArrowDownLeft size={15} />} />
        <Ozet etiket="Ödenecek" deger={para(odenecek)} ton="uyari" alt={`${bekleyen.filter((v) => v.yon === 'odeme').length} vade`} simge={<ArrowUpRight size={15} />} />
      </div>

      {yedekUyarisi && (
        <button type="button" onClick={() => git('/ayarlar')} className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-left text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:ring-amber-900">
          <AlertTriangle size={20} className="shrink-0" />
          <span className="text-sm">{yedekUyarisi}</span>
        </button>
      )}

      {geciken.length > 0 && (
        <button
          type="button"
          onClick={() => git('/vadeler')}
          className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-left text-red-800 ring-1 ring-red-200 dark:bg-red-950/60 dark:text-red-200 dark:ring-red-900"
        >
          <AlertTriangle size={20} className="shrink-0" />
          <span className="text-sm">
            <b>{geciken.length} vade geçti</b>, toplam {para(toplam(geciken, (v) => v.tutar))}. Görmek için dokun.
          </span>
        </button>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Kart>
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="flex items-center gap-2 font-semibold text-stone-900 dark:text-white">
              <CalendarClock size={18} /> Yaklaşan 14 gün
            </h2>
            <Dugme tur="hayalet" kucuk onClick={() => git('/vadeler')}>
              Tümü
            </Dugme>
          </div>
          {yaklasan.length ? (
            <Liste>
              {yaklasan.slice(0, 6).map((v) => (
                <Satir
                  key={v.id}
                  onClick={() => git('/vadeler')}
                  sol={vadeBasligi(v, adBul(veri.cariler, v.cariId))}
                  alt={`${tarihGoster(v.vade)} · ${vadeYazisi(v.vade)}`}
                  sag={
                    <div>
                      <div className={v.yon === 'tahsilat' ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'font-semibold text-amber-700 dark:text-amber-400'}>
                        {v.yon === 'tahsilat' ? '+' : '−'}
                        {para(v.tutar)}
                      </div>
                      <Rozet ton={gunFarki(b, v.vade) <= 2 ? 'sari' : 'gri'}>{v.yon === 'tahsilat' ? 'Tahsilat' : 'Ödeme'}</Rozet>
                    </div>
                  }
                />
              ))}
            </Liste>
          ) : (
            <Bos baslik="Yaklaşan vade yok" aciklama="Çek, senet ya da sözlü vadeleri Ödeme ve Tahsilat ekranından ekleyin." />
          )}
        </Kart>

        <Kart>
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="flex items-center gap-2 font-semibold text-stone-900 dark:text-white">
              <Building2 size={18} /> Aktif şantiyeler
            </h2>
            <Dugme tur="hayalet" kucuk onClick={() => git('/santiyeler')}>
              Tümü
            </Dugme>
          </div>
          {aktifSantiyeler.length ? (
            <Liste>
              {aktifSantiyeler.map(({ s, o }) => (
                <Satir
                  key={s.id}
                  onClick={() => git(`/santiyeler/${s.id}`)}
                  sol={s.ad}
                  alt={`${adBul(veri.cariler, s.firmaId) || 'Firma seçilmedi'} · ${o.sevkiyatSayisi} sevkiyat`}
                  sag={
                    <div>
                      <div className="font-semibold">{para(o.maliyet)}</div>
                      <div className="text-xs text-stone-500">toplam maliyet</div>
                    </div>
                  }
                />
              ))}
            </Liste>
          ) : (
            <Bos baslik="Aktif şantiye yok" />
          )}
        </Kart>

        <Kart className="lg:col-span-2">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="flex items-center gap-2 font-semibold text-stone-900 dark:text-white">
              <Truck size={18} /> Son giden malzemeler
            </h2>
            <Dugme tur="hayalet" kucuk onClick={() => git('/sevkiyatlar')}>
              Tümü
            </Dugme>
          </div>
          {veri.sevkiyatlar.length ? (
            <Liste>
              {veri.sevkiyatlar.slice(0, 6).map((s) => (
                <Satir
                  key={s.id}
                  onClick={() => git(`/gonder/${s.id}`)}
                  sol={adBul(veri.santiyeler, s.santiyeId)}
                  alt={`${tarihGoster(s.tarih)} · ${s.kalemler.map((k) => k.ad).join(', ')}`}
                  sag={<span className="font-semibold">{para(sevkiyatToplami(s))}</span>}
                />
              ))}
            </Liste>
          ) : (
            <Bos baslik="Henüz malzeme gönderilmedi" eylem={<Dugme tur="ana" onClick={() => git('/gonder')}><Plus size={18} /> Malzeme gönder</Dugme>} />
          )}
        </Kart>
      </div>
    </div>
  )
}
