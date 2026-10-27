import { Component, type ErrorInfo, type ReactNode } from 'react'
import { yedekAl, dosyaIndir } from '../lib/veri'

/*
 * Bir ekran hata verirse uygulama beyaz ekranda kalmaz: kayıtlar veritabanında durur,
 * kullanıcı yedek indirip sayfayı yenileyebilir.
 */
export class HataSiniri extends Component<{ children: ReactNode }, { hata: Error | null }> {
  state = { hata: null as Error | null }

  static getDerivedStateFromError(hata: Error) {
    return { hata }
  }

  componentDidCatch(hata: Error, bilgi: ErrorInfo) {
    console.error('Ekran hatası', hata, bilgi.componentStack)
  }

  render() {
    if (!this.state.hata) return this.props.children
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="text-xl font-semibold text-stone-900 dark:text-white">Bu ekranda bir sorun oluştu</h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          Kayıtlarınız güvende; veritabanı etkilenmedi. Önce yedek indirin, sonra sayfayı yenileyin.
        </p>
        <p className="mt-3 rounded-xl bg-stone-200/60 px-3 py-2 font-mono text-xs break-words text-stone-600 dark:bg-stone-800 dark:text-stone-400">
          {this.state.hata.message}
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <button
            type="button"
            className="h-11 rounded-xl bg-amber-500 px-4 font-medium text-stone-950"
            onClick={async () => {
              const y = await yedekAl()
              dosyaIndir(`insaat-takip-acil-yedek-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(y), 'application/json')
            }}
          >
            Yedek indir
          </button>
          <button type="button" className="h-11 rounded-xl px-4 font-medium ring-1 ring-stone-300 dark:ring-stone-700" onClick={() => location.reload()}>
            Sayfayı yenile
          </button>
        </div>
      </div>
    )
  }
}
