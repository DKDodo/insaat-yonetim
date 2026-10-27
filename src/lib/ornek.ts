import { db, type Avans, type Cari, type Hareket, type Isci, type Malzeme, type Santiye, type Sevkiyat, type Vade } from '../db'
import { kaldir } from './esitleme'
import { bugun, gunEkle, simdi, yeniId } from './format'

/* Örnek kayıtların kimliği "ornek-" ile başlar; böylece gerçek kayıtlardan ayrılır ve tek tuşla kaldırılır. */
const ornekId = () => 'ornek-' + yeniId()

/* Uygulamayı denemek için kurgusal örnek veri. Gerçek kişi ya da firma değildir. */
export async function ornekVeriYukle(): Promise<void> {
  const b = bugun()
  const o = simdi()
  const c = (ad: string, tur: Cari['tur']): Cari => ({ id: ornekId(), ad, tur, olusturma: o })
  const firma1 = c('Örnek Yapı A.Ş.', 'firma')
  const firma2 = c('Deneme İnşaat Ltd.', 'firma')
  const ted1 = c('Merkez Yapı Market', 'tedarikci')
  const ted2 = c('Kuzey Hazır Beton', 'tedarikci')
  const cariler = [firma1, firma2, ted1, ted2]

  const s1: Santiye = { id: ornekId(), ad: 'Çamlık Konutları B Blok', firmaId: firma1.id, adres: 'Çamlık Mah.', durum: 'aktif', olusturma: o }
  const s2: Santiye = { id: ornekId(), ad: 'Sahil Sitesi Çevre Duvarı', firmaId: firma2.id, durum: 'aktif', olusturma: o }
  const s3: Santiye = { id: ornekId(), ad: 'Okul Bahçe Düzenlemesi', firmaId: firma1.id, durum: 'bitti', olusturma: o }
  const santiyeler = [s1, s2, s3]

  const m = (ad: string, birim: string, fiyat: number): Malzeme => ({ id: ornekId(), ad, birim, fiyat, olusturma: o })
  const cimento = m('Çimento 50 kg', 'torba', 285)
  const demir12 = m('İnşaat demiri Ø12', 'ton', 24500)
  const kum = m('Kum', 'm³', 650)
  const tugla = m('Tuğla 13,5', 'adet', 7.4)
  const beton = m('Hazır beton C30', 'm³', 3150)
  const malzemeler = [cimento, demir12, kum, tugla, beton]

  const k = (x: Malzeme, miktar: number, fiyat = x.fiyat) => ({ malzemeId: x.id, ad: x.ad, birim: x.birim, miktar, birimFiyat: fiyat })
  const sv = (gun: number, santiye: Santiye, ted: Cari | undefined, kalemler: ReturnType<typeof k>[], nakliye: number, hizmet: number, irs?: string): Sevkiyat => ({
    id: ornekId(),
    tarih: gunEkle(b, -gun),
    santiyeId: santiye.id,
    tedarikciId: ted?.id,
    irsaliyeNo: irs,
    kalemler,
    nakliye,
    hizmet,
    olusturma: o,
  })
  const sevkiyatlar = [
    sv(1, s1, ted1, [k(cimento, 120), k(kum, 18)], 2500, 1500, 'A-1042'),
    sv(3, s1, ted2, [k(beton, 42)], 0, 4000, 'HB-778'),
    sv(6, s2, ted1, [k(tugla, 4000), k(cimento, 60, 280)], 1800, 1200, 'A-1031'),
    sv(9, s1, ted1, [k(demir12, 3.2, 24200)], 3000, 2500, 'A-1019'),
    sv(14, s2, ted1, [k(kum, 12, 620), k(cimento, 40, 280)], 1500, 800),
    sv(40, s3, ted1, [k(kum, 8, 600), k(tugla, 1500, 7.1)], 1200, 900),
  ]

  const h = (gun: number, tur: Hareket['tur'], kategori: string, tutar: number, cari?: Cari, santiye?: Santiye, aciklama?: string): Hareket => ({
    id: ornekId(),
    tarih: gunEkle(b, -gun),
    tur,
    kategori,
    tutar,
    cariId: cari?.id,
    santiyeId: santiye?.id,
    aciklama,
    olusturma: o,
  })
  const hareketler = [
    h(2, 'gelir', 'Tahsilat', 150000, firma1, s1, 'Havale'),
    h(5, 'gider', 'Ödeme', 90000, ted1, undefined, 'Yapı market ödemesi'),
    h(4, 'gider', 'Yakıt', 4200, undefined, s1, 'Kamyon mazot'),
    h(8, 'gider', 'Nakliye', 3500, undefined, s2, 'Vinç kiralama'),
    h(12, 'gelir', 'Tahsilat', 40000, firma2, s2, 'Nakit'),
    h(10, 'gider', 'Kira', 12000, undefined, undefined, 'Depo kirası'),
  ]

  const v = (gun: number, yon: Vade['yon'], tutar: number, cari: Cari, santiye?: Santiye, aciklama?: string): Vade => ({
    id: ornekId(),
    vade: gunEkle(b, gun),
    yon,
    tutar,
    cariId: cari.id,
    santiyeId: santiye?.id,
    aciklama,
    durum: 'bekliyor',
    olusturma: o,
  })
  const vadeler = [
    v(3, 'tahsilat', 120000, firma1, s1, 'Çek'),
    v(10, 'tahsilat', 35000, firma2, s2),
    v(-2, 'odeme', 60000, ted2, undefined, 'Beton faturası'),
    v(6, 'odeme', 45000, ted1),
  ]

  const isci = (ad: string, gorev: string): Isci => ({ id: ornekId(), ad, gorev, aktif: true, olusturma: o })
  const i1 = isci('Usta 1', 'Şoför')
  const i2 = isci('Usta 2', 'Operatör')
  const a = (gun: number, kim: Isci, tutar: number, santiye?: Santiye): Avans => ({ id: ornekId(), isciId: kim.id, tarih: gunEkle(b, -gun), tutar, santiyeId: santiye?.id, olusturma: o })

  await db.transaction('rw', [db.cariler, db.santiyeler, db.malzemeler, db.sevkiyatlar, db.hareketler, db.vadeler, db.isciler, db.avanslar], async () => {
    await db.cariler.bulkAdd(cariler)
    await db.santiyeler.bulkAdd(santiyeler)
    await db.malzemeler.bulkAdd(malzemeler)
    await db.sevkiyatlar.bulkAdd(sevkiyatlar)
    await db.hareketler.bulkAdd(hareketler)
    await db.vadeler.bulkAdd(vadeler)
    await db.isciler.bulkAdd([i1, i2])
    await db.avanslar.bulkAdd([a(3, i1, 5000, s1), a(7, i2, 3000, s2), a(15, i1, 4000)])
  })
}

