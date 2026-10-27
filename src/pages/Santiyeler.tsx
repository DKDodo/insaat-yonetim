import { Building2, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SantiyeFormu } from '../components/formlar'
import { Baslik, Bos, Dugme, Girdi, Kart, Rozet, Sekmeler } from '../components/ui'
import { para, tarihGoster } from '../lib/format'
import { santiyeOzeti } from '../lib/hesap'
import { adBul, type TumVeri } from '../lib/veri'

export default function Santiyeler({ veri }: { veri: TumVeri }) {
  const git = useNavigate()
  const [pencere, setPencere] = useState(false)
  const [durum, setDurum] = useState<'aktif' | 'bitti' | 'hepsi'>('aktif')
  const [ara, setAra] = useState('')

  const liste = useMemo(() => {
    const a = ara.trim().toLocaleLowerCase('tr-TR')
    return veri.santiyeler
      .filter((s) => durum === 'hepsi' || s.durum === durum)
      .filter((s) => !a || s.ad.toLocaleLowerCase('tr-TR').includes(a) || adBul(veri.cariler, s.firmaId).toLocaleLowerCase('tr-TR').includes(a))
      .map((s) => ({ s, o: santiyeOzeti(s.id, veri.sevkiyatlar, veri.hareketler, veri.avanslar) }))
  }, [veri, durum, ara])

  const say = (d: 'aktif' | 'bitti') => veri.santiyeler.filter((s) => s.durum === d).length

  return (
    <div>
      <Baslik
        baslik="Şantiyeler"
        alt="Her şantiyeye ne gitti, ne harcandı."
        sag={
          <Dugme tur="ana" onClick={() => setPencere(true)}>
            <Plus size={18} /> Yeni şantiye
          </Dugme>
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <Sekmeler
          secili={durum}
          sec={setDurum}
          secenekler={[
            ['aktif', 'Devam eden', say('aktif')],
            ['bitti', 'Tamamlanan', say('bitti')],
            ['hepsi', 'Tümü', veri.santiyeler.length],
          ]}
        />
        <div className="relative mb-4 min-w-[200px] flex-1">
          <Search size={17} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-stone-400" />
          <Girdi value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Şantiye ya da firma ara" className="pl-9" />
        </div>
      </div>

      {liste.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {liste.map(({ s, o }) => (
            <button key={s.id} type="button" onClick={() => git(`/santiyeler/${s.id}`)} className="text-left">
              <Kart className="h-full p-4 transition hover:ring-amber-400 dark:hover:ring-amber-600">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-stone-900 dark:text-white">{s.ad}</div>
                    <div className="truncate text-[13px] text-stone-500">{adBul(veri.cariler, s.firmaId) || 'Firma seçilmedi'}</div>
                  </div>
                  <Rozet ton={s.durum === 'aktif' ? 'yesil' : 'gri'}>{s.durum === 'aktif' ? 'Devam ediyor' : 'Tamamlandı'}</Rozet>
                </div>
                <div className="mt-4 text-xs text-stone-500">Toplam maliyet</div>
                <div className="text-2xl font-semibold tracking-tight tabular-nums text-stone-900 dark:text-white">{para(o.maliyet)}</div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <Mini ad="Malzeme" deger={para(o.malzeme)} />
                  <Mini ad="Tahsil" deger={para(o.tahsilat)} />
                  <Mini ad="Kalan" deger={para(o.kalan)} vurgu={o.kalan > 0} />
                </div>
                <div className="mt-3 text-xs text-stone-500">
                  {o.sevkiyatSayisi} sevkiyat{o.sonSevkiyat && ` · son ${tarihGoster(o.sonSevkiyat)}`}
                </div>
              </Kart>
            </button>
          ))}
        </div>
      ) : (
        <Kart>
          <Bos
            simge={<Building2 size={40} />}
            baslik={veri.santiyeler.length ? 'Eşleşen şantiye yok' : 'Henüz şantiye yok'}
            aciklama="Malzeme gönderdiğiniz her inşaat için bir şantiye açın."
            eylem={
              <Dugme tur="ana" onClick={() => setPencere(true)}>
                <Plus size={18} /> Şantiye ekle
              </Dugme>
            }
          />
        </Kart>
      )}
      <SantiyeFormu acik={pencere} kapat={() => setPencere(false)} veri={veri} olustu={(s) => git(`/santiyeler/${s.id}`)} />
    </div>
  )
}

function Mini({ ad, deger, vurgu }: { ad: string; deger: string; vurgu?: boolean }) {
  return (
    <div className="min-w-0 rounded-lg bg-stone-50 px-2 py-1.5 dark:bg-stone-800/60">
      <div className="text-stone-500">{ad}</div>
      <div className={'truncate font-medium tabular-nums ' + (vurgu ? 'text-amber-700 dark:text-amber-400' : 'text-stone-800 dark:text-stone-200')}>{deger}</div>
    </div>
  )
}
