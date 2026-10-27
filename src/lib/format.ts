const paraFmt = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const sayiFmt = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 3 })

export function para(n: number): string {
  return paraFmt.format(Number.isFinite(n) ? n : 0)
}

export function sayi(n: number): string {
  return sayiFmt.format(Number.isFinite(n) ? n : 0)
}

/* Kullanıcının yazdığı tutarı okur: "1.250,50" → 1250.5, "2,5" → 2.5, "12.500" → 12500, "2.5" → 2.5 */
export function sayiOku(metin: string): number {
  let t = String(metin ?? '').trim().replace(/[\s₺TL]/gi, '')
  if (!t) return 0
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.')
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '')
  const n = Number(t)
  return Number.isFinite(n) ? n : Number.NaN
}

/* Sayıyı form alanında gösterilecek metne çevirir (binlik ayraç yok, ondalık virgül). */
export function sayiMetni(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n) || n === 0) return ''
  return String(Math.round(n * 1000) / 1000).replace('.', ',')
}

/* Kuruşa yuvarlar. Ondalık metin üzerinden çalışır: 1,005 → 1,01 (Math.round(1.005*100) 1,00 verirdi). */
export function yuvarla(n: number): number {
  if (!Number.isFinite(n)) return 0
  const m = Math.abs(n)
  if (m < 0.000001) return 0
  const s = String(m)
  const r = s.includes('e') ? Math.round(m * 100) / 100 : Number(Math.round(Number(s + 'e2')) + 'e-2')
  return n < 0 ? -r : r
}

function iki(n: number): string {
  return String(n).padStart(2, '0')
}

export function yerelTarih(d: Date): string {
  return `${d.getFullYear()}-${iki(d.getMonth() + 1)}-${iki(d.getDate())}`
}

export function bugun(): string {
  return yerelTarih(new Date())
}

export function tarihGoster(s?: string): string {
  if (!s) return ''
  const [y, m, g] = s.split('-')
  return `${g}.${m}.${y}`
}

const ayAdlari = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

export function tarihUzun(s?: string): string {
  if (!s) return ''
  const [y, m, g] = s.split('-').map(Number)
  return `${g} ${ayAdlari[m - 1]} ${y}`
}

export function gunEkle(s: string, n: number): string {
  const d = new Date(s + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return yerelTarih(d)
}

/* b − a, gün olarak */
export function gunFarki(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T00:00:00') - Date.parse(a + 'T00:00:00')) / 86400000)
}

export function ayBasi(s: string = bugun()): string {
  return s.slice(0, 8) + '01'
}

export function aySonu(s: string = bugun()): string {
  const d = new Date(s.slice(0, 8) + '01T00:00:00')
  d.setMonth(d.getMonth() + 1)
  d.setDate(0)
  return yerelTarih(d)
}

export function vadeYazisi(vade: string): string {
  const f = gunFarki(bugun(), vade)
  if (f === 0) return 'Bugün'
  if (f === 1) return 'Yarın'
  if (f === -1) return 'Dün'
  if (f < 0) return `${-f} gün geçti`
  return `${f} gün sonra`
}

export function yeniId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  } catch {
    /* güvenli olmayan bağlamda (http) randomUUID yok */
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 12)
}

export function simdi(): string {
  return new Date().toISOString()
}

export function karsilastir(a: string, b: string): number {
  return a.localeCompare(b, 'tr')
}
