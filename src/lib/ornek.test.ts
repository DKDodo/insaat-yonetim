import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import { ornekKayitlariBul, ornekVerileriKaldir, ornekVeriYukle } from './ornek'

const o = '2026-10-27T00:00:00Z'

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

/* Gerçek kullanıcı kayıtları: hiçbiri silinmemeli */
async function gercekKayitlarEkle(kumAdi = 'Kum') {
  await db.cariler.add({ id: 'g-firma', ad: 'Yıldız İnşaat', tur: 'firma', olusturma: o })
  await db.santiyeler.add({ id: 'g-santiye', ad: 'Merkez Ofis Binası', firmaId: 'g-firma', durum: 'aktif', olusturma: o })
  // Örnekteki "Kum" ile aynı ad ama farklı fiyat: gerçek kayıt
  await db.malzemeler.add({ id: 'g-kum', ad: kumAdi, birim: 'm³', fiyat: 700, olusturma: o })
  await db.sevkiyatlar.add({ id: 'g-sevk', tarih: '2026-10-26', santiyeId: 'g-santiye', kalemler: [{ malzemeId: 'g-kum', ad: kumAdi, birim: 'm³', miktar: 5, birimFiyat: 700 }], nakliye: 0, hizmet: 0, olusturma: o })
  await db.hareketler.add({ id: 'g-hareket', tarih: '2026-10-26', tur: 'gider', kategori: 'Yakıt', tutar: 900, santiyeId: 'g-santiye', olusturma: o })
  await db.vadeler.add({ id: 'g-vade', vade: '2026-11-05', yon: 'tahsilat', tutar: 5000, cariId: 'g-firma', durum: 'bekliyor', olusturma: o })
  await db.isciler.add({ id: 'g-isci', ad: 'Ahmet Usta', aktif: true, olusturma: o })
  await db.avanslar.add({ id: 'g-avans', isciId: 'g-isci', tarih: '2026-10-26', tutar: 1000, olusturma: o })
}

async function sayilar() {
  return {
    cariler: await db.cariler.count(),
    santiyeler: await db.santiyeler.count(),
    malzemeler: await db.malzemeler.count(),
    sevkiyatlar: await db.sevkiyatlar.count(),
    hareketler: await db.hareketler.count(),
    vadeler: await db.vadeler.count(),
    isciler: await db.isciler.count(),
    avanslar: await db.avanslar.count(),
  }
}

describe('örnek verileri kaldırma', () => {
  it('yeni yüklenen örnekleri kaldırır, gerçek kayıtlara dokunmaz', async () => {
    // Gerçek kullanımdaki sıra: örnekler boş cihaza yüklenir, sonra gerçek kayıtlar girilir
    await ornekVeriYukle()
    const ornekOnce = await sayilar()
    await gercekKayitlarEkle('Dere kumu')
    const sonra = await sayilar()
    const once = Object.fromEntries(Object.entries(sonra).map(([k, v]) => [k, v - ornekOnce[k as keyof typeof ornekOnce]]))
    expect((await ornekKayitlariBul()).toplam).toBe(4 + 3 + 5 + 6 + 6 + 4 + 2 + 3)
    await ornekVerileriKaldir()
    expect(await sayilar()).toEqual(once)
    expect((await db.malzemeler.get('g-kum'))?.fiyat).toBe(700)
    expect((await ornekKayitlariBul()).toplam).toBe(0)
  })

  it('eski sürümden kalan öneksiz örnekleri adlarından tanır', async () => {
    await gercekKayitlarEkle()
    const once = await sayilar()
    // Eski sürümdeki gibi: kimlikler önceksiz
    await db.cariler.add({ id: 'e1', ad: 'Örnek Yapı A.Ş.', tur: 'firma', olusturma: o })
    await db.santiyeler.add({ id: 'e2', ad: 'Çamlık Konutları B Blok', firmaId: 'e1', durum: 'aktif', olusturma: o })
    await db.malzemeler.add({ id: 'e3', ad: 'Çimento 50 kg', birim: 'torba', fiyat: 285, olusturma: o })
    await db.sevkiyatlar.add({ id: 'e4', tarih: '2026-10-26', santiyeId: 'e2', kalemler: [{ malzemeId: 'e3', ad: 'Çimento 50 kg', birim: 'torba', miktar: 10, birimFiyat: 285 }], nakliye: 0, hizmet: 0, olusturma: o })
    await db.hareketler.add({ id: 'e5', tarih: '2026-10-20', tur: 'gider', kategori: 'Kira', tutar: 12000, aciklama: 'Depo kirası', olusturma: o })
    await db.vadeler.add({ id: 'e6', vade: '2026-11-01', yon: 'tahsilat', tutar: 120000, cariId: 'e1', durum: 'bekliyor', olusturma: o })
    await db.isciler.add({ id: 'e7', ad: 'Usta 1', gorev: 'Şoför', aktif: true, olusturma: o })
    await db.avanslar.add({ id: 'e8', isciId: 'e7', tarih: '2026-10-24', tutar: 5000, olusturma: o })
    // Denemede silinip Silinenler'e düşmüş bir örnek vade
    await db.silinenler.add({ id: 's1', tablo: 'vadeler', kayitId: 'e9', kayit: { id: 'e9', vade: '2026-11-02', yon: 'odeme', tutar: 1, cariId: 'e1', durum: 'bekliyor', olusturma: o }, silinme: o })

    const n = await ornekVerileriKaldir()
    expect(n).toBe(9)
    expect(await sayilar()).toEqual(once)
    expect(await db.silinenler.count()).toBe(0)
  })

  it('örnek malzeme gerçek bir sevkiyatta kullanılıyorsa katalogda kalır', async () => {
    await db.malzemeler.add({ id: 'e-kum', ad: 'Kum', birim: 'm³', fiyat: 650, olusturma: o })
    await db.santiyeler.add({ id: 'g-s', ad: 'Gerçek Şantiye', durum: 'aktif', olusturma: o })
    await db.sevkiyatlar.add({ id: 'g-x', tarih: '2026-10-26', santiyeId: 'g-s', kalemler: [{ malzemeId: 'e-kum', ad: 'Kum', birim: 'm³', miktar: 3, birimFiyat: 650 }], nakliye: 0, hizmet: 0, olusturma: o })
    expect((await ornekKayitlariBul()).malzemeler).toEqual([])
  })

  it('örnek yoksa hiçbir şey silinmez', async () => {
    await gercekKayitlarEkle()
    const once = await sayilar()
    expect(await ornekVerileriKaldir()).toBe(0)
    expect(await sayilar()).toEqual(once)
  })
})