/* ---------- Örnek verileri bulma ve kaldırma ---------- */

// Eski sürümde "ornek-" öneki yoktu; o kayıtlar adlarından ve bağlılıklarından tanınır.
const ORNEK_CARILER = ['Örnek Yapı A.Ş.', 'Deneme İnşaat Ltd.', 'Merkez Yapı Market', 'Kuzey Hazır Beton']
const ORNEK_SANTIYELER = ['Çamlık Konutları B Blok', 'Sahil Sitesi Çevre Duvarı', 'Okul Bahçe Düzenlemesi']
const ORNEK_ISCILER: [string, string][] = [
  ['Usta 1', 'Şoför'],
  ['Usta 2', 'Operatör'],
]
// Gerçek kullanımda da olabilecek malzemeler yalnız örnekteki ad, birim ve fiyatla birebir aynıysa sayılır.
const ORNEK_MALZEMELER: [string, string, number][] = [
  ['Çimento 50 kg', 'torba', 285],
  ['İnşaat demiri Ø12', 'ton', 24500],
  ['Kum', 'm³', 650],
  ['Tuğla 13,5', 'adet', 7.4],
  ['Hazır beton C30', 'm³', 3150],
]

const onekli = (x: { id: string }) => x.id.startsWith('ornek-')

export interface OrnekKayitlar {
  cariler: string[]
  santiyeler: string[]
  malzemeler: string[]
  sevkiyatlar: string[]
  hareketler: string[]
  vadeler: string[]
  isciler: string[]
  avanslar: string[]
  silinenler: string[]
}

