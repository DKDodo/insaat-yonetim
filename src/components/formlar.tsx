import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  BIRIMLER,
  CARI_TURLERI,
  db,
  GELIR_KATEGORILERI,
  GIDER_KATEGORILERI,
  type Avans,
  type Cari,
  type CariTur,
  type CekBilgisi,
  ODEME_SEKILLERI,
  type OdemeSekli,
  type Hareket,
  type HareketTur,
  type Isci,
  type Malzeme,
  type Santiye,
  type Vade,
  type VadeYon,
} from '../db'
import { bugun, gunEkle, sayiMetni, sayiOku, simdi, yeniId } from '../lib/format'
import type { TumVeri } from '../lib/veri'
import { Dugme, Etiket, Girdi, MetinAlani, Pencere, SayiGirdi, Secim, useBildirim } from './ui'

function FormPencere({
  acik,
  kapat,
  baslik,
  kaydet,
  children,
  hata,
}: {
  acik: boolean
  kapat: () => void
  baslik: string
  kaydet: () => Promise<boolean | void>
  children: ReactNode
  hata?: string
}) {
  const [bekle, setBekle] = useState(false)
  const gonder = async (e?: FormEvent) => {
    e?.preventDefault()
    setBekle(true)
    try {
      const sonuc = await kaydet()
      if (sonuc !== false) kapat()
    } finally {
      setBekle(false)
    }
  }
  return (
    <Pencere
      acik={acik}
      kapat={kapat}
      baslik={baslik}
      alt={
        <>
          <Dugme className="flex-1" onClick={kapat}>
            Vazgeç
          </Dugme>
          <Dugme tur="ana" className="flex-[2]" onClick={() => gonder()} disabled={bekle}>
            Kaydet
          </Dugme>
        </>
      }
    >
      <form onSubmit={gonder} className="grid gap-4 pt-1 pb-2">
        {children}
        {hata && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{hata}</p>}
        <button type="submit" hidden />
      </form>
    </Pencere>
  )
}

