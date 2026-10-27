import { X } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'

export function cx(...s: (string | false | null | undefined)[]): string {
  return s.filter(Boolean).join(' ')
}

type Tur = 'ana' | 'ikincil' | 'hayalet' | 'tehlike'

export function Dugme({
  tur = 'ikincil',
  kucuk,
  className,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { tur?: Tur; kucuk?: boolean }) {
  return (
    <button
      type="button"
      {...p}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500',
        kucuk ? 'h-9 px-3 text-sm' : 'h-11 px-4 text-[15px]',
        tur === 'ana' && 'bg-amber-500 text-stone-950 hover:bg-amber-400 shadow-sm',
        tur === 'ikincil' &&
          'bg-white text-stone-800 ring-1 ring-stone-200 hover:bg-stone-50 dark:bg-stone-800 dark:text-stone-100 dark:ring-stone-700 dark:hover:bg-stone-700',
        tur === 'hayalet' && 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800',
        tur === 'tehlike' && 'bg-red-600 text-white hover:bg-red-500',
        className,
      )}
    />
  )
}

export function Kart({ children, className, ...p }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...p}
      className={cx(
        'rounded-2xl bg-white ring-1 ring-stone-200/80 shadow-[0_1px_2px_rgba(0,0,0,.04)] dark:bg-stone-900 dark:ring-stone-800',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Baslik({ baslik, alt, sag }: { baslik: string; alt?: ReactNode; sag?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50 md:text-[28px]">{baslik}</h1>
        {alt && <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{alt}</p>}
      </div>
      {sag && <div className="flex flex-wrap gap-2">{sag}</div>}
    </div>
  )
}

const alanSinifi =
  'w-full h-11 rounded-xl bg-white px-3 text-[16px] text-stone-900 ring-1 ring-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-stone-950 dark:text-stone-100 dark:ring-stone-700'

export function Etiket({ etiket, children, ipucu, className }: { etiket: string; children: ReactNode; ipucu?: string; className?: string }) {
  return (
    <label className={cx('block min-w-0', className)}>
      <span className="mb-1.5 block text-[13px] font-medium text-stone-600 dark:text-stone-400">{etiket}</span>
      {children}
      {ipucu && <span className="mt-1 block text-xs text-stone-500">{ipucu}</span>}
    </label>
  )
}

export function Girdi({ className, ...p }: React.ComponentProps<'input'>) {
  return <input {...p} className={cx(alanSinifi, className)} />
}

export function SayiGirdi({ className, ...p }: React.ComponentProps<'input'>) {
  return <input inputMode="decimal" autoComplete="off" {...p} className={cx(alanSinifi, 'tabular-nums', className)} />
}

export function Secim({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...p} className={cx(alanSinifi, 'appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9 secim-ok', className)}>
      {children}
    </select>
  )
}

export function MetinAlani({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={2} {...p} className={cx(alanSinifi, 'h-auto py-2.5', className)} />
}

export function Bos({ simge, baslik, aciklama, eylem }: { simge?: ReactNode; baslik: string; aciklama?: string; eylem?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {simge && <div className="mb-3 text-stone-300 dark:text-stone-600">{simge}</div>}
      <p className="font-medium text-stone-700 dark:text-stone-200">{baslik}</p>
      {aciklama && <p className="mt-1 max-w-sm text-sm text-stone-500">{aciklama}</p>}
      {eylem && <div className="mt-4">{eylem}</div>}
    </div>
  )
}

export function Ozet({
  etiket,
  deger,
  alt,
  ton,
  simge,
}: {
  etiket: string
  deger: string
  alt?: ReactNode
  ton?: 'iyi' | 'kotu' | 'uyari'
  simge?: ReactNode
}) {
  return (
    <Kart className="p-4">
      <div className="flex items-center gap-2 text-[13px] font-medium text-stone-500 dark:text-stone-400">
        {simge}
        {etiket}
      </div>
      <div
        className={cx(
          'mt-1.5 text-[22px] font-semibold tracking-tight tabular-nums',
          ton === 'iyi' && 'text-emerald-600 dark:text-emerald-400',
          ton === 'kotu' && 'text-red-600 dark:text-red-400',
          ton === 'uyari' && 'text-amber-600 dark:text-amber-400',
          !ton && 'text-stone-900 dark:text-stone-50',
        )}
      >
        {deger}
      </div>
      {alt && <div className="mt-0.5 text-xs text-stone-500">{alt}</div>}
    </Kart>
  )
}

export function Rozet({ children, ton = 'gri' }: { children: ReactNode; ton?: 'gri' | 'yesil' | 'kirmizi' | 'sari' | 'mavi' }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        ton === 'gri' && 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
        ton === 'yesil' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
        ton === 'kirmizi' && 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
        ton === 'sari' && 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
        ton === 'mavi' && 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
      )}
    >
      {children}
    </span>
  )
}

