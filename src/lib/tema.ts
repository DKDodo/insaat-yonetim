import { useEffect, useState } from 'react'

export type Tema = 'acik' | 'koyu'
const ANAHTAR = 'insaat-tema'
const olay = 'tema-degisti'

function oku(): Tema {
  try {
    const t = localStorage.getItem(ANAHTAR)
    if (t === 'acik' || t === 'koyu') return t
  } catch {
    /* gizli pencerede depolama kapalı olabilir */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'koyu' : 'acik'
}

export function temaUygula(t: Tema): void {
  const kok = document.documentElement
  kok.classList.toggle('dark', t === 'koyu')
  kok.style.colorScheme = t === 'koyu' ? 'dark' : 'light'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'koyu' ? '#0c0a09' : '#f5f5f4')
  // iPhone bunu bir sonraki açılışta uygular
  document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.setAttribute('content', t === 'koyu' ? 'black-translucent' : 'default')
}

export function useTema(): [Tema, (t: Tema) => void] {
  const [tema, setTema] = useState<Tema>(oku)
  useEffect(() => {
    const dinle = () => setTema(oku())
    window.addEventListener(olay, dinle)
    return () => window.removeEventListener(olay, dinle)
  }, [])
  const degistir = (t: Tema) => {
    try {
      localStorage.setItem(ANAHTAR, t)
    } catch {
      /* yoksay */
    }
    temaUygula(t)
    setTema(t)
    window.dispatchEvent(new Event(olay))
  }
  return [tema, degistir]
}

export function temaBaslat(): void {
  temaUygula(oku())
}