/* ---------- Cari ---------- */
export function CariFormu({
  acik,
  kapat,
  kayit,
  varsayilanTur = 'firma',
  olustu,
}: {
  acik: boolean
  kapat: () => void
  kayit?: Cari
  varsayilanTur?: CariTur
  olustu?: (c: Cari) => void
}) {
  const bildir = useBildirim()
  const [ad, setAd] = useState('')
  const [tur, setTur] = useState<CariTur>(varsayilanTur)
  const [telefon, setTelefon] = useState('')
  const [notlar, setNotlar] = useState('')
  const [hata, setHata] = useState('')
  useEffect(() => {
    if (!acik) return
    setAd(kayit?.ad ?? '')
    setTur(kayit?.tur ?? varsayilanTur)
    setTelefon(kayit?.telefon ?? '')
    setNotlar(kayit?.notlar ?? '')
    setHata('')
  }, [acik, kayit, varsayilanTur])
  return (
    <FormPencere
      acik={acik}
      kapat={kapat}
      baslik={kayit ? 'Cariyi düzenle' : 'Yeni cari'}
      hata={hata}
      kaydet={async () => {
        if (!ad.trim()) return setHata('Ad yazın.'), false
        const c: Cari = { id: kayit?.id ?? yeniId(), ad: ad.trim(), tur, telefon: telefon.trim() || undefined, notlar: notlar.trim() || undefined, olusturma: kayit?.olusturma ?? simdi() }
        await db.cariler.put(c)
        bildir(kayit ? 'Cari güncellendi' : 'Cari eklendi')
        olustu?.(c)
      }}
    >
      <Etiket etiket="Ad / Ünvan">
        <Girdi value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Örn. Yıldız İnşaat" autoFocus />
      </Etiket>
      <Etiket etiket="Tür">
        <Secim value={tur} onChange={(e) => setTur(e.target.value as CariTur)}>
          {Object.entries(CARI_TURLERI).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Secim>
      </Etiket>
      <Etiket etiket="Telefon">
        <Girdi value={telefon} onChange={(e) => setTelefon(e.target.value)} inputMode="tel" placeholder="05xx xxx xx xx" />
      </Etiket>
      <Etiket etiket="Not">
        <MetinAlani value={notlar} onChange={(e) => setNotlar(e.target.value)} />
      </Etiket>
    </FormPencere>
  )
}

/* ---------- Şantiye ---------- */
export function SantiyeFormu({
  acik,
  kapat,
  kayit,
  veri,
  olustu,
}: {
  acik: boolean
  kapat: () => void
  kayit?: Santiye
  veri: TumVeri
  olustu?: (s: Santiye) => void
}) {
  const bildir = useBildirim()
  const [ad, setAd] = useState('')
  const [firmaId, setFirmaId] = useState('')
  const [yeniFirma, setYeniFirma] = useState('')
  const [adres, setAdres] = useState('')
  const [durum, setDurum] = useState<'aktif' | 'bitti'>('aktif')
  const [notlar, setNotlar] = useState('')
  const [hata, setHata] = useState('')
  const firmalar = veri.cariler.filter((c) => c.tur === 'firma')
  useEffect(() => {
    if (!acik) return
    setAd(kayit?.ad ?? '')
    setFirmaId(kayit?.firmaId ?? '')
    setYeniFirma('')
    setAdres(kayit?.adres ?? '')
    setDurum(kayit?.durum ?? 'aktif')
    setNotlar(kayit?.notlar ?? '')
    setHata('')
  }, [acik, kayit])
  return (
    <FormPencere
      acik={acik}
      kapat={kapat}
      baslik={kayit ? 'Şantiyeyi düzenle' : 'Yeni şantiye'}
      hata={hata}
      kaydet={async () => {
        if (!ad.trim()) return setHata('Şantiye adını yazın.'), false
        let fId = firmaId || undefined
        if (firmaId === '__yeni') {
          if (!yeniFirma.trim()) return setHata('Firma adını yazın.'), false
          const c: Cari = { id: yeniId(), ad: yeniFirma.trim(), tur: 'firma', olusturma: simdi() }
          await db.cariler.add(c)
          fId = c.id
        }
        const s: Santiye = { id: kayit?.id ?? yeniId(), ad: ad.trim(), firmaId: fId, adres: adres.trim() || undefined, durum, notlar: notlar.trim() || undefined, olusturma: kayit?.olusturma ?? simdi() }
        await db.santiyeler.put(s)
        bildir(kayit ? 'Şantiye güncellendi' : 'Şantiye eklendi')
        olustu?.(s)
      }}
    >
      <Etiket etiket="Şantiye adı">
        <Girdi value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Örn. Kartal 12 katlı blok" autoFocus />
      </Etiket>
      <Etiket etiket="İnşaat firması">
        <Secim value={firmaId} onChange={(e) => setFirmaId(e.target.value)}>
          <option value="">Seçilmedi</option>
          {firmalar.map((f) => (
            <option key={f.id} value={f.id}>
              {f.ad}
            </option>
          ))}
          <option value="__yeni">+ Yeni firma ekle</option>
        </Secim>
      </Etiket>
      {firmaId === '__yeni' && (
        <Etiket etiket="Yeni firmanın adı">
          <Girdi value={yeniFirma} onChange={(e) => setYeniFirma(e.target.value)} placeholder="Örn. Yıldız İnşaat" />
        </Etiket>
      )}
      <Etiket etiket="Adres / konum">
        <Girdi value={adres} onChange={(e) => setAdres(e.target.value)} />
      </Etiket>
      <Etiket etiket="Durum">
        <Secim value={durum} onChange={(e) => setDurum(e.target.value as 'aktif' | 'bitti')}>
          <option value="aktif">Devam ediyor</option>
          <option value="bitti">Tamamlandı</option>
        </Secim>
      </Etiket>
      <Etiket etiket="Not">
        <MetinAlani value={notlar} onChange={(e) => setNotlar(e.target.value)} />
      </Etiket>
    </FormPencere>
  )
}

/* ---------- Malzeme ---------- */
export function MalzemeFormu({ acik, kapat, kayit }: { acik: boolean; kapat: () => void; kayit?: Malzeme }) {
  const bildir = useBildirim()
  const [ad, setAd] = useState('')
  const [birim, setBirim] = useState('adet')
  const [fiyat, setFiyat] = useState('')
  const [hata, setHata] = useState('')
  useEffect(() => {
    if (!acik) return
    setAd(kayit?.ad ?? '')
    setBirim(kayit?.birim ?? 'adet')
    setFiyat(sayiMetni(kayit?.fiyat))
    setHata('')
  }, [acik, kayit])
  return (
    <FormPencere
      acik={acik}
      kapat={kapat}
      baslik={kayit ? 'Malzemeyi düzenle' : 'Yeni malzeme'}
      hata={hata}
      kaydet={async () => {
        const temiz = ad.trim().replace(/\s+/g, ' ')
        if (!temiz) return setHata('Malzeme adını yazın.'), false
        const f = sayiOku(fiyat)
        if (Number.isNaN(f) || f < 0) return setHata('Fiyatı sayı olarak yazın.'), false
        const ayni = await db.malzemeler.where('ad').equals(temiz).first()
        if (ayni && ayni.id !== kayit?.id) return setHata('Bu adla bir malzeme zaten var.'), false
        await db.malzemeler.put({ id: kayit?.id ?? yeniId(), ad: temiz, birim, fiyat: f, olusturma: kayit?.olusturma ?? simdi() })
        bildir(kayit ? 'Malzeme güncellendi' : 'Malzeme eklendi')
      }}
    >
      <Etiket etiket="Malzeme adı">
        <Girdi value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Örn. Çimento 50 kg" autoFocus />
      </Etiket>
      <div className="grid grid-cols-2 gap-3">
        <Etiket etiket="Birim">
          <BirimSecimi deger={birim} degistir={setBirim} />
        </Etiket>
        <Etiket etiket="Birim fiyat (₺)">
          <SayiGirdi value={fiyat} onChange={(e) => setFiyat(e.target.value)} placeholder="0" />
        </Etiket>
      </div>
    </FormPencere>
  )
}

export function BirimSecimi({ deger, degistir, className }: { deger: string; degistir: (b: string) => void; className?: string }) {
  const liste = BIRIMLER.includes(deger) ? BIRIMLER : [deger, ...BIRIMLER]
  return (
    <Secim value={deger} onChange={(e) => degistir(e.target.value)} className={className}>
      {liste.map((b) => (
        <option key={b} value={b}>
          {b}
        </option>
      ))}
    </Secim>
  )
}

/* ---------- Gelir / gider ---------- */
export function HareketFormu({
  acik,
  kapat,
  kayit,
  veri,
  varsayilan,
}: {
  acik: boolean
  kapat: () => void
  kayit?: Hareket
  veri: TumVeri
  varsayilan?: Partial<Hareket>
}) {
  const bildir = useBildirim()
  const [tur, setTur] = useState<HareketTur>('gider')
  const [tarih, setTarih] = useState(bugun())
  const [kategori, setKategori] = useState('')
  const [tutar, setTutar] = useState('')
  const [cariId, setCariId] = useState('')
  const [santiyeId, setSantiyeId] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [sekil, setSekil] = useState<OdemeSekli | ''>('')
  const [cek, setCek] = useState<CekBilgisi>({})
  const [hata, setHata] = useState('')
  useEffect(() => {
    if (!acik) return
    const k = kayit ?? varsayilan
    const t = k?.tur ?? 'gider'
    setTur(t)
    setTarih(k?.tarih ?? bugun())
    setKategori(k?.kategori ?? (t === 'gelir' ? 'Tahsilat' : 'Malzeme'))
    setTutar(sayiMetni(k?.tutar))
    setCariId(k?.cariId ?? '')
    setSantiyeId(k?.santiyeId ?? '')
    setAciklama(k?.aciklama ?? '')
    setSekil(k?.odemeSekli ?? '')
    setCek(k?.cek ?? {})
    setHata('')
  }, [acik, kayit, varsayilan])
  const kategoriler = tur === 'gelir' ? GELIR_KATEGORILERI : GIDER_KATEGORILERI
  return (
    <FormPencere
      acik={acik}
      kapat={kapat}
      baslik={kayit ? 'Kaydı düzenle' : tur === 'gelir' ? 'Gelir / tahsilat ekle' : 'Gider / ödeme ekle'}
      hata={hata}
      kaydet={async () => {
        const t = sayiOku(tutar)
        if (!t || Number.isNaN(t) || t <= 0) return setHata('Tutarı yazın.'), false
        const h: Hareket = {
          id: kayit?.id ?? yeniId(),
          tarih,
          tur,
          kategori: kategori || 'Diğer',
          tutar: t,
          cariId: cariId || undefined,
          santiyeId: santiyeId || undefined,
          aciklama: aciklama.trim() || undefined,
          vadeId: kayit?.vadeId,
          odemeSekli: sekil || undefined,
          cek: cekKaydi(sekil, cek),
          olusturma: kayit?.olusturma ?? simdi(),
        }
        await db.hareketler.put(h)
        bildir('Kaydedildi')
      }}
    >
      <TurSecici
        deger={tur}
        degistir={(t) => {
          setTur(t)
          setKategori(t === 'gelir' ? 'Tahsilat' : 'Malzeme')
        }}
        secenekler={[
          ['gider', 'Gider / Ödeme'],
          ['gelir', 'Gelir / Tahsilat'],
        ]}
      />
      <div className="grid grid-cols-2 gap-3">
        <Etiket etiket="Tutar (₺)">
          <SayiGirdi value={tutar} onChange={(e) => setTutar(e.target.value)} placeholder="0" autoFocus />
        </Etiket>
        <Etiket etiket="Tarih">
          <Girdi type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
        </Etiket>
      </div>
      <Etiket etiket="Kategori">
        <Secim value={kategori} onChange={(e) => setKategori(e.target.value)}>
          {kategoriler.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </Secim>
      </Etiket>
      <Etiket etiket={tur === 'gelir' ? 'Kimden (cari)' : 'Kime (cari)'}>
        <CariSecimi veri={veri} deger={cariId} degistir={setCariId} />
      </Etiket>
      <Etiket etiket="Şantiye" ipucu="Şantiyeye ait harcamaysa seçin; şantiye maliyetine eklenir.">
        <SantiyeSecimi veri={veri} deger={santiyeId} degistir={setSantiyeId} />
      </Etiket>
      <OdemeSekliAlanlari sekil={sekil} setSekil={setSekil} cek={cek} setCek={setCek} />
      <Etiket etiket="Açıklama">
        <MetinAlani value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
      </Etiket>
    </FormPencere>
  )
}

/* Çek / senet seçili değilse çek bilgisini saklama; boş alanları at. */
function cekKaydi(sekil: OdemeSekli | '', cek: CekBilgisi): CekBilgisi | undefined {
  if (sekil !== 'cek' && sekil !== 'senet') return undefined
  const temiz: CekBilgisi = {}
  for (const [a, v] of Object.entries(cek) as [keyof CekBilgisi, string | undefined][]) if (v?.trim()) temiz[a] = v.trim()
  return Object.keys(temiz).length ? temiz : undefined
}

/* Ödeme şekli ve (çek/senet seçiliyse) numara, banka, şube, keşideci */
export function OdemeSekliAlanlari({
  sekil,
  setSekil,
  cek,
  setCek,
}: {
  sekil: OdemeSekli | ''
  setSekil: (s: OdemeSekli | '') => void
  cek: CekBilgisi
  setCek: (c: CekBilgisi) => void
}) {
  const alan = (a: keyof CekBilgisi) => ({ value: cek[a] ?? '', onChange: (e: { target: { value: string } }) => setCek({ ...cek, [a]: e.target.value }) })
  return (
    <>
      <Etiket etiket="Ödeme şekli">
        <Secim value={sekil} onChange={(e) => setSekil(e.target.value as OdemeSekli | '')}>
          <option value="">Belirtilmedi</option>
          {(Object.entries(ODEME_SEKILLERI) as [OdemeSekli, string][]).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Secim>
      </Etiket>
      {(sekil === 'cek' || sekil === 'senet') && (
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-amber-50/70 p-3 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:ring-amber-900">
          <Etiket etiket={sekil === 'cek' ? 'Çek no' : 'Senet no'}>
            <Girdi {...alan('no')} />
          </Etiket>
          {sekil === 'cek' ? (
            <Etiket etiket="Banka">
              <Girdi {...alan('banka')} placeholder="Örn. Ziraat" />
            </Etiket>
          ) : (
            <span />
          )}
          {sekil === 'cek' && (
            <Etiket etiket="Şube">
              <Girdi {...alan('sube')} />
            </Etiket>
          )}
          <Etiket etiket={sekil === 'cek' ? 'Keşideci (çeki kesen)' : 'Borçlu'} className={sekil === 'cek' ? '' : 'col-span-2'}>
            <Girdi {...alan('kesideci')} />
          </Etiket>
        </div>
      )}
    </>
  )
}

/* Listelerde kısa gösterim: "Çek · No 123 · Ziraat" */
export function odemeSekliYazisi(sekil?: OdemeSekli, cek?: CekBilgisi): string {
  if (!sekil) return ''
  const parca = [ODEME_SEKILLERI[sekil]]
  if (cek?.no) parca.push(`No ${cek.no}`)
  if (cek?.banka) parca.push(cek.banka)
  return parca.join(' · ')
}

/* ---------- Vade (planlanan ödeme / tahsilat) ---------- */
export function VadeFormu({
  acik,
  kapat,
  kayit,
  veri,
  varsayilanYon = 'tahsilat',
  varsayilanCari,
  varsayilanSekil,
}: {
  acik: boolean
  kapat: () => void
  kayit?: Vade
  veri: TumVeri
  varsayilanYon?: VadeYon
  varsayilanCari?: string
  varsayilanSekil?: OdemeSekli
}) {
  const bildir = useBildirim()
  const [yon, setYon] = useState<VadeYon>(varsayilanYon)
  const [vade, setVade] = useState(gunEkle(bugun(), 7))
  const [tutar, setTutar] = useState('')
  const [cariId, setCariId] = useState('')
  const [santiyeId, setSantiyeId] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [sekil, setSekil] = useState<OdemeSekli | ''>('')
  const [cek, setCek] = useState<CekBilgisi>({})
  const [hata, setHata] = useState('')
  useEffect(() => {
    if (!acik) return
    setYon(kayit?.yon ?? varsayilanYon)
    setVade(kayit?.vade ?? gunEkle(bugun(), 7))
    setTutar(sayiMetni(kayit?.tutar))
    setCariId(kayit?.cariId ?? varsayilanCari ?? '')
    setSantiyeId(kayit?.santiyeId ?? '')
    setAciklama(kayit?.aciklama ?? '')
    setSekil(kayit ? (kayit.odemeSekli ?? '') : (varsayilanSekil ?? ''))
    setCek(kayit?.cek ?? {})
    setHata('')
  }, [acik, kayit, varsayilanYon, varsayilanCari, varsayilanSekil])
  const cekMi = sekil === 'cek'
  return (
    <FormPencere
      acik={acik}
      kapat={kapat}
      baslik={kayit ? (cekMi ? 'Çeki düzenle' : 'Vadeyi düzenle') : cekMi ? 'Çek ekle' : 'Yaklaşan ödeme / tahsilat'}
      hata={hata}
      kaydet={async () => {
        const t = sayiOku(tutar)
        if (!t || Number.isNaN(t) || t <= 0) return setHata('Tutarı yazın.'), false
        const v: Vade = {
          id: kayit?.id ?? yeniId(),
          vade,
          yon,
          tutar: t,
          cariId: cariId || undefined,
          santiyeId: santiyeId || undefined,
          aciklama: aciklama.trim() || undefined,
          durum: kayit?.durum ?? 'bekliyor',
          tamamTarihi: kayit?.tamamTarihi,
          odemeSekli: sekil || undefined,
          cek: cekKaydi(sekil, cek),
          olusturma: kayit?.olusturma ?? simdi(),
        }
        await db.vadeler.put(v)
        bildir(cekMi ? 'Çek kaydedildi' : 'Vade kaydedildi')
      }}
    >
      <TurSecici
        deger={yon}
        degistir={setYon}
        secenekler={
          cekMi
            ? [
                ['tahsilat', 'Alınan çek (tahsil edeceğim)'],
                ['odeme', 'Verilen çek (ödeyeceğim)'],
              ]
            : [
                ['tahsilat', 'Tahsil edeceğim'],
                ['odeme', 'Ödeyeceğim'],
              ]
        }
      />
      <div className="grid grid-cols-2 gap-3">
        <Etiket etiket="Tutar (₺)">
          <SayiGirdi value={tutar} onChange={(e) => setTutar(e.target.value)} placeholder="0" autoFocus />
        </Etiket>
        <Etiket etiket={cekMi ? 'Çekin vadesi' : 'Vade tarihi'}>
          <Girdi type="date" value={vade} onChange={(e) => setVade(e.target.value)} />
        </Etiket>
      </div>
      <OdemeSekliAlanlari sekil={sekil} setSekil={setSekil} cek={cek} setCek={setCek} />
      <Etiket etiket={cekMi ? (yon === 'tahsilat' ? 'Çeki aldığınız cari' : 'Çeki verdiğiniz cari') : 'Cari'}>
        <CariSecimi veri={veri} deger={cariId} degistir={setCariId} />
      </Etiket>
      <Etiket etiket="Şantiye">
        <SantiyeSecimi veri={veri} deger={santiyeId} degistir={setSantiyeId} />
      </Etiket>
      <Etiket etiket="Açıklama">
        <MetinAlani value={aciklama} onChange={(e) => setAciklama(e.target.value)} placeholder="Örn. fatura no" />
      </Etiket>
    </FormPencere>
  )
}

/* ---------- İşçi ---------- */
export function IsciFormu({ acik, kapat, kayit }: { acik: boolean; kapat: () => void; kayit?: Isci }) {
  const bildir = useBildirim()
  const [ad, setAd] = useState('')
  const [telefon, setTelefon] = useState('')
  const [gorev, setGorev] = useState('')
  const [aktif, setAktif] = useState(true)
  const [hata, setHata] = useState('')
  useEffect(() => {
    if (!acik) return
    setAd(kayit?.ad ?? '')
    setTelefon(kayit?.telefon ?? '')
    setGorev(kayit?.gorev ?? '')
    setAktif(kayit?.aktif ?? true)
    setHata('')
  }, [acik, kayit])
  return (
    <FormPencere
      acik={acik}
      kapat={kapat}
      baslik={kayit ? 'İşçiyi düzenle' : 'Yeni işçi'}
      hata={hata}
      kaydet={async () => {
        if (!ad.trim()) return setHata('Ad soyad yazın.'), false
        await db.isciler.put({ id: kayit?.id ?? yeniId(), ad: ad.trim(), telefon: telefon.trim() || undefined, gorev: gorev.trim() || undefined, aktif, olusturma: kayit?.olusturma ?? simdi() })
        bildir(kayit ? 'İşçi güncellendi' : 'İşçi eklendi')
      }}
    >
      <Etiket etiket="Ad soyad">
        <Girdi value={ad} onChange={(e) => setAd(e.target.value)} autoFocus />
      </Etiket>
      <div className="grid grid-cols-2 gap-3">
        <Etiket etiket="Görev">
          <Girdi value={gorev} onChange={(e) => setGorev(e.target.value)} placeholder="Örn. Şoför" />
        </Etiket>
        <Etiket etiket="Telefon">
          <Girdi value={telefon} onChange={(e) => setTelefon(e.target.value)} inputMode="tel" />
        </Etiket>
      </div>
      <label className="flex items-center gap-3 text-[15px]">
        <input type="checkbox" checked={aktif} onChange={(e) => setAktif(e.target.checked)} className="size-5 accent-amber-500" />
        Çalışmaya devam ediyor
      </label>
    </FormPencere>
  )
}

/* ---------- Avans ---------- */
export function AvansFormu({
  acik,
  kapat,
  kayit,
  veri,
  isciId: varsayilanIsci,
  santiyeId: varsayilanSantiye,
}: {
  acik: boolean
  kapat: () => void
  kayit?: Avans
  veri: TumVeri
  isciId?: string
  santiyeId?: string
}) {
  const bildir = useBildirim()
  const [isciId, setIsciId] = useState('')
  const [tarih, setTarih] = useState(bugun())
  const [tutar, setTutar] = useState('')
  const [yeniIsci, setYeniIsci] = useState('')
  const [santiyeId, setSantiyeId] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [hata, setHata] = useState('')
  useEffect(() => {
    if (!acik) return
    setIsciId(kayit?.isciId ?? varsayilanIsci ?? '')
    setYeniIsci('')
    setTarih(kayit?.tarih ?? bugun())
    setTutar(sayiMetni(kayit?.tutar))
    setSantiyeId(kayit?.santiyeId ?? varsayilanSantiye ?? '')
    setAciklama(kayit?.aciklama ?? '')
    setHata('')
  }, [acik, kayit, varsayilanIsci, varsayilanSantiye])
  return (
    <FormPencere
      acik={acik}
      kapat={kapat}
      baslik={kayit ? 'Avansı düzenle' : 'Avans ver'}
      hata={hata}
      kaydet={async () => {
        if (!isciId) return setHata('İşçi seçin.'), false
        if (isciId === '__yeni' && !yeniIsci.trim()) return setHata('Yeni işçinin adını yazın.'), false
        const t = sayiOku(tutar)
        if (!t || Number.isNaN(t) || t <= 0) return setHata('Tutarı yazın.'), false
        let iId = isciId
        if (isciId === '__yeni') {
          iId = yeniId()
          await db.isciler.add({ id: iId, ad: yeniIsci.trim(), aktif: true, olusturma: simdi() })
        }
        await db.avanslar.put({ id: kayit?.id ?? yeniId(), isciId: iId, tarih, tutar: t, santiyeId: santiyeId || undefined, aciklama: aciklama.trim() || undefined, olusturma: kayit?.olusturma ?? simdi() })
        bildir('Avans kaydedildi')
      }}
    >
      <Etiket etiket="İşçi">
        <Secim value={isciId} onChange={(e) => setIsciId(e.target.value)}>
          <option value="">Seçin</option>
          {veri.isciler.map((i) => (
            <option key={i.id} value={i.id}>
              {i.ad}
              {i.aktif ? '' : ' (ayrıldı)'}
            </option>
          ))}
          <option value="__yeni">+ Yeni işçi ekle</option>
        </Secim>
      </Etiket>
      {isciId === '__yeni' && (
        <Etiket etiket="Yeni işçinin adı soyadı">
          <Girdi value={yeniIsci} onChange={(e) => setYeniIsci(e.target.value)} autoFocus />
        </Etiket>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Etiket etiket="Tutar (₺)">
          <SayiGirdi value={tutar} onChange={(e) => setTutar(e.target.value)} placeholder="0" />
        </Etiket>
        <Etiket etiket="Tarih">
          <Girdi type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
        </Etiket>
      </div>
      <Etiket etiket="Şantiye" ipucu="Seçerseniz şantiye maliyetine eklenir.">
        <SantiyeSecimi veri={veri} deger={santiyeId} degistir={setSantiyeId} />
      </Etiket>
      <Etiket etiket="Açıklama">
        <MetinAlani value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
      </Etiket>
    </FormPencere>
  )
}

/* ---------- ortak seçiciler ---------- */
export function CariSecimi({ veri, deger, degistir, tur }: { veri: TumVeri; deger: string; degistir: (id: string) => void; tur?: CariTur }) {
  const liste = tur ? veri.cariler.filter((c) => c.tur === tur) : veri.cariler
  return (
    <Secim value={deger} onChange={(e) => degistir(e.target.value)}>
      <option value="">Seçilmedi</option>
      {(['firma', 'tedarikci', 'diger'] as CariTur[]).map((t) => {
        const grup = liste.filter((c) => c.tur === t)
        if (!grup.length) return null
        return (
          <optgroup key={t} label={CARI_TURLERI[t]}>
            {grup.map((c) => (
              <option key={c.id} value={c.id}>
                {c.ad}
              </option>
            ))}
          </optgroup>
        )
      })}
    </Secim>
  )
}

export function SantiyeSecimi({ veri, deger, degistir, bosEtiket = 'Seçilmedi' }: { veri: TumVeri; deger: string; degistir: (id: string) => void; bosEtiket?: string }) {
  const aktif = veri.santiyeler.filter((s) => s.durum === 'aktif' || s.id === deger)
  const biten = veri.santiyeler.filter((s) => s.durum === 'bitti' && s.id !== deger)
  return (
    <Secim value={deger} onChange={(e) => degistir(e.target.value)}>
      <option value="">{bosEtiket}</option>
      {aktif.map((s) => (
        <option key={s.id} value={s.id}>
          {s.ad}
        </option>
      ))}
      {biten.length > 0 && (
        <optgroup label="Tamamlanan">
          {biten.map((s) => (
            <option key={s.id} value={s.id}>
              {s.ad}
            </option>
          ))}
        </optgroup>
      )}
    </Secim>
  )
}

export function TurSecici<T extends string>({ deger, degistir, secenekler }: { deger: T; degistir: (t: T) => void; secenekler: [T, string][] }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-stone-200/70 p-1 dark:bg-stone-800">
      {secenekler.map(([k, ad]) => (
        <button
          key={k}
          type="button"
          onClick={() => degistir(k)}
          className={
            'h-10 rounded-lg text-sm font-medium transition ' +
            (deger === k ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-700 dark:text-white' : 'text-stone-600 dark:text-stone-400')
          }
        >
          {ad}
        </button>
      ))}
    </div>
  )
}

/* Vade satırının başlığı: cari, yoksa çekin keşidecisi ya da numarası, yoksa açıklama. */
export function vadeBasligi(v: Vade, cariAdi: string): string {
  if (cariAdi) return cariAdi
  if (v.odemeSekli === 'cek' || v.odemeSekli === 'senet') {
    if (v.cek?.kesideci) return v.cek.kesideci
    if (v.cek?.no) return `${v.odemeSekli === 'cek' ? 'Çek' : 'Senet'} No ${v.cek.no}`
  }
  return v.aciklama || (v.yon === 'tahsilat' ? 'Tahsilat' : 'Ödeme')
}
