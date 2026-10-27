import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import type { Table } from 'dexie'
import { useEffect, useState } from 'react'
import { db, YEDEK_TABLOLARI } from '../db'

/*
 * Bulut eşitleme (çevrimdışı öncelikli).
 *
 * - Asıl kopya cihazdadır; uygulama internetsiz de tam çalışır.
 * - Cihazda değişen her kayıt aynı işlemde "_kirli" damgası alır. Program çökse bile damga
 *   veritabanında kalır, bir sonraki eşitlemede gönderilir.
 * - Silinen kaydın izi "silmeler" tablosuna yazılır (yine aynı işlemde); buluta "silindi" olarak gider.
 *   Bulutta kalıcı silme yoktur; eski hâl değişiklik geçmişinde durur.
 * - Buluttan gelen kayıt cihazdaki gönderilmemiş değişikliğin üzerine yazılmaz.
 */

export const ESITLENEN = YEDEK_TABLOLARI
export type EsitlenenTablo = (typeof ESITLENEN)[number]
type Kayit = Record<string, unknown> & { id: string; _kirli?: number }

const IC_ALANLAR = ['_kirli', '_uzak', '_temizle']

/* ---------- damga ---------- */
let sayac = 0
function damga(): number {
  sayac = (sayac + 1) % 1000
  return Date.now() * 1000 + sayac
}

/* ---------- Dexie kancaları: her yerel yazma kaydı "gönderilecek" yapar ---------- */
let kancalarKuruldu = false
export function kancalariKur(): void {
  if (kancalarKuruldu) return
  kancalarKuruldu = true
  for (const ad of ESITLENEN) {
    const t = db.table(ad)
    t.hook('creating', (_anahtar, nesne: Kayit) => {
      if (nesne._uzak) delete nesne._uzak
      else nesne._kirli = damga()
    })
    t.hook('updating', (mods: object) => {
      const degisiklik = mods as Record<string, unknown>
      if ('_uzak' in degisiklik) return { _uzak: undefined }
      if ('_temizle' in degisiklik) return { _temizle: undefined }
      return { _kirli: damga() }
    })
  }
}

/* İç alanları atılmış, buluta gidecek hâl. */
export function temiz(k: Record<string, unknown>): Record<string, unknown> {
  const c: Record<string, unknown> = {}
  for (const [a, v] of Object.entries(k)) if (!IC_ALANLAR.includes(a) && v !== undefined) c[a] = v
  return c
}

/* Anahtar sırasından bağımsız derin eşitlik (Postgres jsonb anahtarları sıralar). */
export function ayniMi(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) {
    const bb = b as unknown[]
    return a.length === bb.length && a.every((x, i) => ayniMi(x, bb[i]))
  }
  const ao = a as Record<string, unknown>
  const bo = b as Record<string, unknown>
  const ak = Object.keys(ao).filter((k) => ao[k] !== undefined)
  const bk = Object.keys(bo).filter((k) => bo[k] !== undefined)
  return ak.length === bk.length && ak.every((k) => ayniMi(ao[k], bo[k]))
}

/*
 * Kayıt silme: her silme bu yoldan geçer. Çağıran işlem db.silmeler'i de kapsamalıdır.
 * Silinen her kaydın izi yazılır; bulut eşitlemesi açık değilse iz yalnız bekler (zararsız).
 */
export async function kaldir(tablo: EsitlenenTablo, idler: string[]): Promise<void> {
  if (!idler.length) return
  await db.table(tablo).bulkDelete(idler)
  const d = damga()
  await db.silmeler.bulkPut(idler.map((id) => ({ anahtar: `${tablo}|${id}`, tablo, id, _kirli: d })))
}

/* Tüm yerel kayıtları "gönderilecek" yap (ilk girişte: cihazdaki veriler buluta eklenir). */
export async function hepsiniGonderilecekYap(): Promise<number> {
  let n = 0
  await db.transaction('rw', ESITLENEN.map((t) => db.table(t)), async () => {
    for (const ad of ESITLENEN) n += await db.table(ad).toCollection().modify({ _kirli: damga() })
  })
  return n
}

export async function bekleyenSayisi(): Promise<number> {
  let n = 0
  for (const ad of ESITLENEN) n += await db.table(ad).where('_kirli').above(0).count()
  n += await db.silmeler.where('_kirli').above(0).count()
  return n
}

/* ---------- durum ---------- */
export type EsitlemeHali = 'kapali' | 'esitleniyor' | 'esit' | 'cevrimdisi' | 'hata' | 'yetkisiz'
export interface EsitlemeDurumu {
  hal: EsitlemeHali
  son?: string
  bekleyen: number
  hata?: string
}
let durum: EsitlemeDurumu = { hal: 'kapali', bekleyen: 0 }
const dinleyiciler = new Set<(d: EsitlemeDurumu) => void>()
function guncelle(d: Partial<EsitlemeDurumu>) {
  durum = { ...durum, ...d }
  dinleyiciler.forEach((f) => f(durum))
}
export function useEsitleme(): EsitlemeDurumu {
  const [d, setD] = useState(durum)
  useEffect(() => {
    dinleyiciler.add(setD)
    return () => void dinleyiciler.delete(setD)
  }, [])
  return d
}

