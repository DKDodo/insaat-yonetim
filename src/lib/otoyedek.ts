import { useEffect, useState } from 'react'
import { yedekAl } from './veri'

/*
 * Otomatik yedek.
 * Masaüstü sürümünde (İnşaat Takip.exe) her değişiklikten birkaç saniye sonra tüm veriler
 * Belgeler\İnşaat Takip Yedekleri klasörüne yazılır (günde bir dosya + son-yedek.json).
 * Tarayıcıda (iPhone, Mac) bu klasör yoktur; orada son elle alınan yedeğin tarihi izlenir.
 */

export interface YedekDurumu {
  masaustu: boolean
  klasor?: string
  sonYedek?: string
  sonHata?: string
  calisiyor: boolean
}

const SON_ANAHTAR = 'insaat-son-yedek'
const ELLE_ANAHTAR = 'insaat-son-elle-yedek'
let durum: YedekDurumu = { masaustu: false, calisiyor: false, sonYedek: oku(SON_ANAHTAR) }
const dinleyiciler = new Set<(d: YedekDurumu) => void>()
let zamanlayici: ReturnType<typeof setTimeout> | undefined
let hazir: Promise<void> | undefined

function oku(k: string): string | undefined {
  try {
    return localStorage.getItem(k) ?? undefined
  } catch {
    return undefined
  }
}
function yaz(k: string, v: string) {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* yoksay */
  }
}

function guncelle(d: Partial<YedekDurumu>) {
  durum = { ...durum, ...d }
  dinleyiciler.forEach((f) => f(durum))
}

export function yedekDurumu(): YedekDurumu {
  return durum
}

export function useYedekDurumu(): YedekDurumu {
  const [d, setD] = useState(durum)
  useEffect(() => {
    dinleyiciler.add(setD)
    return () => {
      dinleyiciler.delete(setD)
    }
  }, [])
  return d
}

/* Masaüstü başlatıcısı var mı? */
export function otoYedekBaslat(): Promise<void> {
  if (!hazir)
    hazir = (async () => {
      try {
        const r = await fetch('./api/durum', { cache: 'no-store' })
        if (!r.ok) return
        const j = (await r.json()) as { masaustu?: boolean; yedekKlasoru?: string }
        if (j.masaustu) {
          guncelle({ masaustu: true, klasor: j.yedekKlasoru })
          await simdiYedekle()
        }
      } catch {
        /* tarayıcı sürümü: masaüstü yedeği yok */
      }
    })()
  return hazir
}

export async function simdiYedekle(): Promise<boolean> {
  if (!durum.masaustu) return false
  guncelle({ calisiyor: true })
  try {
    const govde = JSON.stringify(await yedekAl())
    const r = await fetch('./api/yedek', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: govde })
    const j = (await r.json().catch(() => ({}))) as { tamam?: boolean; hata?: string }
    if (!r.ok || !j.tamam) throw new Error(j.hata || `Sunucu ${r.status}`)
    const t = new Date().toISOString()
    yaz(SON_ANAHTAR, t)
    guncelle({ sonYedek: t, sonHata: undefined, calisiyor: false })
    return true
  } catch (e) {
    guncelle({ sonHata: e instanceof Error ? e.message : String(e), calisiyor: false })
    return false
  }
}

/* Veri değişince çağrılır; art arda değişikliklerde tek yedek alınır. */
export function degisiklikOldu(): void {
  if (!durum.masaustu) return
  clearTimeout(zamanlayici)
  zamanlayici = setTimeout(() => void simdiYedekle(), 3000)
}

export function elleYedekAlindi(): void {
  yaz(ELLE_ANAHTAR, new Date().toISOString())
}

export function sonElleYedek(): string | undefined {
  return oku(ELLE_ANAHTAR)
}
