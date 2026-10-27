import { Download, Minus, Plus, Trash2, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { HareketFormu, odemeSekliYazisi } from '../components/formlar'
import { Baslik, Bos, Dugme, Etiket, Girdi, Kart, Ozet, Secim, Sekmeler, useBildirim } from '../components/ui'
import { GELIR_KATEGORILERI, GIDER_KATEGORILERI, type Hareket, type HareketTur } from '../db'
import { ayBasi, aySonu, para, tarihGoster } from '../lib/format'
import { toplam } from '../lib/hesap'
import { adBul, csvIndir, sil, type TumVeri } from '../lib/veri'

export default function Kasa({ veri }: { veri: TumVeri }) {
  const bildir = useBildirim()
  const [tur, setTur] = useState<HareketTur | 'hepsi'>('hepsi')
  const [bas, setBas] = useState(ayBasi())
  const [son, setSon] = useState(aySonu())
  const [kategori, setKategori] = useState('')
  const [pencere, setPencere] = useState<{ acik: boolean; kayit?: Hareket; varsayilan?: Partial<Hareket> }>({ acik: false })

  const donem = useMemo(
    () => veri.hareketler.filter((h) => (!bas || h.tarih >= bas) && (!son || h.tarih <= son)),
    [veri.hareketler, bas, son],
  )
  const liste = donem.filter((h) => (tur === 'hepsi' || h.tur === tur) && (!kategori || h.kategori === kategori))
  const gelir = toplam(donem.filter((h) => h.tur === 'gelir'), (h) => h.tutar)
  const gider = toplam(donem.filter((h) => h.tur === 'gider'), (h) => h.tutar)

  return (
    <div>
      <Baslik
        baslik="Gelir / Gider"
        alt="Kasa ve banka hareketleri: tahsilatlar, ödemeler ve tüm harcamalar."
        sag={
          <>
            <Dugme onClick={() => setPencere({ acik: true, varsayilan: { tur: 'gider' } })}>
              <Minus size={18} /> Gider
            </Dugme>
            <Dugme tur="ana" onClick={() => setPencere({ acik: true, varsayilan: { tur: 'gelir', kategori: 'Tahsilat' } })}>
              <Plus size={18} /> Gelir
            </Dugme>
          </>
        }
      />
      <div className="grid grid-cols-3 gap-3">
        <Ozet etiket="Gelir" deger={para(gelir)} ton="iyi" />
        <Ozet etiket="Gider" deger={para(gider)} ton="kotu" />
        <Ozet etiket="Net" deger={para(gelir - gider)} ton={gelir - gider < 0 ? 'kotu' : undefined} />
      </div>

      <Kart className="my-4 grid grid-cols-2 gap-3 p-4 lg:grid-cols-4">
        <Etiket etiket="Başlangıç">
          <Girdi type="date" value={bas} onChange={(e) => setBas(e.target.value)} />
        </Etiket>
        <Etiket etiket="Bitiş">
          <Girdi type="date" value={son} onChange={(e) => setSon(e.target.value)} />
        </Etiket>
        <Etiket etiket="Kategori" className="col-span-2 lg:col-span-1">
          <Secim value={kategori} onChange={(e) => setKategori(e.target.value)}>
            <option value="">Tümü</option>
            {[...new Set([...GIDER_KATEGORILERI, ...GELIR_KATEGORILERI])].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </Secim>
        </Etiket>
        <div className="col-span-2 flex items-end lg:col-span-1">
          <Dugme
            className="w-full"
            disabled={!liste.length}
            onClick={() =>
              csvIndir(
                'gelir-gider.csv',
                ['Tarih', 'Tür', 'Kategori', 'Tutar', 'Cari', 'Şantiye', 'Açıklama'],
                liste.map((h) => [tarihGoster(h.tarih), h.tur === 'gelir' ? 'Gelir' : 'Gider', h.kategori, h.tutar, adBul(veri.cariler, h.cariId), adBul(veri.santiyeler, h.santiyeId), h.aciklama ?? '']),
              )
            }
          >
            <Download size={17} /> Excel
          </Dugme>
        </div>
      </Kart>

      <Sekmeler
        secili={tur}
        sec={setTur}
        secenekler={[
          ['hepsi', 'Tümü', donem.length],
          ['gelir', 'Gelir', donem.filter((h) => h.tur === 'gelir').length],
          ['gider', 'Gider', donem.filter((h) => h.tur === 'gider').length],
        ]}
      />

      {liste.length ? (
        <Kart>
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {liste.map((h) => (
              <div key={h.id} className="flex items-center gap-1 pr-2">
                <button type="button" onClick={() => setPencere({ acik: true, kayit: h })} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800/60">
                  <div className={'grid size-9 shrink-0 place-items-center rounded-full ' + (h.tur === 'gelir' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400')}>
                    {h.tur === 'gelir' ? <Plus size={17} /> : <Minus size={17} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-stone-900 dark:text-stone-100">{h.aciklama || h.kategori}</div>
                    <div className="truncate text-[13px] text-stone-500">
                      {tarihGoster(h.tarih)} · {h.kategori}
                      {h.cariId && ` · ${adBul(veri.cariler, h.cariId)}`}
                      {h.santiyeId && ` · ${adBul(veri.santiyeler, h.santiyeId)}`}
                      {h.odemeSekli && ` · ${odemeSekliYazisi(h.odemeSekli, h.cek)}`}
                    </div>
                  </div>
                  <div className={'shrink-0 font-semibold tabular-nums ' + (h.tur === 'gelir' ? 'text-emerald-600 dark:text-emerald-400' : '')}>
                    {h.tur === 'gelir' ? '+' : '−'}
                    {para(h.tutar)}
                  </div>
                </button>
                <button
                  type="button"
                  aria-label="Sil"
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                  onClick={async () => bildir('Kayıt silindi', await sil('hareketler', h.id))}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </Kart>
      ) : (
        <Kart>
          <Bos simge={<Wallet size={40} />} baslik="Bu dönemde kayıt yok" aciklama="Tarih aralığını değiştirin ya da yeni gelir/gider ekleyin." />
        </Kart>
      )}
      <HareketFormu acik={pencere.acik} kapat={() => setPencere({ acik: false })} kayit={pencere.kayit} varsayilan={pencere.varsayilan} veri={veri} />
    </div>
  )
}
