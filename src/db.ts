import Dexie, { type EntityTable } from 'dexie'

/* Veriler cihazda (IndexedDB) tutulur. Tarihler 'YYYY-AA-GG' metnidir, tutarlar TL'dir. */

export type CariTur = 'firma' | 'tedarikci' | 'diger'

export interface Cari {
  id: string
  ad: string
  tur: CariTur
  telefon?: string
  notlar?: string
  olusturma: string
}

export interface Santiye {
  id: string
  ad: string
  firmaId?: string
  adres?: string
  durum: 'aktif' | 'bitti'
  notlar?: string
  olusturma: string
}

export interface Malzeme {
  id: string
  ad: string
  birim: string
  fiyat: number
  olusturma: string
}

export interface Kalem {
  malzemeId: string
  ad: string
  birim: string
  miktar: number
  birimFiyat: number
}

/* Şantiyeye giden malzeme (irsaliye). Toplam = kalemler + nakliye + hizmet bedeli. */
export interface Sevkiyat {
  id: string
  tarih: string
  santiyeId: string
  tedarikciId?: string
  irsaliyeNo?: string
  kalemler: Kalem[]
  nakliye: number
  hizmet: number
  not?: string
  olusturma: string
}

export type OdemeSekli = 'nakit' | 'havale' | 'cek' | 'senet' | 'kart'

export const ODEME_SEKILLERI: Record<OdemeSekli, string> = {
  nakit: 'Nakit',
  havale: 'Havale / EFT',
  cek: 'Çek',
  senet: 'Senet',
  kart: 'Kredi kartı',
}

/* Çek ya da senet bilgisi (vade tarihi kaydın kendi tarihidir). */
export interface CekBilgisi {
  no?: string
  banka?: string
  sube?: string
  kesideci?: string
}

export type HareketTur = 'gelir' | 'gider'

/* Kasa / banka hareketi: tahsilat ve diğer gelirler, ödeme ve diğer giderler. */
export interface Hareket {
  id: string
  tarih: string
  tur: HareketTur
  kategori: string
  tutar: number
  cariId?: string
  santiyeId?: string
  aciklama?: string
  vadeId?: string
  odemeSekli?: OdemeSekli
  cek?: CekBilgisi
  olusturma: string
}

export type VadeYon = 'odeme' | 'tahsilat'

/* Planlanan (vadeli) ödeme ya da tahsilat. Tamamlanınca bir Hareket oluşur. */
export interface Vade {
  id: string
  vade: string
  yon: VadeYon
  tutar: number
  cariId?: string
  santiyeId?: string
  aciklama?: string
  durum: 'bekliyor' | 'tamam'
  tamamTarihi?: string
  odemeSekli?: OdemeSekli
  cek?: CekBilgisi
  olusturma: string
}

export interface Isci {
  id: string
  ad: string
  telefon?: string
  gorev?: string
  aktif: boolean
  olusturma: string
}

export interface Avans {
  id: string
  isciId: string
  tarih: string
  tutar: number
  santiyeId?: string
  aciklama?: string
  olusturma: string
}

/* Silinen kayıt: kalıcı silinmez, buradan geri alınabilir. */
export interface Silinen {
  id: string
  tablo: TabloAdi
  kayitId: string
  kayit: unknown
  silinme: string
}

/* Silinen kaydın izi (bulut eşitleme için). anahtar = tablo|id */
export interface Silme {
  anahtar: string
  tablo: (typeof YEDEK_TABLOLARI)[number]
  id: string
  _kirli?: number
}

export const db = new Dexie('insaat_yonetim') as Dexie & {
  cariler: EntityTable<Cari, 'id'>
  santiyeler: EntityTable<Santiye, 'id'>
  malzemeler: EntityTable<Malzeme, 'id'>
  sevkiyatlar: EntityTable<Sevkiyat, 'id'>
  hareketler: EntityTable<Hareket, 'id'>
  vadeler: EntityTable<Vade, 'id'>
  isciler: EntityTable<Isci, 'id'>
  avanslar: EntityTable<Avans, 'id'>
  silinenler: EntityTable<Silinen, 'id'>
  silmeler: EntityTable<Silme, 'anahtar'>
}

db.version(1).stores({
  cariler: 'id, ad, tur',
  santiyeler: 'id, ad, firmaId, durum',
  malzemeler: 'id, &ad',
  sevkiyatlar: 'id, tarih, santiyeId, tedarikciId',
  hareketler: 'id, tarih, tur, cariId, santiyeId, vadeId',
  vadeler: 'id, vade, yon, durum, cariId, santiyeId',
  isciler: 'id, ad, aktif',
  avanslar: 'id, tarih, isciId, santiyeId',
})

/* Sürüm 2: Silinenler (çöp kutusu). Mevcut veriler olduğu gibi kalır. */
db.version(2).stores({
  silinenler: 'id, tablo, kayitId, silinme',
})

/*
 * Sürüm 3: bulut eşitleme. Değişen kayıt "_kirli" damgası alır (gönderilecek);
 * "silmeler" silinen kaydın izidir, öbür cihazlara "silindi" olarak gider. Mevcut veriler olduğu gibi kalır.
 */
db.version(3).stores({
  cariler: 'id, ad, tur, _kirli',
  santiyeler: 'id, ad, firmaId, durum, _kirli',
  malzemeler: 'id, &ad, _kirli',
  sevkiyatlar: 'id, tarih, santiyeId, tedarikciId, _kirli',
  hareketler: 'id, tarih, tur, cariId, santiyeId, vadeId, _kirli',
  vadeler: 'id, vade, yon, durum, cariId, santiyeId, _kirli',
  isciler: 'id, ad, aktif, _kirli',
  avanslar: 'id, tarih, isciId, santiyeId, _kirli',
  silinenler: 'id, tablo, kayitId, silinme, _kirli',
  silmeler: 'anahtar, _kirli',
})

export const TABLOLAR = [
  'cariler',
  'santiyeler',
  'malzemeler',
  'sevkiyatlar',
  'hareketler',
  'vadeler',
  'isciler',
  'avanslar',
] as const

export type TabloAdi = (typeof TABLOLAR)[number]

/* Yedeğe giren her şey: veriler ve silinenler. */
export const YEDEK_TABLOLARI = [...TABLOLAR, 'silinenler'] as const

export const BIRIMLER = ['adet', 'ton', 'kg', 'm³', 'm²', 'm', 'torba', 'paket', 'litre', 'sefer', 'gün']

export const GIDER_KATEGORILERI = [
  'Malzeme',
  'Nakliye',
  'Yakıt',
  'İşçilik',
  'Maaş',
  'Kira',
  'Vergi / SGK',
  'Araç bakım',
  'Yemek',
  'Ödeme',
  'Diğer',
]

export const GELIR_KATEGORILERI = ['Tahsilat', 'Hizmet bedeli', 'Diğer']

export const CARI_TURLERI: Record<CariTur, string> = {
  firma: 'İnşaat firması',
  tedarikci: 'Tedarikçi',
  diger: 'Diğer',
}
