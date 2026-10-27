/* Uygulamanın internetteki adresi (GitHub Pages). iPhone ve Mac buradan açar. */
export const YAYIN_ADRESI = 'https://dkdodo.github.io/insaat-takip/'

/* iPhone / iPad Safari mi? (iPadOS kendini Mac gibi tanıtır; dokunmatik ekranla ayırt edilir.) */
export function iosMu(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

/* Ana ekrana / Dock'a eklenmiş uygulama olarak mı açıldı? */
export function uygulamaOlarakAcik(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

/* Bilgisayardaki masaüstü sürümü (EXE) ya da geliştirme sunucusu mu? */
export function yerelMi(): boolean {
  return typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
}