/* ---------- ayarlar (cihazda) ---------- */
function oku(k: string): string | null {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
function yaz(k: string, v: string | null) {
  try {
    if (v === null) localStorage.removeItem(k)
    else localStorage.setItem(k, v)
  } catch {
    /* yoksay */
  }
}
const IMLEC = 'insaat-bulut-imlec'
function cihazKimligi(): string {
  let c = oku('insaat-cihaz')
  if (!c) {
    c = Math.random().toString(36).slice(2, 10)
    yaz('insaat-cihaz', c)
  }
  return c
}

/* ---------- gönder ---------- */
const PARCA = 500

async function gonder(b: SupabaseClient): Promise<void> {
  const cihaz = cihazKimligi()
  for (const ad of ESITLENEN) {
    const tablo = db.table(ad) as Table<Kayit, string>
    const kirli = await tablo.where('_kirli').above(0).toArray()
    for (let i = 0; i < kirli.length; i += PARCA) {
      const parca = kirli.slice(i, i + PARCA)
      const { error } = await b
        .from('kayitlar')
        .upsert(parca.map((k) => ({ tablo: ad, id: k.id, veri: temiz(k), silindi: false, cihaz })), { onConflict: 'tablo,id' })
      if (error) throw error
      // Gönderildikten sonra değişmediyse damgayı kaldır (arada değiştiyse bir sonrakinde yine gider).
      await db.transaction('rw', tablo, async () => {
        for (const k of parca) {
          const simdi = await tablo.get(k.id)
          if (simdi && simdi._kirli === k._kirli) await tablo.update(k.id, { _kirli: undefined, _temizle: 1 } as never)
        }
      })
    }
  }
  // Silinip sonra geri alınan kaydın izi gönderilmez (kayıt cihazda yeniden var).
  const tumIzler = await db.silmeler.where('_kirli').above(0).toArray()
  const izler = []
  for (const s of tumIzler) {
    if (await db.table(s.tablo).get(s.id)) await db.silmeler.delete(s.anahtar)
    else izler.push(s)
  }
  for (let i = 0; i < izler.length; i += PARCA) {
    const parca = izler.slice(i, i + PARCA)
    const { error } = await b
      .from('kayitlar')
      .upsert(parca.map((s) => ({ tablo: s.tablo, id: s.id, veri: {}, silindi: true, cihaz })), { onConflict: 'tablo,id' })
    if (error) throw error
    await db.transaction('rw', db.silmeler, async () => {
      for (const s of parca) {
        const simdi = await db.silmeler.get(s.anahtar)
        if (simdi && simdi._kirli === s._kirli) await db.silmeler.update(s.anahtar, { _kirli: undefined })
      }
    })
  }
}

/* ---------- al ---------- */
interface UzakSatir {
  tablo: string
  id: string
  veri: Record<string, unknown>
  silindi: boolean
  guncelleme: string
}

/* Buluttan gelen satırları cihaza uygular. Döner: değişen kayıt sayısı. Testlerde de kullanılır. */
export async function uzaktanUygula(satirlar: UzakSatir[]): Promise<number> {
  let degisen = 0
  const tablolar = [...ESITLENEN.map((t) => db.table(t)), db.silmeler]
  await db.transaction('rw', tablolar, async () => {
    for (const s of satirlar) {
      if (!(ESITLENEN as readonly string[]).includes(s.tablo)) continue
      const tablo = db.table(s.tablo) as Table<Kayit, string>
      const yerel = await tablo.get(s.id)
      if (yerel?._kirli) continue // cihazdaki gönderilmemiş değişiklik önceliklidir
      const iz = await db.silmeler.get(`${s.tablo}|${s.id}`)
      if (iz?._kirli) continue // cihazda silindi, henüz gönderilmedi
      if (s.silindi) {
        if (yerel) {
          await tablo.delete(s.id)
          degisen++
        }
        continue
      }
      if (!s.veri || typeof s.veri !== 'object' || s.veri.id !== s.id) continue
      if (yerel && ayniMi(temiz(yerel), s.veri)) continue
      await tablo.put({ ...s.veri, id: s.id, _uzak: 1 } as Kayit)
      if (iz) await db.silmeler.delete(iz.anahtar)
      degisen++
    }
  })
  return degisen
}

async function al(b: SupabaseClient): Promise<number> {
  let imlec = oku(IMLEC) ?? '1970-01-01T00:00:00Z'
  let toplam = 0
  for (;;) {
    // Aynı anda yazılan satırları kaçırmamak için 2 dakika geriden başla (tekrar gelenler zaten aynıysa atlanır).
    const baslangic = new Date(Date.parse(imlec) - 120_000).toISOString()
    const { data, error } = await b
      .from('kayitlar')
      .select('tablo,id,veri,silindi,guncelleme')
      .gt('guncelleme', baslangic)
      .order('guncelleme', { ascending: true })
      .limit(1000)
    if (error) throw error
    const satirlar = (data ?? []) as UzakSatir[]
    toplam += await uzaktanUygula(satirlar)
    if (satirlar.length) {
      const son = satirlar[satirlar.length - 1].guncelleme
      if (son === imlec && satirlar.length === 1000) throw new Error('Eşitleme imleci ilerlemiyor')
      imlec = son
      yaz(IMLEC, imlec)
    }
    if (satirlar.length < 1000) break
  }
  return toplam
}

/* ---------- döngü ---------- */
let istemci: SupabaseClient | null = null
let kanal: RealtimeChannel | null = null
let zamanlayici: ReturnType<typeof setTimeout> | undefined
let aralik: ReturnType<typeof setInterval> | undefined
let calisiyor = false
let tekrar = false

export async function esitle(): Promise<void> {
  const b = istemci
  if (!b) return
  if (calisiyor) {
    tekrar = true
    return
  }
  calisiyor = true
  guncelle({ hal: 'esitleniyor' })
  try {
    await al(b)
    await gonder(b)
    guncelle({ hal: 'esit', son: new Date().toISOString(), hata: undefined, bekleyen: await bekleyenSayisi() })
  } catch (e) {
    const m = e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e)
    const cevrimdisi = !navigator.onLine || /fetch|network|load failed/i.test(m)
    const yetkisiz = /row-level security|42501|permission denied/i.test(m)
    guncelle({ hal: yetkisiz ? 'yetkisiz' : cevrimdisi ? 'cevrimdisi' : 'hata', hata: m, bekleyen: await bekleyenSayisi() })
  } finally {
    calisiyor = false
    if (tekrar) {
      tekrar = false
      esitlemeIste(500)
    }
  }
}

