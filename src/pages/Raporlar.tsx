import { Download, Printer } from 'lucide-react'
import { Fragment, useMemo, useState, type ReactNode } from 'react'
import { SantiyeSecimi } from '../components/formlar'
import { Baslik, Dugme, Etiket, Girdi, Kart, Ozet, cx } from '../components/ui'
import { ayBasi, aySonu, bugun, para, sayi, tarihGoster, yuvarla } from '../lib/format'
import { malzemeOzetle, malzemeTutari, santiyeOzeti, sevkiyatToplami, toplam } from '../lib/hesap'
import { adBul, csvIndir, type TumVeri } from '../lib/veri'

const HAZIR: [string, () => [string, string]][] = [
  ['Bu ay', () => [ayBasi(), aySonu()]],
  [
    'Geçen ay',
    () => {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - 1)
      const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
      return [s, aySonu(s)]
    },
  ],
  ['Bu yıl', () => [bugun().slice(0, 4) + '-01-01', bugun().slice(0, 4) + '-12-31']],
  ['Tümü', () => ['', '']],
]

export default function Raporlar({ veri }: { veri: TumVeri }) {
  const [bas, setBas] = useState(ayBasi())
  const [son, setSon] = useState(aySonu())
  const [santiyeId, setSantiyeId] = useState('')

  const ar = <T extends { tarih: string; santiyeId?: string }>(l: T[]) =>
    l.filter((x) => (!bas || x.tarih >= bas) && (!son || x.tarih <= son) && (!santiyeId || x.santiyeId === santiyeId))

  const sevkiyatlar = useMemo(() => ar(veri.sevkiyatlar), [veri, bas, son, santiyeId]) // eslint-disable-line react-hooks/exhaustive-deps
  const hareketler = useMemo(() => ar(veri.hareketler), [veri, bas, son, santiyeId]) // eslint-disable-line react-hooks/exhaustive-deps
  const avanslar = useMemo(() => ar(veri.avanslar), [veri, bas, son, santiyeId]) // eslint-disable-line react-hooks/exhaustive-deps

  const santiyeTablosu = veri.santiyeler
    .filter((s) => !santiyeId || s.id === santiyeId)
    .map((s) => ({ s, o: santiyeOzeti(s.id, sevkiyatlar, hareketler, avanslar) }))
    .filter((x) => x.o.maliyet || x.o.tahsilat)
    .sort((a, b) => b.o.maliyet - a.o.maliyet)
  const malzemeTablosu = malzemeOzetle(sevkiyatlar)

  const kategoriler = (tur: 'gelir' | 'gider') => {
    const m = new Map<string, number>()
    for (const h of hareketler.filter((h) => h.tur === tur)) m.set(h.kategori, (m.get(h.kategori) ?? 0) + h.tutar)
    return [...m.entries()].map(([k, v]) => [k, yuvarla(v)] as const).sort((a, b) => b[1] - a[1])
  }
  const gider = kategoriler('gider')
  const gelir = kategoriler('gelir')
  const giderToplam = toplam(hareketler.filter((h) => h.tur === 'gider'), (h) => h.tutar)
  const gelirToplam = toplam(hareketler.filter((h) => h.tur === 'gelir'), (h) => h.tutar)
  const avansToplam = toplam(avanslar, (a) => a.tutar)
  const gidenToplam = toplam(sevkiyatlar, sevkiyatToplami)
  const tedarikciler = (() => {
    const m = new Map<string, number>()
    for (const s of sevkiyatlar) if (s.tedarikciId) m.set(s.tedarikciId, (m.get(s.tedarikciId) ?? 0) + malzemeTutari(s))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  })()

  const donemYazisi = bas || son ? `${tarihGoster(bas) || 'başlangıç'} – ${tarihGoster(son) || 'bugün'}` : 'Tüm zamanlar'
  const dosya = (ad: string) => `${ad}-${bas || 'tumu'}-${son || ''}.csv`.replace(/-\.csv$/, '.csv')

  return (
    <div>
      <Baslik
        baslik="Raporlar"
        alt={`${donemYazisi}${santiyeId ? ' · ' + adBul(veri.santiyeler, santiyeId) : ''}`}
        sag={
          <Dugme onClick={() => window.print()} className="print:hidden">
            <Printer size={17} /> Yazdır / PDF
          </Dugme>
        }
      />
      <Kart className="mb-5 p-4 print:hidden">
        <div className="mb-3 flex flex-wrap gap-2">
          {HAZIR.map(([ad, f]) => (
            <Dugme
              key={ad}
              kucuk
              onClick={() => {
                const [a, b] = f()
                setBas(a)
                setSon(b)
              }}
            >
              {ad}
            </Dugme>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Etiket etiket="Başlangıç">
            <Girdi type="date" value={bas} onChange={(e) => setBas(e.target.value)} />
          </Etiket>
          <Etiket etiket="Bitiş">
            <Girdi type="date" value={son} onChange={(e) => setSon(e.target.value)} />
          </Etiket>
          <Etiket etiket="Şantiye">
            <SantiyeSecimi veri={veri} deger={santiyeId} degistir={setSantiyeId} bosEtiket="Tüm şantiyeler" />
          </Etiket>
        </div>
      </Kart>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Ozet etiket="Giden malzeme" deger={para(gidenToplam)} alt={`${sevkiyatlar.length} sevkiyat`} />
        <Ozet etiket="Gelir" deger={para(gelirToplam)} ton="iyi" />
        <Ozet etiket="Gider" deger={para(giderToplam)} ton="kotu" />
        <Ozet etiket="Avans" deger={para(avansToplam)} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <RaporKarti
          baslik="Şantiye bazında maliyet"
          className="lg:col-span-2"
          disari={() =>
            csvIndir(
              dosya('santiye-maliyet'),
              ['Şantiye', 'Firma', 'Malzeme', 'Nakliye', 'Hizmet', 'Harcama', 'Avans', 'Toplam maliyet', 'Tahsilat', 'Kalan'],
              santiyeTablosu.map(({ s, o }) => [s.ad, adBul(veri.cariler, s.firmaId), o.malzeme, o.nakliye, o.hizmet, o.gider, o.avans, o.maliyet, o.tahsilat, o.kalan]),
            )
          }
        >
          <Tablo
            basliklar={['Şantiye', 'Malzeme', 'Nakliye + hizmet', 'Harcama + avans', 'Toplam', 'Kalan']}
            satirlar={santiyeTablosu.map(({ s, o }) => [
              <span key="a">
                <span className="font-medium text-stone-900 dark:text-stone-100">{s.ad}</span>
                <span className="block text-xs text-stone-500">{adBul(veri.cariler, s.firmaId)}</span>
              </span>,
              para(o.malzeme),
              para(o.nakliye + o.hizmet),
              para(o.gider + o.avans),
              <b key="t">{para(o.maliyet)}</b>,
              para(o.kalan),
            ])}
            alt={['Toplam', para(toplam(santiyeTablosu, (x) => x.o.malzeme)), para(toplam(santiyeTablosu, (x) => x.o.nakliye + x.o.hizmet)), para(toplam(santiyeTablosu, (x) => x.o.gider + x.o.avans)), para(toplam(santiyeTablosu, (x) => x.o.maliyet)), para(toplam(santiyeTablosu, (x) => x.o.kalan))]}
          />
        </RaporKarti>

        <RaporKarti
          baslik="Malzeme bazında giden"
          className="lg:col-span-2"
          disari={() =>
            csvIndir(dosya('malzeme'), ['Malzeme', 'Miktar', 'Birim', 'Ortalama fiyat', 'Tutar', 'Sefer'], malzemeTablosu.map((m) => [m.ad, m.miktar, m.birim, m.ortFiyat, m.tutar, m.sefer]))
          }
        >
          <Tablo
            basliklar={['Malzeme', 'Miktar', 'Ort. fiyat', 'Tutar']}
            satirlar={malzemeTablosu.map((m) => [<span key="a" className="font-medium text-stone-900 dark:text-stone-100">{m.ad}</span>, `${sayi(m.miktar)} ${m.birim}`, para(m.ortFiyat), <b key="t">{para(m.tutar)}</b>])}
            alt={['Toplam', '', '', para(toplam(malzemeTablosu, (m) => m.tutar))]}
          />
        </RaporKarti>

        <RaporKarti baslik="Gider kategorileri" disari={() => csvIndir(dosya('gider'), ['Kategori', 'Tutar'], gider.map(([k, v]) => [k, v]))}>
          <Cubuklar satirlar={gider} toplamDeger={giderToplam} renk="bg-red-500/80" />
        </RaporKarti>
        <RaporKarti baslik="Gelir kategorileri" disari={() => csvIndir(dosya('gelir'), ['Kategori', 'Tutar'], gelir.map(([k, v]) => [k, v]))}>
          <Cubuklar satirlar={gelir} toplamDeger={gelirToplam} renk="bg-emerald-500/80" />
        </RaporKarti>

        <RaporKarti
          baslik="Tedarikçilerden alınan"
          className="lg:col-span-2"
          disari={() => csvIndir(dosya('tedarikci'), ['Tedarikçi', 'Alınan malzeme'], tedarikciler.map(([id, v]) => [adBul(veri.cariler, id), yuvarla(v)]))}
        >
          <Cubuklar satirlar={tedarikciler.map(([id, v]) => [adBul(veri.cariler, id) || 'Silinmiş', yuvarla(v)] as const)} toplamDeger={toplam(tedarikciler, (x) => x[1])} renk="bg-amber-500" />
        </RaporKarti>
      </div>
    </div>
  )
}

function RaporKarti({ baslik, children, disari, className }: { baslik: string; children: ReactNode; disari: () => void; className?: string }) {
  return (
    <Kart className={cx('break-inside-avoid', className)}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="font-semibold text-stone-900 dark:text-white">{baslik}</h2>
        <Dugme kucuk tur="hayalet" onClick={disari} className="print:hidden">
          <Download size={15} /> Excel
        </Dugme>
      </div>
      {children}
    </Kart>
  )
}

function Tablo({ basliklar, satirlar, alt }: { basliklar: string[]; satirlar: ReactNode[][]; alt?: ReactNode[] }) {
  if (!satirlar.length) return <p className="px-4 pb-5 text-sm text-stone-500">Bu dönemde kayıt yok.</p>
  return (
    <>
    {/* Telefon: her satır bir kart (yana kaydırma yok) */}
    <div className="divide-y divide-stone-100 md:hidden dark:divide-stone-800 print:hidden">
      {satirlar.map((r, i) => (
        <div key={i} className="px-4 py-3">
          <div className="mb-1.5 font-medium">{r[0]}</div>
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 text-sm">
            {r.slice(1).map((h, j) => (
              <Fragment key={j}>
                <dt className="text-stone-500">{basliklar[j + 1]}</dt>
                <dd className="text-right tabular-nums">{h}</dd>
              </Fragment>
            ))}
          </dl>
        </div>
      ))}
      {alt && (
        <div className="flex items-baseline justify-between px-4 py-3 font-semibold">
          <span>{alt[0]}</span>
          <span className="tabular-nums">{alt[alt.length - 1]}</span>
        </div>
      )}
    </div>
    <div className="hidden overflow-x-auto md:block print:block">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-y border-stone-100 text-xs text-stone-500 dark:border-stone-800">
            {basliklar.map((b, i) => (
              <th key={b} className={cx('px-4 py-2 font-medium', i ? 'text-right' : 'text-left')}>
                {b}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
          {satirlar.map((r, i) => (
            <tr key={i}>
              {r.map((h, j) => (
                <td key={j} className={cx('px-4 py-2.5', j ? 'text-right tabular-nums' : '')}>
                  {h}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {alt && (
          <tfoot>
            <tr className="border-t border-stone-200 font-semibold dark:border-stone-700">
              {alt.map((h, j) => (
                <td key={j} className={cx('px-4 py-3', j ? 'text-right tabular-nums' : '')}>
                  {h}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
    </>
  )
}

function Cubuklar({ satirlar, toplamDeger, renk }: { satirlar: readonly (readonly [string, number])[]; toplamDeger: number; renk: string }) {
  if (!satirlar.length) return <p className="px-4 pb-5 text-sm text-stone-500">Bu dönemde kayıt yok.</p>
  const en = Math.max(...satirlar.map((s) => s[1]))
  return (
    <ul className="grid gap-3 px-4 pb-4">
      {satirlar.map(([ad, v]) => (
        <li key={ad}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="truncate">{ad}</span>
            <span className="shrink-0 tabular-nums">
              {para(v)} <span className="text-xs text-stone-400">%{toplamDeger ? Math.round((v / toplamDeger) * 100) : 0}</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-stone-100 dark:bg-stone-800">
            <div className={cx('h-2 rounded-full', renk)} style={{ width: `${en ? Math.max(2, (v / en) * 100) : 0}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
