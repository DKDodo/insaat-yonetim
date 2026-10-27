import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { BULUT_ADRESI, BULUT_ANAHTARI, bulutHazir } from './bulutAyar'

/* Supabase istemcisi ve oturum. Oturum cihazda saklanır; internet yokken de açık kalır. */

let istemci: SupabaseClient | null = null

export function bulut(): SupabaseClient | null {
  if (!bulutHazir()) return null
  if (!istemci)
    istemci = createClient(BULUT_ADRESI, BULUT_ANAHTARI, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'insaat-takip-oturum',
      },
    })
  return istemci
}

/* Girişten dönülen adres: sorgu ve # kısmı olmadan bu sayfa. */
function donusAdresi(): string {
  return location.origin + location.pathname
}

export async function googleIleGiris(): Promise<void> {
  const b = bulut()
  if (!b) throw new Error('Bulut bağlantısı ayarlanmamış.')
  const { error } = await b.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: donusAdresi(), queryParams: { prompt: 'select_account' } },
  })
  if (error) throw new Error(turkceHata(error.message))
}

export async function sifreyleGiris(eposta: string, sifre: string): Promise<void> {
  const b = bulut()
  if (!b) throw new Error('Bulut bağlantısı ayarlanmamış.')
  const { error } = await b.auth.signInWithPassword({ email: eposta.trim().toLowerCase(), password: sifre })
  if (error) throw new Error(turkceHata(error.message))
}

/* Google ile giriş yaptıktan sonra e-posta ile de girebilmek için şifre belirleme. */
export async function sifreBelirle(sifre: string): Promise<void> {
  const b = bulut()
  if (!b) throw new Error('Bulut bağlantısı ayarlanmamış.')
  if (sifre.length < 10) throw new Error('Şifre en az 10 karakter olmalı.')
  const { error } = await b.auth.updateUser({ password: sifre })
  if (error) throw new Error(turkceHata(error.message))
}

export async function cikis(): Promise<void> {
  await bulut()?.auth.signOut()
}

/* Giriş yapan hesap izinli listede mi? (Veritabanı kuralları zaten engeller; bu, kullanıcıya açık mesaj içindir.) */
export async function izinliMi(): Promise<boolean | null> {
  const b = bulut()
  if (!b) return null
  const { data, error } = await b.rpc('izinli_mi')
  if (error) return null // çevrimdışı ya da geçici hata: bilinmiyor
  return data === true
}

function turkceHata(m: string): string {
  if (/invalid login credentials/i.test(m)) return 'E-posta ya da şifre hatalı.'
  if (/email not confirmed/i.test(m)) return 'E-posta adresi henüz doğrulanmamış.'
  if (/failed to fetch|network/i.test(m)) return 'İnternet bağlantısı yok.'
  if (/password should be/i.test(m)) return 'Şifre yeterince güçlü değil.'
  if (/same.*password|different from the old/i.test(m)) return 'Yeni şifre eskisiyle aynı olamaz.'
  return m
}

export interface OturumDurumu {
  hazir: boolean
  oturum: Session | null
}

export function useOturum(): OturumDurumu {
  const [d, setD] = useState<OturumDurumu>({ hazir: !bulutHazir(), oturum: null })
  useEffect(() => {
    const b = bulut()
    if (!b) return
    let canli = true
    b.auth.getSession().then(({ data }) => {
      if (!canli) return
      setD({ hazir: true, oturum: data.session })
      // Girişten dönüşte adres çubuğundaki ?code=... kısmını temizle.
      if (location.search.includes('code=')) history.replaceState(null, '', location.pathname + location.hash)
    })
    const { data } = b.auth.onAuthStateChange((_olay, oturum) => {
      if (canli) setD({ hazir: true, oturum })
    })
    return () => {
      canli = false
      data.subscription.unsubscribe()
    }
  }, [])
  return d
}