/* Telefonda alttan açılan, bilgisayarda ortada duran pencere. */
export function Pencere({
  acik,
  kapat,
  baslik,
  children,
  alt,
}: {
  acik: boolean
  kapat: () => void
  baslik: string
  children: ReactNode
  alt?: ReactNode
}) {
  useEffect(() => {
    if (!acik) return
    const tus = (e: KeyboardEvent) => e.key === 'Escape' && kapat()
    window.addEventListener('keydown', tus)
    const eski = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', tus)
      document.body.style.overflow = eski
    }
  }, [acik, kapat])
  if (!acik) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={baslik}>
      <div className="absolute inset-0 bg-stone-950/40 backdrop-blur-[2px]" onClick={kapat} />
      <div className="relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-stone-50 shadow-2xl dark:bg-stone-900 md:max-w-lg md:rounded-3xl">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">{baslik}</h2>
          <button type="button" onClick={kapat} className="grid size-9 place-items-center rounded-full text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800" aria-label="Kapat">
            <X size={20} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {alt && <div className="flex gap-2 border-t border-stone-200 px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] dark:border-stone-800">{alt}</div>}
      </div>
    </div>
  )
}

/* Bildirim ve "Geri al" */
interface Bildirim {
  id: number
  mesaj: string
  geriAl?: () => void | Promise<void>
}
const BildirimBaglami = createContext<(mesaj: string, geriAl?: () => void | Promise<void>) => void>(() => {})

export function BildirimSaglayici({ children }: { children: ReactNode }) {
  const [liste, setListe] = useState<Bildirim[]>([])
  const sayac = useRef(0)
  const goster = useCallback((mesaj: string, geriAl?: () => void | Promise<void>) => {
    const id = ++sayac.current
    setListe((l) => [...l.slice(-2), { id, mesaj, geriAl }])
    setTimeout(() => setListe((l) => l.filter((b) => b.id !== id)), geriAl ? 7000 : 3500)
  }, [])
  return (
    <BildirimBaglami.Provider value={goster}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(84px+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6">
        {liste.map((b) => (
          <div key={b.id} role="status" className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-stone-900 px-4 py-3 text-sm text-white shadow-xl dark:bg-stone-100 dark:text-stone-900">
            <span>{b.mesaj}</span>
            {b.geriAl && (
              <button
                type="button"
                className="font-semibold text-amber-400 dark:text-amber-700"
                onClick={async () => {
                  await b.geriAl?.()
                  setListe((l) => l.filter((x) => x.id !== b.id))
                }}
              >
                Geri al
              </button>
            )}
          </div>
        ))}
      </div>
    </BildirimBaglami.Provider>
  )
}

export function useBildirim() {
  return useContext(BildirimBaglami)
}

export function Sekmeler<T extends string>({ secili, sec, secenekler }: { secili: T; sec: (t: T) => void; secenekler: [T, string, number?][] }) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-stone-200/60 p-1 dark:bg-stone-800/70" role="tablist">
      {secenekler.map(([k, ad, n]) => (
        <button
          key={k}
          type="button"
          role="tab"
          aria-selected={secili === k}
          onClick={() => sec(k)}
          className={cx(
            'flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition',
            secili === k ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-700 dark:text-white' : 'text-stone-600 hover:text-stone-900 dark:text-stone-400',
          )}
        >
          {ad}
          {n !== undefined && <span className="text-xs text-stone-400 tabular-nums">{n}</span>}
        </button>
      ))}
    </div>
  )
}

export function Satir({ sol, sag, alt, onClick, className }: { sol: ReactNode; sag?: ReactNode; alt?: ReactNode; onClick?: () => void; className?: string }) {
  const Ic = (
    <>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-stone-900 dark:text-stone-100">{sol}</div>
        {alt && <div className="mt-0.5 truncate text-[13px] text-stone-500">{alt}</div>}
      </div>
      {sag && <div className="shrink-0 text-right tabular-nums">{sag}</div>}
    </>
  )
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={cx('flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800/60', className)}>
        {Ic}
      </button>
    )
  return <div className={cx('flex items-center gap-3 px-4 py-3', className)}>{Ic}</div>
}

export function Liste({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-stone-100 dark:divide-stone-800">{children}</div>
}
