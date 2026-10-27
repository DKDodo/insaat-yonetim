import { Plus, Trash2, Truck } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CariFormu, SantiyeFormu, SantiyeSecimi, CariSecimi, BirimSecimi } from '../components/formlar'
import { Baslik, Dugme, Etiket, Girdi, Kart, MetinAlani, SayiGirdi, cx, useBildirim } from '../components/ui'
import { db, type Sevkiyat } from '../db'
import { bugun, para, sayi, sayiMetni, sayiOku, simdi, yeniId, yuvarla } from '../lib/format'
import { kalemleriHazirla, type TumVeri } from '../lib/veri'

interface SatirDurumu {
  anahtar: string
  ad: string
  birim: string
  miktar: string
  fiyat: string
}

function bosSatir(): SatirDurumu {
  return { anahtar: yeniId(), ad: '', birim: 'adet', miktar: '', fiyat: '' }
}

export default function Gonder({ veri }: { veri: TumVeri }) {
  const { id } = useParams()
  const [arama] = useSearchParams()
  const git = useNavigate()
  const bildir = useBildirim()
  const duzenlenen = id ? veri.sevkiyatlar.find((s) => s.id === id) : undefined

  const [tarih, setTarih] = useState(bugun())
  const [santiyeId, setSantiyeId] = useState(arama.get('santiye') ?? '')
  const [tedarikciId, setTedarikciId] = useState('')
  const [irsaliyeNo, setIrsaliyeNo] = useState('')
  const [satirlar, setSatirlar] = useState<SatirDurumu[]>([bosSatir()])
  const [nakliye, setNakliye] = useState('')
  const [hizmet, setHizmet] = useState('')
  const [not, setNot] = useState('')
  const [hata, setHata] = useState('')
  const [bekle, setBekle] = useState(false)
  const [santiyePenceresi, setSantiyePenceresi] = useState(false)
  const [tedarikciPenceresi, setTedarikciPenceresi] = useState(false)
  const yuklendi = useRef<string | null>(null)
  const sonSatir = useRef<HTMLInputElement>(null)
  const odakla = useRef(false)

  useEffect(() => {
    if (!duzenlenen || yuklendi.current === duzenlenen.id) return
    yuklendi.current = duzenlenen.id
    setTarih(duzenlenen.tarih)
    setSantiyeId(duzenlenen.santiyeId)
    setTedarikciId(duzenlenen.tedarikciId ?? '')
    setIrsaliyeNo(duzenlenen.irsaliyeNo ?? '')
    setSatirlar(
      duzenlenen.kalemler.map((k) => ({ anahtar: yeniId(), ad: k.ad, birim: k.birim, miktar: sayiMetni(k.miktar), fiyat: sayiMetni(k.birimFiyat) })),
    )
    setNakliye(sayiMetni(duzenlenen.nakliye))
    setHizmet(sayiMetni(duzenlenen.hizmet))
    setNot(duzenlenen.not ?? '')
  }, [duzenlenen])

  useEffect(() => {
    if (odakla.current) {
      odakla.current = false
      sonSatir.current?.focus()
    }
  }, [satirlar.length])

  const katalog = useMemo(() => new Map(veri.malzemeler.map((m) => [m.ad.toLocaleLowerCase('tr-TR'), m])), [veri.malzemeler])

  /* En sık gönderilen malzemeler: tek dokunuşla satır eklemek için */
  const sikKullanilan = useMemo(() => {
    const say = new Map<string, number>()
    for (const s of veri.sevkiyatlar) for (const k of s.kalemler) say.set(k.malzemeId, (say.get(k.malzemeId) ?? 0) + 1)
    return veri.malzemeler
      .map((m) => ({ m, n: say.get(m.id) ?? 0 }))
      .sort((a, b) => b.n - a.n || a.m.ad.localeCompare(b.m.ad, 'tr'))
      .slice(0, 10)
      .map((x) => x.m)
  }, [veri.malzemeler, veri.sevkiyatlar])

  const guncelle = (anahtar: string, alan: Partial<SatirDurumu>) =>
    setSatirlar((l) => l.map((s) => (s.anahtar === anahtar ? { ...s, ...alan } : s)))

  const adDegisti = (anahtar: string, ad: string) => {
    const m = katalog.get(ad.trim().toLocaleLowerCase('tr-TR'))
    setSatirlar((l) =>
      l.map((s) => {
        if (s.anahtar !== anahtar) return s
        if (!m) return { ...s, ad }
        return { ...s, ad: m.ad, birim: m.birim, fiyat: s.fiyat || sayiMetni(m.fiyat) }
      }),
    )
  }

  const satirEkle = (hazir?: Partial<SatirDurumu>) => {
    odakla.current = !hazir
    setSatirlar((l) => {
      const bos = l.length === 1 && !l[0].ad && !l[0].miktar
      const yeni = { ...bosSatir(), ...hazir }
      return bos ? [yeni] : [...l, yeni]
    })
  }

  const satirTutari = (s: SatirDurumu) => {
    const m = sayiOku(s.miktar)
    const f = sayiOku(s.fiyat)
    return Number.isFinite(m) && Number.isFinite(f) ? yuvarla(m * f) : 0
  }
  const malzemeToplam = yuvarla(satirlar.reduce((t, s) => t + satirTutari(s), 0))
  const nakliyeSayi = sayiOku(nakliye) || 0
  const hizmetSayi = sayiOku(hizmet) || 0
  const genelToplam = yuvarla(malzemeToplam + nakliyeSayi + hizmetSayi)

  const kaydet = async () => {
    setHata('')
    if (!santiyeId) return setHata('Malzemenin gittiği şantiyeyi seçin.')
    const dolu = satirlar.filter((s) => s.ad.trim() || s.miktar.trim())
    if (!dolu.length) return setHata('En az bir malzeme ve miktar yazın.')
    for (const s of dolu) {
      if (!s.ad.trim()) return setHata('Miktarı yazılan bir satırın malzeme adı boş.')
      const m = sayiOku(s.miktar)
      if (!m || Number.isNaN(m) || m <= 0) return setHata(`"${s.ad}" için miktarı yazın.`)
      if (Number.isNaN(sayiOku(s.fiyat))) return setHata(`"${s.ad}" için fiyatı sayı olarak yazın.`)
    }
    if (Number.isNaN(sayiOku(nakliye)) || Number.isNaN(sayiOku(hizmet))) return setHata('Nakliye ve hizmet bedelini sayı olarak yazın.')
    setBekle(true)
    try {
      const kalemler = await kalemleriHazirla(
        dolu.map((s) => ({ ad: s.ad, birim: s.birim, miktar: sayiOku(s.miktar), birimFiyat: sayiOku(s.fiyat) || 0 })),
      )
      const kayit: Sevkiyat = {
        id: duzenlenen?.id ?? yeniId(),
        tarih,
        santiyeId,
        tedarikciId: tedarikciId || undefined,
        irsaliyeNo: irsaliyeNo.trim() || undefined,
        kalemler,
        nakliye: nakliyeSayi,
        hizmet: hizmetSayi,
        not: not.trim() || undefined,
        olusturma: duzenlenen?.olusturma ?? simdi(),
      }
      await db.sevkiyatlar.put(kayit)
      bildir(duzenlenen ? 'Sevkiyat güncellendi' : `Kaydedildi: ${kalemler.length} kalem, ${para(genelToplam)}`)
      git(`/santiyeler/${santiyeId}`)
    } finally {
      setBekle(false)
    }
  }

  if (id && !duzenlenen) {
    return <Baslik baslik="Kayıt bulunamadı" alt="Bu sevkiyat silinmiş olabilir." />
  }

  return (
    <div className="pb-24 md:pb-0">
      <Baslik
        baslik={duzenlenen ? 'Sevkiyatı düzenle' : 'Malzeme Gönder'}
        alt="Şantiyeye giden malzemeleri ve miktarlarını yazın; toplam maliyet kendiliğinden hesaplanır."
      />

      <datalist id="malzeme-listesi">
        {veri.malzemeler.map((m) => (
          <option key={m.id} value={m.ad} />
        ))}
      </datalist>

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="grid min-w-0 grid-cols-1 gap-4">
          <Kart className="grid gap-4 p-4 md:grid-cols-2">
            <Etiket etiket="Şantiye">
              <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                  <SantiyeSecimi veri={veri} deger={santiyeId} degistir={setSantiyeId} bosEtiket="Şantiye seçin" />
                </div>
                <Dugme onClick={() => setSantiyePenceresi(true)} aria-label="Yeni şantiye" className="w-11 shrink-0 px-0">
                  <Plus size={18} />
                </Dugme>
              </div>
            </Etiket>
            <Etiket etiket="Tarih">
              <Girdi type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
            </Etiket>
            <Etiket etiket="Tedarikçi (alındığı yer)" ipucu="İsteğe bağlı. Seçerseniz tedarikçiye borcunuz cari hesapta görünür.">
              <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                  <CariSecimi veri={veri} deger={tedarikciId} degistir={setTedarikciId} tur="tedarikci" />
                </div>
                <Dugme onClick={() => setTedarikciPenceresi(true)} aria-label="Yeni tedarikçi" className="w-11 shrink-0 px-0">
                  <Plus size={18} />
                </Dugme>
              </div>
            </Etiket>
            <Etiket etiket="İrsaliye / fiş no">
              <Girdi value={irsaliyeNo} onChange={(e) => setIrsaliyeNo(e.target.value)} placeholder="İsteğe bağlı" />
            </Etiket>
          </Kart>

          <Kart className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-stone-900 dark:text-stone-50">Malzemeler</h2>
              <span className="text-sm text-stone-500 tabular-nums">{satirlar.filter((s) => s.ad).length} kalem</span>
            </div>

            {sikKullanilan.length > 0 && (
              <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
                {sikKullanilan.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => satirEkle({ ad: m.ad, birim: m.birim, fiyat: sayiMetni(m.fiyat) })}
                    className="flex h-9 shrink-0 items-center gap-1 rounded-full bg-amber-50 px-3 text-sm font-medium text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-200 dark:ring-amber-900"
                  >
                    <Plus size={14} /> {m.ad}
                  </button>
                ))}
              </div>
            )}

            <div className="hidden grid-cols-[minmax(0,1fr)_110px_110px_130px_120px_40px] gap-2 px-1 pb-1.5 text-xs font-medium text-stone-500 md:grid">
              <span>Malzeme</span>
              <span>Miktar</span>
              <span>Birim</span>
              <span>Birim fiyat (₺)</span>
              <span className="text-right">Tutar</span>
              <span />
            </div>

            <div className="grid gap-3 md:gap-2">
              {satirlar.map((s, i) => (
                <div
                  key={s.anahtar}
                  className="grid grid-cols-2 gap-2 rounded-xl bg-stone-50 p-3 ring-1 ring-stone-200/70 md:grid-cols-[minmax(0,1fr)_110px_110px_130px_120px_40px] md:items-center md:bg-transparent md:p-0 md:ring-0 dark:bg-stone-950 dark:ring-stone-800 md:dark:bg-transparent"
                >
                  <Girdi
                    ref={i === satirlar.length - 1 ? sonSatir : undefined}
                    list="malzeme-listesi"
                    value={s.ad}
                    onChange={(e) => adDegisti(s.anahtar, e.target.value)}
                    placeholder="Malzeme adı (örn. Çimento)"
                    aria-label="Malzeme adı"
                    className="col-span-2 md:col-span-1"
                  />
                  <SayiGirdi value={s.miktar} onChange={(e) => guncelle(s.anahtar, { miktar: e.target.value })} placeholder="Miktar" aria-label="Miktar" />
                  <BirimSecimi deger={s.birim} degistir={(b) => guncelle(s.anahtar, { birim: b })} />
                  <SayiGirdi value={s.fiyat} onChange={(e) => guncelle(s.anahtar, { fiyat: e.target.value })} placeholder="Birim fiyat" aria-label="Birim fiyat" />
                  <div className="flex h-11 items-center justify-end text-right font-semibold text-stone-900 tabular-nums dark:text-stone-100">
                    {para(satirTutari(s))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSatirlar((l) => (l.length === 1 ? [bosSatir()] : l.filter((x) => x.anahtar !== s.anahtar)))}
                    className="col-span-2 flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm text-stone-500 hover:bg-red-50 hover:text-red-600 md:col-span-1 md:h-11 dark:hover:bg-red-950"
                    aria-label="Satırı sil"
                  >
                    <Trash2 size={17} />
                    <span className="md:hidden">Satırı sil</span>
                  </button>
                </div>
              ))}
            </div>

            <Dugme className="mt-3 w-full md:w-auto" onClick={() => satirEkle()}>
              <Plus size={18} /> Satır ekle
            </Dugme>
          </Kart>

          <Kart className="grid gap-4 p-4 md:grid-cols-2">
            <Etiket etiket="Nakliye bedeli (₺)">
              <SayiGirdi value={nakliye} onChange={(e) => setNakliye(e.target.value)} placeholder="0" />
            </Etiket>
            <Etiket etiket="Hizmet bedeli (₺)" ipucu="Firmaya yansıttığınız kendi kazancınız.">
              <SayiGirdi value={hizmet} onChange={(e) => setHizmet(e.target.value)} placeholder="0" />
            </Etiket>
            <Etiket etiket="Not" className="md:col-span-2">
              <MetinAlani value={not} onChange={(e) => setNot(e.target.value)} placeholder="Örn. Teslim alan: Ahmet usta" />
            </Etiket>
          </Kart>
        </div>

        {/* Özet: bilgisayarda yanda sabit, telefonda altta sabit çubuk */}
        <Kart className="hidden p-5 lg:sticky lg:top-8 lg:block">
          <OzetIcerik malzeme={malzemeToplam} nakliye={nakliyeSayi} hizmet={hizmetSayi} toplam={genelToplam} satirlar={satirlar} />
          {hata && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{hata}</p>}
          <Dugme tur="ana" className="mt-4 w-full" onClick={kaydet} disabled={bekle}>
            <Truck size={18} /> {duzenlenen ? 'Değişiklikleri kaydet' : 'Kaydet'}
          </Dugme>
        </Kart>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur-xl md:bottom-0 md:left-64 lg:hidden dark:border-stone-800 dark:bg-stone-900/95">
        {hata && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{hata}</p>}
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-stone-500">Toplam</div>
            <div className="truncate text-xl font-semibold tabular-nums text-stone-900 dark:text-white">{para(genelToplam)}</div>
          </div>
          <Dugme tur="ana" onClick={kaydet} disabled={bekle} className="px-6">
            <Truck size={18} /> Kaydet
          </Dugme>
        </div>
      </div>

      <SantiyeFormu acik={santiyePenceresi} kapat={() => setSantiyePenceresi(false)} veri={veri} olustu={(s) => setSantiyeId(s.id)} />
      <CariFormu acik={tedarikciPenceresi} kapat={() => setTedarikciPenceresi(false)} varsayilanTur="tedarikci" olustu={(c) => setTedarikciId(c.id)} />
    </div>
  )
}