/* Cihazdaki örnek kayıtları bulur. Gerçek kayıtlara dokunmaz. */
export async function ornekKayitlariBul(): Promise<OrnekKayitlar & { toplam: number }> {
  const [cariler, santiyeler, malzemeler, sevkiyatlar, hareketler, vadeler, isciler, avanslar, silinenler] = await Promise.all([
    db.cariler.toArray(),
    db.santiyeler.toArray(),
    db.malzemeler.toArray(),
    db.sevkiyatlar.toArray(),
    db.hareketler.toArray(),
    db.vadeler.toArray(),
    db.isciler.toArray(),
    db.avanslar.toArray(),
    db.silinenler.toArray(),
  ])
  const cari = new Set(cariler.filter((c) => onekli(c) || ORNEK_CARILER.includes(c.ad)).map((c) => c.id))
  const santiye = new Set(santiyeler.filter((s) => onekli(s) || (ORNEK_SANTIYELER.includes(s.ad) && (!s.firmaId || cari.has(s.firmaId)))).map((s) => s.id))
  const isci = new Set(isciler.filter((i) => onekli(i) || ORNEK_ISCILER.some(([ad, gorev]) => i.ad === ad && i.gorev === gorev)).map((i) => i.id))

  const sevkiyatMi = (x: Sevkiyat) => onekli(x) || santiye.has(x.santiyeId)
  const hareketMi = (h: Hareket) =>
    onekli(h) ||
    (!!h.cariId && cari.has(h.cariId)) ||
    (!!h.santiyeId && santiye.has(h.santiyeId)) ||
    (h.kategori === 'Kira' && h.aciklama === 'Depo kirası' && h.tutar === 12000 && !h.cariId && !h.santiyeId)
  const vadeMi = (v: Vade) => onekli(v) || (!!v.cariId && cari.has(v.cariId)) || (!!v.santiyeId && santiye.has(v.santiyeId))
  const avansMi = (a: Avans) => onekli(a) || isci.has(a.isciId) || (!!a.santiyeId && santiye.has(a.santiyeId))

  const kalanSevkiyatlar = sevkiyatlar.filter((x) => !sevkiyatMi(x))
  const gercekteKullanilan = new Set(kalanSevkiyatlar.flatMap((x) => x.kalemler.map((k) => k.malzemeId)))
  const malzemeMi = (m: Malzeme) =>
    onekli(m) || (!gercekteKullanilan.has(m.id) && ORNEK_MALZEMELER.some(([ad, birim, fiyat]) => m.ad === ad && m.birim === birim && m.fiyat === fiyat))

  const tabloSecici: Record<string, (k: never) => boolean> = {
    cariler: (c: Cari) => cari.has(c.id),
    santiyeler: (s: Santiye) => santiye.has(s.id),
    isciler: (i: Isci) => isci.has(i.id),
    sevkiyatlar: sevkiyatMi,
    hareketler: hareketMi,
    vadeler: vadeMi,
    avanslar: avansMi,
    malzemeler: malzemeMi,
  }
  const sonuc: OrnekKayitlar = {
    cariler: [...cari],
    santiyeler: [...santiye],
    isciler: [...isci],
    sevkiyatlar: sevkiyatlar.filter(sevkiyatMi).map((x) => x.id),
    hareketler: hareketler.filter(hareketMi).map((x) => x.id),
    vadeler: vadeler.filter(vadeMi).map((x) => x.id),
    avanslar: avanslar.filter(avansMi).map((x) => x.id),
    malzemeler: malzemeler.filter(malzemeMi).map((x) => x.id),
    // Deneme sırasında silinip "Silinenler"e düşen örnek kayıtlar
    silinenler: silinenler.filter((s) => tabloSecici[s.tablo]?.(s.kayit as never)).map((s) => s.id),
  }
  const toplam = Object.values(sonuc).reduce((t, l) => t + l.length, 0)
  return { ...sonuc, toplam }
}

/* Örnek kayıtları kalıcı olarak kaldırır (Silinenler'e düşmez). Döner: kaldırılan kayıt sayısı. */
export async function ornekVerileriKaldir(): Promise<number> {
  const bulunan = await ornekKayitlariBul()
  const tablolar = ['cariler', 'santiyeler', 'malzemeler', 'sevkiyatlar', 'hareketler', 'vadeler', 'isciler', 'avanslar', 'silinenler'] as const
  await db.transaction('rw', [...tablolar.map((t) => db.table(t)), db.silmeler], async () => {
    for (const t of tablolar) await kaldir(t, bulunan[t])
  })
  return bulunan.toplam
}
