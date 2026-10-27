import type { Avans, Cari, Hareket, Kalem, Sevkiyat } from '../db'
import { yuvarla } from './format'

/* Faturadaki gibi: her satır kuruşa yuvarlanır, toplam satırlardan oluşur. */
export function satirTutari(k: Pick<Kalem, 'miktar' | 'birimFiyat'>): number {
  return yuvarla(k.miktar * k.birimFiyat)
}

export function malzemeTutari(s: Sevkiyat): number {
  return yuvarla(s.kalemler.reduce((t, k) => t + satirTutari(k), 0))
}

export function sevkiyatToplami(s: Sevkiyat): number {
  return yuvarla(malzemeTutari(s) + (s.nakliye || 0) + (s.hizmet || 0))
}

export interface SantiyeOzeti {
  malzeme: number
  nakliye: number
  hizmet: number
  sevkiyat: number
  gider: number
  avans: number
  maliyet: number
  tahsilat: number
  kalan: number
  sevkiyatSayisi: number
  sonSevkiyat?: string
}

/* Bir şantiyenin özeti: giden malzeme, nakliye, hizmet, diğer giderler, avanslar ve tahsilat. */
export function santiyeOzeti(
  santiyeId: string,
  sevkiyatlar: Sevkiyat[],
  hareketler: Hareket[],
  avanslar: Avans[],
): SantiyeOzeti {
  const sv = sevkiyatlar.filter((s) => s.santiyeId === santiyeId)
  const malzeme = sv.reduce((t, s) => t + malzemeTutari(s), 0)
  const nakliye = sv.reduce((t, s) => t + (s.nakliye || 0), 0)
  const hizmet = sv.reduce((t, s) => t + (s.hizmet || 0), 0)
  const gider = hareketler.filter((h) => h.santiyeId === santiyeId && h.tur === 'gider').reduce((t, h) => t + h.tutar, 0)
  const tahsilat = hareketler
    .filter((h) => h.santiyeId === santiyeId && h.tur === 'gelir')
    .reduce((t, h) => t + h.tutar, 0)
  const avans = avanslar.filter((a) => a.santiyeId === santiyeId).reduce((t, a) => t + a.tutar, 0)
  const sevkiyat = malzeme + nakliye + hizmet
  const maliyet = sevkiyat + gider + avans
  const son = sv.map((s) => s.tarih).sort().at(-1)
  return {
    malzeme: yuvarla(malzeme),
    nakliye: yuvarla(nakliye),
    hizmet: yuvarla(hizmet),
    sevkiyat: yuvarla(sevkiyat),
    gider: yuvarla(gider),
    avans: yuvarla(avans),
    maliyet: yuvarla(maliyet),
    tahsilat: yuvarla(tahsilat),
    kalan: yuvarla(sevkiyat - tahsilat),
    sevkiyatSayisi: sv.length,
    sonSevkiyat: son,
  }
}

export interface MalzemeOzeti {
  /* malzeme + birim; kalemleri bu özete bağlamak için */
  anahtar: string
  ad: string
  birim: string
  miktar: number
  tutar: number
  ortFiyat: number
  sefer: number
}

/* Kalemleri malzeme ve birime göre toplar: ne kadar gitmiş, kaça gitmiş. */
export function kalemAnahtari(k: { malzemeId: string; ad: string; birim: string }): string {
  return (k.malzemeId || k.ad) + '|' + k.birim
}

export function malzemeOzetle(sevkiyatlar: Sevkiyat[]): MalzemeOzeti[] {
  const m = new Map<string, MalzemeOzeti>()
  for (const s of sevkiyatlar) {
    for (const k of s.kalemler) {
      const anahtar = kalemAnahtari(k)
      const o = m.get(anahtar) ?? { anahtar, ad: k.ad, birim: k.birim, miktar: 0, tutar: 0, ortFiyat: 0, sefer: 0 }
      o.miktar += k.miktar
      o.tutar += satirTutari(k)
      o.sefer += 1
      m.set(anahtar, o)
    }
  }
  return [...m.values()]
    .map((o) => ({ ...o, tutar: yuvarla(o.tutar), ortFiyat: o.miktar ? yuvarla(o.tutar / o.miktar) : 0 }))
    .sort((a, b) => b.tutar - a.tutar)
}

export interface CariBakiye {
  /* Pozitif: cari size borçlu. Negatif: siz cariye borçlusunuz. */
  bakiye: number
  borc: number
  alacak: number
}

/*
 * İnşaat firması: şantiyelerine giden her şey firmanın borcudur, tahsilatlar düşer.
 * Tedarikçi: ondan alınan malzeme sizin borcunuzdur, yapılan ödemeler düşer.
 * Diğer: gelir ve gider hareketlerinin farkı.
 */
export function cariBakiye(
  cari: Cari,
  santiyeFirma: Map<string, string | undefined>,
  sevkiyatlar: Sevkiyat[],
  hareketler: Hareket[],
): CariBakiye {
  const gelen = hareketler.filter((h) => h.cariId === cari.id && h.tur === 'gelir').reduce((t, h) => t + h.tutar, 0)
  const giden = hareketler.filter((h) => h.cariId === cari.id && h.tur === 'gider').reduce((t, h) => t + h.tutar, 0)
  if (cari.tur === 'firma') {
    const borc = sevkiyatlar
      .filter((s) => santiyeFirma.get(s.santiyeId) === cari.id)
      .reduce((t, s) => t + sevkiyatToplami(s), 0)
    return { borc: yuvarla(borc + giden), alacak: yuvarla(gelen), bakiye: yuvarla(borc + giden - gelen) }
  }
  if (cari.tur === 'tedarikci') {
    const alinan = sevkiyatlar.filter((s) => s.tedarikciId === cari.id).reduce((t, s) => t + malzemeTutari(s), 0)
    return { borc: yuvarla(giden + gelen), alacak: yuvarla(alinan), bakiye: yuvarla(giden - alinan - gelen) }
  }
  return { borc: yuvarla(giden), alacak: yuvarla(gelen), bakiye: yuvarla(giden - gelen) }
}

export function toplam<T>(liste: T[], f: (x: T) => number): number {
  return yuvarla(liste.reduce((t, x) => t + f(x), 0))
}
