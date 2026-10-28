import { LogOut, ShieldAlert } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Dugme, Etiket, Girdi, Kart } from '../components/ui'
import { cikis, googleIleGiris, sifreyleGiris } from '../lib/bulut'
import { GOOGLE_GIRISI } from '../lib/bulutAyar'

function Cerceve({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-stone-100 px-4 py-10 dark:bg-stone-950">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-20 rounded-[22%] shadow-lg" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-stone-900 dark:text-white">İnşaat Takip</h1>
          <div className="font-imza mt-1 text-[22px] text-amber-700 dark:text-amber-400">Çağatay Kurtuluş</div>
        </div>
        {children}
      </div>
    </div>
  )
}

function GoogleSimgesi() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

export default function Giris() {
  const [eposta, setEposta] = useState('')
  const [sifre, setSifre] = useState('')
  const [hata, setHata] = useState('')
  const [bekle, setBekle] = useState(false)
  const [sifreAcik, setSifreAcik] = useState(!GOOGLE_GIRISI)

  const google = async () => {
    setHata('')
    setBekle(true)
    try {
      await googleIleGiris()
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e))
      setBekle(false)
    }
  }
  const sifreyle = async (e: FormEvent) => {
    e.preventDefault()
    setHata('')
    if (!eposta.trim() || !sifre) return setHata('E-posta ve şifreyi yazın.')
    setBekle(true)
    try {
      await sifreyleGiris(eposta, sifre)
    } catch (err) {
      setHata(err instanceof Error ? err.message : String(err))
    } finally {
      setBekle(false)
    }
  }

  return (
    <Cerceve>
      <Kart className="p-5">
        {GOOGLE_GIRISI && (
          <Dugme className="w-full" onClick={google} disabled={bekle}>
            <GoogleSimgesi /> Google ile giriş yap
          </Dugme>
        )}
        {!sifreAcik ? (
          <button type="button" className="mt-4 w-full text-center text-sm text-stone-500 hover:text-stone-800 dark:hover:text-stone-200" onClick={() => setSifreAcik(true)}>
            E-posta ve şifre ile giriş
          </button>
        ) : (
          <form onSubmit={sifreyle} className={GOOGLE_GIRISI ? 'mt-5 grid gap-3 border-t border-stone-200 pt-5 dark:border-stone-800' : 'grid gap-3'}>
            <Etiket etiket="E-posta">
              <Girdi type="email" autoComplete="username" value={eposta} onChange={(e) => setEposta(e.target.value)} />
            </Etiket>
            <Etiket etiket="Şifre" ipucu={GOOGLE_GIRISI ? "Şifreyi Google ile girdikten sonra Ayarlar'dan belirleyebilirsiniz." : undefined}>
              <Girdi type="password" autoComplete="current-password" value={sifre} onChange={(e) => setSifre(e.target.value)} />
            </Etiket>
            <Dugme tur="ana" type="submit" disabled={bekle}>
              Giriş yap
            </Dugme>
          </form>
        )}
        {hata && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{hata}</p>}
      </Kart>
      <p className="mt-4 text-center text-xs text-stone-500">Verileriniz şifreli bağlantıyla bulutta saklanır ve yalnız sizin hesabınızla açılır.</p>
    </Cerceve>
  )
}

export function Yetkisiz({ eposta }: { eposta?: string }) {
  return (
    <Cerceve>
      <Kart className="p-5 text-center">
        <ShieldAlert size={36} className="mx-auto text-red-500" />
        <h2 className="mt-3 font-semibold text-stone-900 dark:text-white">Bu hesabın erişim izni yok</h2>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          <b>{eposta}</b> ile giriş yapıldı, ama bu adres izinli listede değil. İzinli hesapla yeniden deneyin.
        </p>
        <Dugme className="mt-4 w-full" onClick={() => void cikis()}>
          <LogOut size={17} /> Çıkış yap ve başka hesap seç
        </Dugme>
      </Kart>
    </Cerceve>
  )
}
