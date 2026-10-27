import {
  ArrowLeft,
  BarChart3,
  Building2,
  CalendarClock,
  HardHat,
  LayoutDashboard,
  Lightbulb,
  LightbulbOff,
  Menu,
  Package,
  Plus,
  Settings,
  Share,
  Smartphone,
  Trash2,
  Truck,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { bulutHazir } from '../lib/bulutAyar'
import { useEsitleme } from '../lib/esitleme'
import { useTema } from '../lib/tema'
import { iosMu, uygulamaOlarakAcik } from '../lib/yayin'
import { TelefonaGec } from './TelefonaGec'
import { cx } from './ui'

export const MENU = [
  { yol: '/', ad: 'Pano', simge: LayoutDashboard },
  { yol: '/gonder', ad: 'Malzeme Gönder', simge: Plus, ana: true },
  { yol: '/sevkiyatlar', ad: 'Giden Malzemeler', simge: Truck },
  { yol: '/santiyeler', ad: 'Şantiyeler', simge: Building2 },
  { yol: '/malzemeler', ad: 'Malzemeler', simge: Package },
  { yol: '/cariler', ad: 'Cari Hesaplar', simge: Users },
  { yol: '/kasa', ad: 'Gelir / Gider', simge: Wallet },
  { yol: '/vadeler', ad: 'Ödeme ve Tahsilat', simge: CalendarClock },
  { yol: '/isciler', ad: 'İşçiler ve Avans', simge: HardHat },
  { yol: '/raporlar', ad: 'Raporlar', simge: BarChart3 },
  { yol: '/silinenler', ad: 'Silinenler', simge: Trash2 },
  { yol: '/ayarlar', ad: 'Ayarlar ve Yedek', simge: Settings },
]

const ALT = ['/', '/santiyeler', '/gonder', '/vadeler']

function aktifMi(yol: string, konum: string) {
  return yol === '/' ? konum === '/' : konum === yol || konum.startsWith(yol + '/')
}

export function Kabuk({ children }: { children: ReactNode }) {
  const konum = useLocation().pathname
  const git = useNavigate()
  const [menuAcik, setMenuAcik] = useState(false)
  const [telefon, setTelefon] = useState(false)
  useEffect(() => {
    setMenuAcik(false)
    window.scrollTo(0, 0)
  }, [konum])

  return (
    <div className="min-h-dvh bg-stone-100 text-stone-800 dark:bg-stone-950 dark:text-stone-200">
      {/* Bilgisayar: sol menü */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-stone-200 bg-white px-3 py-5 dark:border-stone-800 dark:bg-stone-900 md:flex print:hidden">
        <Logo />
        <nav className="mt-6 flex flex-1 flex-col gap-0.5 overflow-y-auto">
          {MENU.map((m) =>
            m.ana ? (
              <button
                key={m.yol}
                type="button"
                onClick={() => git('/gonder')}
                className="mb-3 flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 font-semibold text-stone-950 shadow-sm hover:bg-amber-400"
              >
                <Plus size={20} strokeWidth={2.5} /> Malzeme Gönder
              </button>
            ) : (
              <NavLink
                key={m.yol}
                to={m.yol}
                end={m.yol === '/'}
                className={({ isActive }) =>
                  cx(
                    'flex h-10 items-center gap-3 rounded-xl px-3 text-[14.5px] font-medium transition',
                    isActive
                      ? 'bg-stone-100 text-stone-950 dark:bg-stone-800 dark:text-white'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800/60',
                  )
                }
              >
                <m.simge size={18} />
                {m.ad}
              </NavLink>
            ),
          )}
        </nav>
        <button
          type="button"
          onClick={() => setTelefon(true)}
          className="mb-2 flex h-10 items-center gap-3 rounded-xl px-3 text-[14.5px] font-medium text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50 hover:text-stone-900 dark:text-stone-300 dark:ring-stone-700 dark:hover:bg-stone-800/60"
        >
          <Smartphone size={18} /> Telefondan devam et
        </button>
        <BulutDurumu />
      </aside>

      {/* Telefon: üst çubuk */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200/70 bg-stone-100/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/85 md:hidden print:hidden">
        <div className="flex h-[60px] min-w-0 items-center">
          <Logo kucuk />
        </div>
        <div className="flex items-center gap-2">
          <GeriDugmesi kucuk />
          <TemaDugmesi />
        </div>
      </header>

      {/* Bilgisayar: solda geri, sağda tema düğmesi */}
      <div className="sticky top-0 z-20 hidden items-center justify-between bg-stone-100/80 px-8 py-3 backdrop-blur-md md:ml-64 md:flex dark:bg-stone-950/80 print:hidden">
        <GeriDugmesi />
        <TemaDugmesi />
      </div>

      <main className="mx-auto max-w-6xl px-4 pt-5 pb-[calc(110px+env(safe-area-inset-bottom))] md:ml-64 md:px-8 md:pt-0 md:pb-12 print:m-0 print:p-0">
        <AnaEkranaEkleIpucu />
        {children}
      </main>

      {/* Telefon: alt sekme çubuğu */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-stone-800 dark:bg-stone-900/90 md:hidden print:hidden">
        <div className="grid h-16 grid-cols-5">
          {ALT.slice(0, 2).map((y) => (
            <AltSekme key={y} yol={y} aktif={aktifMi(y, konum)} />
          ))}
          <div className="grid place-items-center">
            <button
              type="button"
              onClick={() => git('/gonder')}
              aria-label="Malzeme gönder"
              className={cx(
                'grid size-14 -translate-y-3 place-items-center rounded-2xl bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/30 active:scale-95',
                konum === '/gonder' && 'ring-4 ring-amber-500/25',
              )}
            >
              <Plus size={28} strokeWidth={2.5} />
            </button>
          </div>
          <AltSekme yol="/vadeler" aktif={aktifMi('/vadeler', konum)} />
          <button type="button" onClick={() => setMenuAcik(true)} className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-stone-500">
            <Menu size={22} />
            Menü
          </button>
        </div>
      </nav>

      {menuAcik && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menü">
          <div className="absolute inset-0 bg-stone-950/40" onClick={() => setMenuAcik(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))] dark:bg-stone-900">
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-lg font-semibold">Menü</span>
              <button type="button" onClick={() => setMenuAcik(false)} className="grid size-9 place-items-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-800" aria-label="Kapat">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MENU.filter((m) => !m.ana).map((m) => (
                <NavLink
                  key={m.yol}
                  to={m.yol}
                  end={m.yol === '/'}
                  className={({ isActive }) =>
                    cx(
                      'flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-center text-[12.5px] font-medium',
                      isActive ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-stone-50 text-stone-700 dark:bg-stone-800 dark:text-stone-200',
                    )
                  }
                >
                  <m.simge size={22} />
                  {m.ad}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
      <TelefonaGec acik={telefon} kapat={() => setTelefon(false)} />
    </div>
  )
}

function AltSekme({ yol, aktif }: { yol: string; aktif: boolean }) {
  const m = MENU.find((x) => x.yol === yol)!
  const kisa: Record<string, string> = { '/': 'Pano', '/santiyeler': 'Şantiyeler', '/vadeler': 'Vadeler' }
  return (
    <NavLink to={yol} end={yol === '/'} className={cx('flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium', aktif ? 'text-amber-600 dark:text-amber-400' : 'text-stone-500')}>
      <m.simge size={22} />
      {kisa[yol] ?? m.ad}
    </NavLink>
  )
}

function Logo({ kucuk }: { kucuk?: boolean }) {
  if (kucuk)
    return (
      <div className="flex items-center gap-2.5">
        <BaretLogo className="size-9" />
        <div className="leading-none">
          <div className="text-[15px] font-semibold tracking-tight text-stone-900 dark:text-white">İnşaat Takip</div>
          <Imza kucuk />
        </div>
      </div>
    )
  return (
    <div className="px-2">
      <div className="flex items-center gap-2.5">
        <BaretLogo className="size-10" />
        <div className="leading-tight">
          <div className="font-semibold tracking-tight text-stone-900 dark:text-white">İnşaat Takip</div>
          <div className="text-xs text-stone-500">Malzeme · Maliyet · Cari</div>
        </div>
      </div>
      <Imza />
    </div>
  )
}

/* Kişiye özel imza etiketi: el yazısı ad ve altında ince bir kalem çizgisi. */
function Imza({ kucuk }: { kucuk?: boolean }) {
  if (kucuk)
    return (
      <div className="font-imza -mt-0.5 text-[17px] leading-tight text-amber-700 dark:text-amber-400" title="Çağatay Kurtuluş için hazırlandı">
        Çağatay Kurtuluş
      </div>
    )
  return (
    <div
      className="mt-4 -rotate-[1.5deg] rounded-xl bg-amber-50/80 px-3 pt-1.5 pb-1 ring-1 ring-amber-500/25 dark:bg-amber-500/10 dark:ring-amber-400/20"
      title="Çağatay Kurtuluş için hazırlandı"
    >
      <div className="flex items-center gap-2">
        <span className="size-1.5 shrink-0 rounded-full bg-amber-500/70" aria-hidden="true" />
        <span className="font-imza text-[24px] leading-tight text-amber-800 dark:text-amber-300">Çağatay Kurtuluş</span>
      </div>
      <svg viewBox="0 0 180 8" className="ml-3.5 h-2 w-[168px] text-amber-500/70" aria-hidden="true">
        <path d="M2 5 C 40 1, 80 7, 120 3 S 170 4, 178 2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </div>
  )
}

/* Bir önceki ekrana döner; uygulama yeni açıldıysa Pano'ya gider. Pano'da görünmez. */
function GeriDugmesi({ kucuk }: { kucuk?: boolean }) {
  const { pathname, key } = useLocation()
  const git = useNavigate()
  if (pathname === '/') return <span aria-hidden="true" />
  const geri = () => (key === 'default' ? git('/') : git(-1))
  if (kucuk)
    return (
      <button
        type="button"
        onClick={geri}
        aria-label="Geri"
        className="grid size-10 place-items-center rounded-full bg-white text-stone-700 ring-1 ring-stone-200 active:scale-95 dark:bg-stone-800 dark:text-stone-200 dark:ring-stone-700"
      >
        <ArrowLeft size={20} />
      </button>
    )
  return (
    <button
      type="button"
      onClick={geri}
      className="flex h-10 items-center gap-2 rounded-full bg-white pr-4 pl-3 text-sm font-medium text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50 active:scale-[.98] dark:bg-stone-800 dark:text-stone-200 dark:ring-stone-700 dark:hover:bg-stone-700"
    >
      <ArrowLeft size={18} /> Geri
    </button>
  )
}

function TemaDugmesi() {
  const [tema, degistir] = useTema()
  const koyu = tema === 'koyu'
  return (
    <button
      type="button"
      onClick={() => degistir(koyu ? 'acik' : 'koyu')}
      aria-label={koyu ? 'Açık temaya geç' : 'Koyu temaya geç'}
      title={koyu ? 'Açık tema' : 'Koyu tema'}
      className={cx(
        'grid size-10 place-items-center rounded-full ring-1 transition active:scale-95',
        koyu
          ? 'bg-stone-800 text-stone-400 ring-stone-700 hover:text-stone-200'
          : 'bg-amber-50 text-amber-600 shadow-[0_0_18px_rgba(245,158,11,.35)] ring-amber-200 hover:bg-amber-100',
      )}
    >
      {koyu ? <LightbulbOff size={20} /> : <Lightbulb size={20} />}
    </button>
  )
}

function BaretLogo({ className }: { className?: string }) {
  return <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" aria-hidden="true" className={cx('shrink-0 rounded-[22%] shadow-sm', className)} draggable={false} />
}

/* Sol menünün altında: verilerin nerede olduğu ve eşitleme durumu. */
function BulutDurumu() {
  const e = useEsitleme()
  const git = useNavigate()
  if (!bulutHazir() || e.hal === 'kapali') return <p className="px-3 text-xs text-stone-400">Veriler bu cihazda saklanır. Yedek: Ayarlar.</p>
  const renk = e.hal === 'esit' ? 'bg-emerald-500' : e.hal === 'esitleniyor' ? 'bg-sky-500 animate-pulse' : e.hal === 'cevrimdisi' ? 'bg-amber-500' : 'bg-red-500'
  const yazi = e.hal === 'esit' ? 'Bulutla eşit' : e.hal === 'esitleniyor' ? 'Eşitleniyor…' : e.hal === 'cevrimdisi' ? 'Çevrimdışı' : 'Eşitleme sorunu'
  return (
    <button type="button" onClick={() => git('/ayarlar')} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800/60">
      <span className={cx('size-2 shrink-0 rounded-full', renk)} />
      <span>
        {yazi}
        {e.bekleyen > 0 && ` · ${e.bekleyen} bekliyor`}
      </span>
    </button>
  )
}

/* iPhone Safari'de, uygulama henüz ana ekrana eklenmemişse bir kez gösterilen ipucu. */
function AnaEkranaEkleIpucu() {
  const [gizli, setGizli] = useState(() => {
    try {
      return localStorage.getItem('insaat-ios-ipucu') === 'kapali'
    } catch {
      return false
    }
  })
  if (gizli || !iosMu() || uygulamaOlarakAcik()) return null
  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-100 dark:ring-amber-900 print:hidden">
      <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-10 shrink-0 rounded-[22%]" />
      <div className="min-w-0 flex-1">
        <b>Uygulama olarak ekleyin.</b> Alttaki <Share size={15} className="inline align-[-2px]" /> <b>Paylaş</b> düğmesine dokunup <b>Ana Ekrana Ekle</b>'yi seçin. Tam ekran açılır, verileriniz kalıcı olur.
      </div>
      <button
        type="button"
        aria-label="Kapat"
        className="grid size-9 shrink-0 place-items-center rounded-full text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900"
        onClick={() => {
          try {
            localStorage.setItem('insaat-ios-ipucu', 'kapali')
          } catch {
            /* yoksay */
          }
          setGizli(true)
        }}
      >
        <X size={18} />
      </button>
    </div>
  )
}