/* Değişiklikten sonra kısa bir bekleyişle eşitle (art arda değişikliklerde tek eşitleme). */
export function esitlemeIste(ms = 1500): void {
  if (!istemci) return
  clearTimeout(zamanlayici)
  zamanlayici = setTimeout(() => void esitle(), ms)
}

const cevrimici = () => esitlemeIste(300)
const gorunur = () => document.visibilityState === 'visible' && esitlemeIste(300)

/* Giriş yapılınca başlat. Bu kullanıcıyla bu cihazda ilk kez başlıyorsa cihazdaki kayıtlar buluta eklenir. */
export async function esitlemeBaslat(b: SupabaseClient, kullaniciId: string): Promise<void> {
  if (istemci === b) return
  esitlemeDurdur()
  istemci = b
  const ilk = `insaat-bulut-ilk-${kullaniciId}`
  if (!oku(ilk)) {
    await hepsiniGonderilecekYap()
    yaz(ilk, new Date().toISOString())
  }
  guncelle({ bekleyen: await bekleyenSayisi() })
  window.addEventListener('online', cevrimici)
  document.addEventListener('visibilitychange', gorunur)
  aralik = setInterval(() => void esitle(), 60_000)
  // Başka cihazda değişiklik olunca bulut haber verir: anında al.
  kanal = b
    .channel('kayitlar-degisti')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'kayitlar' }, () => esitlemeIste(400))
    .subscribe()
  await esitle()
}

export function esitlemeDurdur(): void {
  clearTimeout(zamanlayici)
  clearInterval(aralik)
  window.removeEventListener('online', cevrimici)
  document.removeEventListener('visibilitychange', gorunur)
  if (kanal && istemci) void istemci.removeChannel(kanal)
  kanal = null
  istemci = null
  guncelle({ hal: 'kapali' })
}

/* Cihazdaki kopyayı sıfırlayıp buluttan baştan indirir (bulut verisine dokunmaz). */
export async function buluttanYenidenIndir(): Promise<void> {
  if (!istemci) throw new Error('Bulut bağlı değil.')
  if ((await bekleyenSayisi()) > 0) await esitle()
  if ((await bekleyenSayisi()) > 0) throw new Error('Gönderilmemiş değişiklikler var; önce internete bağlanın.')
  await db.transaction('rw', [...ESITLENEN.map((t) => db.table(t)), db.silmeler], async () => {
    for (const t of ESITLENEN) await db.table(t).clear()
    await db.silmeler.clear()
  })
  yaz(IMLEC, null)
  await esitle()
}

