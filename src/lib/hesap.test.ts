import { describe, expect, it } from 'vitest'
import type { Avans, Cari, Hareket, Sevkiyat } from '../db'
import { gunFarki, sayiOku, yuvarla } from './format'
import { cariBakiye, malzemeOzetle, malzemeTutari, santiyeOzeti, satirTutari, sevkiyatToplami } from './hesap'

const o = '2026-10-27T00:00:00Z'

function sevk(id: string, santiyeId: string, kalemler: [string, number, number][], nakliye = 0, hizmet = 0, tedarikciId?: string): Sevkiyat {
  return {
    id,
    tarih: '2026-10-20',
    santiyeId,
    tedarikciId,
    kalemler: kalemler.map(([ad, miktar, birimFiyat]) => ({ malzemeId: ad, ad, birim: 'adet', miktar, birimFiyat })),
    nakliye,
    hizmet,
    olusturma: o,
  }
}

describe('sayiOku: kullanıcının yazdığı tutar', () => {
  it.each([
    ['1.250,50', 1250.5],
    ['2,5', 2.5],
    ['12.500', 12500],
    ['1.250.000', 1250000],
    ['2.5', 2.5],
    ['  3 ', 3],
    ['₺ 1.000,00', 1000],
    ['', 0],
  ])('%s → %d', (girdi, beklenen) => {
    expect(sayiOku(girdi)).toBe(beklenen)
  })
  it('sayı olmayan metin NaN döner (kayıt reddedilir)', () => {
    expect(Number.isNaN(sayiOku('abc'))).toBe(true)
    expect(Number.isNaN(sayiOku('1,2,3'))).toBe(true)
  })
})

describe('yuvarla: kuruş', () => {
  it.each([
    [1.005, 1.01],
    [2.675, 2.68],
    [0.1 + 0.2, 0.3],
    [-1.005, -1.01],
    [1234567.891, 1234567.89],
    [0, 0],
    [Number.NaN, 0],
  ])('%d → %d', (n, beklenen) => {
    expect(yuvarla(n)).toBe(beklenen)
  })
})

describe('satır ve sevkiyat tutarları', () => {
  it('her satır kuruşa yuvarlanır, toplam satırların toplamıdır', () => {
    expect(satirTutari({ miktar: 3.333, birimFiyat: 3 })).toBe(10)
    const s = sevk('s1', 'a', [
      ['Çimento', 120, 285],
      ['Kum', 18, 650],
      ['Demir', 3.2, 24200.55],
    ], 2500, 1500)
    expect(malzemeTutari(s)).toBe(34200 + 11700 + 77441.76)
    expect(sevkiyatToplami(s)).toBe(34200 + 11700 + 77441.76 + 2500 + 1500)
  })
  it('kayan nokta birikimi olmaz', () => {
    const kalemler: [string, number, number][] = Array.from({ length: 1000 }, (_, i) => [`m${i}`, 0.1, 0.7])
    expect(malzemeTutari(sevk('s', 'a', kalemler))).toBe(70)
  })
})

describe('şantiye özeti', () => {
  const sevkiyatlar = [sevk('1', 'A', [['Kum', 10, 100]], 50, 25), sevk('2', 'A', [['Kum', 5, 120]]), sevk('3', 'B', [['Taş', 1, 999]])]
  const hareketler: Hareket[] = [
    { id: 'h1', tarih: '2026-10-21', tur: 'gider', kategori: 'Yakıt', tutar: 300, santiyeId: 'A', olusturma: o },
    { id: 'h2', tarih: '2026-10-22', tur: 'gelir', kategori: 'Tahsilat', tutar: 1000, santiyeId: 'A', olusturma: o },
    { id: 'h3', tarih: '2026-10-22', tur: 'gider', kategori: 'Kira', tutar: 5000, olusturma: o },
  ]
  const avanslar: Avans[] = [{ id: 'a1', isciId: 'i', tarih: '2026-10-21', tutar: 200, santiyeId: 'A', olusturma: o }]

  it('yalnız o şantiyenin kayıtlarını toplar', () => {
    const z = santiyeOzeti('A', sevkiyatlar, hareketler, avanslar)
    expect(z.malzeme).toBe(1600)
    expect(z.nakliye).toBe(50)
    expect(z.hizmet).toBe(25)
    expect(z.sevkiyat).toBe(1675)
    expect(z.gider).toBe(300)
    expect(z.avans).toBe(200)
    expect(z.maliyet).toBe(2175)
    expect(z.tahsilat).toBe(1000)
    expect(z.kalan).toBe(675)
    expect(z.sevkiyatSayisi).toBe(2)
  })
  it('malzeme özeti miktar ve ortalama fiyatı doğru verir', () => {
    const m = malzemeOzetle(sevkiyatlar.filter((s) => s.santiyeId === 'A'))
    expect(m).toHaveLength(1)
    expect(m[0].miktar).toBe(15)
    expect(m[0].tutar).toBe(1600)
    expect(m[0].ortFiyat).toBe(106.67)
    expect(m[0].sefer).toBe(2)
  })
})

describe('cari bakiye', () => {
  const firma: Cari = { id: 'F', ad: 'Firma', tur: 'firma', olusturma: o }
  const ted: Cari = { id: 'T', ad: 'Tedarikçi', tur: 'tedarikci', olusturma: o }
  const santiyeFirma = new Map<string, string | undefined>([
    ['A', 'F'],
    ['B', undefined],
  ])
  const sevkiyatlar = [sevk('1', 'A', [['Kum', 10, 100]], 100, 50, 'T'), sevk('2', 'B', [['Taş', 2, 500]], 0, 0, 'T')]
  const hareketler: Hareket[] = [
    { id: 'h1', tarih: '2026-10-21', tur: 'gelir', kategori: 'Tahsilat', tutar: 700, cariId: 'F', olusturma: o },
    { id: 'h2', tarih: '2026-10-22', tur: 'gider', kategori: 'Ödeme', tutar: 1500, cariId: 'T', olusturma: o },
  ]
  it('firma: şantiyelerine giden her şey borcu, tahsilat düşer', () => {
    const b = cariBakiye(firma, santiyeFirma, sevkiyatlar, hareketler)
    expect(b.borc).toBe(1150)
    expect(b.alacak).toBe(700)
    expect(b.bakiye).toBe(450)
  })
  it('tedarikçi: alınan malzeme borcunuz, ödeme düşer', () => {
    const b = cariBakiye(ted, santiyeFirma, sevkiyatlar, hareketler)
    expect(b.alacak).toBe(2000)
    expect(b.borc).toBe(1500)
    expect(b.bakiye).toBe(-500)
  })
})

describe('tarih', () => {
  it('gün farkı yaz saatinden etkilenmez', () => {
    expect(gunFarki('2026-03-28', '2026-03-30')).toBe(2)
    expect(gunFarki('2026-10-24', '2026-10-26')).toBe(2)
  })
})
