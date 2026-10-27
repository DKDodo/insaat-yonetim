import { Download, Package, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { MalzemeFormu } from '../components/formlar'
import { Baslik, Bos, Dugme, Girdi, Kart, useBildirim } from '../components/ui'
import type { Malzeme } from '../db'
import { para, sayi, tarihGoster } from '../lib/format'
import { csvIndir, sil, type TumVeri } from '../lib/veri'

export default function Malzemeler({ veri }: { veri: TumVeri }) {
  const bildir = useBildirim()
  const [pencere, setPencere] = useState<{ acik: boolean; kayit?: Malzeme }>({ acik: false })
  const [ara, setAra] = useState('')
  const [secili, setSecili] = useState<string | null>(null)

  /* Her malzemenin toplam gönderimi ve fiyat geçmişi sevkiyatlardan çıkar */
  const istatistik = useMemo(() => {
    const m = new Map<string, { miktar: number; tutar: number; sefer: number; gecmis: { tarih: string; fiyat: number }[] }>()
    for (const s of [...veri.sevkiyatlar].reverse())
      for (const k of s.kalemler) {
        const o = m.get(k.malzemeId) ?? { miktar: 0, tutar: 0, sefer: 0, gecmis: [] }
        o.miktar += k.miktar
        o.tutar += k.miktar * k.birimFiyat
        o.sefer += 1
        const son = o.gecmis.at(-1)
        if (!son || son.fiyat !== k.birimFiyat) o.gecmis.push({ tarih: s.tarih, fiyat: k.birimFiyat })
        m.set(k.malzemeId, o)
      }
    return m
  }, [veri.sevkiyatlar])

  const liste = veri.malzemeler.filter((m) => !ara.trim() || m.ad.toLocaleLowerCase('tr-TR').includes(ara.trim().toLocaleLowerCase('tr-TR')))

  return (
    <div>
      <Baslik
        baslik="Malzemeler"
        alt="Malzeme gönderirken yazdığınız her yeni ad buraya kendiliğinden eklenir; son fiyat hatırlanır."
        sag={
          <>
            <Dugme
              disabled={!veri.malzemeler.length}
              onClick={() =>
                csvIndir(
                  'malzemeler.csv',
                  ['Malzeme', 'Birim', 'Güncel fiyat', 'Toplam giden miktar', 'Toplam tutar', 'Sefer'],
                  veri.malzemeler.map((m) => {
                    const i = istatistik.get(m.id)
                    return [m.ad, m.birim, m.fiyat, i?.miktar ?? 0, Math.round((i?.tutar ?? 0) * 100) / 100, i?.sefer ?? 0]
                  }),
                )
              }
            >
              <Download size={17} /> Excel
            </Dugme>
            <Dugme tur="ana" onClick={() => setPencere({ acik: true })}>
              <Plus size={18} /> Yeni malzeme
            </Dugme>
          </>
        }
      />
      <div className="relative mb-4">
        <Search size={17} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-stone-400" />
        <Girdi value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Malzeme ara" className="pl-9" />
      </div>
      {liste.length ? (
        <Kart>
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {liste.map((m) => {
              const i = istatistik.get(m.id)
              const acik = secili === m.id
              return (
                <div key={m.id}>
                  <div className="flex items-center gap-2 pr-2">
                    <button type="button" onClick={() => setSecili(acik ? null : m.id)} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800/60">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-stone-900 dark:text-stone-100">{m.ad}</div>
                        <div className="text-[13px] text-stone-500">
                          {i ? `${sayi(i.miktar)} ${m.birim} gitti · ${i.sefer} sefer` : 'Henüz gönderilmedi'}
                        </div>
                      </div>
                      <div className="text-right tabular-nums">
                        <div className="font-semibold">{para(m.fiyat)}</div>
                        <div className="text-xs text-stone-500">/ {m.birim}</div>
                      </div>
                    </button>
                  </div>
                  {acik && (
                    <div className="bg-stone-50 px-4 py-3 text-sm dark:bg-stone-950/60">
                      <div className="mb-2 font-medium">Fiyat geçmişi</div>
                      {i?.gecmis.length ? (
                        <ul className="grid gap-1">
                          {[...i.gecmis].reverse().map((g, k) => (
                            <li key={k} className="flex justify-between tabular-nums">
                              <span className="text-stone-500">{tarihGoster(g.tarih)}</span>
                              <span>{para(g.fiyat)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-stone-500">Kayıt yok.</p>
                      )}
                      {i && <p className="mt-2 text-stone-500">Toplam giden tutar: {para(i.tutar)}</p>}
                      <div className="mt-3 flex gap-2">
                        <Dugme kucuk onClick={() => setPencere({ acik: true, kayit: m })}>
                          Düzenle
                        </Dugme>
                        <Dugme
                          kucuk
                          tur="hayalet"
                          className="text-red-600"
                          onClick={async () => {
                            if (i && !confirm('Bu malzeme eski sevkiyatlarda kalır, yalnız katalogdan silinir. Devam edilsin mi?')) return
                            bildir('Malzeme silindi', await sil('malzemeler', m.id))
                          }}
                        >
                          <Trash2 size={15} /> Sil
                        </Dugme>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Kart>
      ) : (
        <Kart>
          <Bos
            simge={<Package size={40} />}
            baslik={veri.malzemeler.length ? 'Eşleşen malzeme yok' : 'Malzeme kataloğu boş'}
            aciklama="Çimento, demir, kum gibi malzemeleri birimi ve fiyatıyla ekleyin."
            eylem={
              <Dugme tur="ana" onClick={() => setPencere({ acik: true })}>
                <Plus size={18} /> Malzeme ekle
              </Dugme>
            }
          />
        </Kart>
      )}
      <MalzemeFormu acik={pencere.acik} kapat={() => setPencere({ acik: false })} kayit={pencere.kayit} />
    </div>
  )
}
