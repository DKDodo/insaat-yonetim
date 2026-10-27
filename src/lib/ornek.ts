import { db, type Avans, type Cari, type Hareket, type Isci, type Malzeme, type Santiye, type Sevkiyat, type Vade } from '../db'
import { bugun, gunEkle, simdi, yeniId } from './format'

/* Uygulamayı denemek için kurgusal örnek veri. Gerçek kişi ya da firma değildir. */
export async function ornekVeriYukle(): Promise<void> {
  const b = bugun()
  const o = simdi()
  const c = (ad: string, tur: Cari['tur']): Cari => ({ id: yeniId(), ad, tur, olusturma: o })
  const firma1 = c('Örnek Yapı A.Ş.', 'firma')
  const firma2 = c('Deneme İnşaat Ltd.', 'firma')
  const ted1 = c('Merkez Yapı Market', 'tedarikci')
  const ted2 = c('Kuzey Hazır Beton', 'tedarikci')
  const cariler = [firma1, firma2, ted1, ted2]

  const s1: Santiye = { id: yeniId(), ad: 'Çamlık Konutları B Blok', firmaId: firma1.id, adres: 'Çamlık Mah.', durum: 'aktif', olusturma: o }
  const s2: Santiye = { id: yeniId(), ad: 'Sahil Sitesi Çevre Duvarı', firmaId: firma2.id, durum: 'aktif', olusturma: o }
  const s3: Santiye = { id: yeniId(), ad: 'Okul Bahçe Düzenlemesi', firmaId: firma1.id, durum: 'bitti', olusturma: o }
  const santiyeler = [s1, s2, s3]

  const m = (ad: string, birim: string, fiyat: number): Malzeme => ({ id: yeniId(), ad, birim, fiyat, olusturma: o })
  const cimento = m('Çimento 50 kg', 'torba', 285)
  const demir12 = m('İnşaat demiri Ø12', 'ton', 24500)
  const kum = m('Kum', 'm³', 650)
  const tugla = m('Tuğla 13,5', 'adet', 7.4)
  const beton = m('Hazır beton C30', 'm³', 3150)
  const malzemeler = [cimento, demir12, kum, tugla, beton]

  const k = (x: Malzeme, miktar: number, fiyat = x.fiyat) => ({ malzemeId: x.id, ad: x.ad, birim: x.birim, miktar, birimFiyat: fiyat })
  const sv = (gun: number, santiye: Santiye, ted: Cari | undefined, kalemler: ReturnType<typeof k>[], nakliye: number, hizmet: number, irs?: string): Sevkiyat => ({
    id: yeniId(),
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
    id: yeniId(),
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
    id: yeniId(),
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

  const isci = (ad: string, gorev: string): Isci => ({ id: yeniId(), ad, gorev, aktif: true, olusturma: o })
  const i1 = isci('Usta 1', 'Şoför')
  const i2 = isci('Usta 2', 'Operatör')
  const a = (gun: number, kim: Isci, tutar: number, santiye?: Santiye): Avans => ({ id: yeniId(), isciId: kim.id, tarih: gunEkle(b, -gun), tutar, santiyeId: santiye?.id, olusturma: o })

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