function OzetIcerik({ malzeme, nakliye, hizmet, toplam, satirlar }: { malzeme: number; nakliye: number; hizmet: number; toplam: number; satirlar: SatirDurumu[] }) {
  const dolu = satirlar.filter((s) => s.ad.trim())
  return (
    <div>
      <h2 className="font-semibold text-stone-900 dark:text-stone-50">Özet</h2>
      <dl className="mt-3 grid gap-2 text-sm">
        {dolu.map((s) => (
          <div key={s.anahtar} className="flex justify-between gap-3 text-stone-600 dark:text-stone-400">
            <dt className="truncate">
              {s.ad} <span className="text-stone-400">· {sayi(sayiOku(s.miktar) || 0)} {s.birim}</span>
            </dt>
          </div>
        ))}
      </dl>
      <dl className="mt-4 grid gap-1.5 border-t border-stone-200 pt-3 text-sm dark:border-stone-800">
        <Sat ad="Malzeme" deger={malzeme} />
        <Sat ad="Nakliye" deger={nakliye} />
        <Sat ad="Hizmet bedeli" deger={hizmet} />
      </dl>
      <div className="mt-3 flex items-baseline justify-between border-t border-stone-200 pt-3 dark:border-stone-800">
        <span className="font-medium">Toplam</span>
        <span className={cx('text-2xl font-semibold tabular-nums text-stone-900 dark:text-white')}>{para(toplam)}</span>
      </div>
    </div>
  )
}

function Sat({ ad, deger }: { ad: string; deger: number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-stone-500">{ad}</dt>
      <dd className="tabular-nums">{para(deger)}</dd>
    </div>
  )
}
