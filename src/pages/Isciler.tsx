import { Download, HardHat, Pencil, Phone, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { AvansFormu, IsciFormu } from '../components/formlar'
import { Baslik, Bos, Dugme, Kart, Ozet, Rozet, Sekmeler, useBildirim } from '../components/ui'
import type { Avans, Isci } from '../db'
import { ayBasi, para, tarihGoster } from '../lib/format'
import { toplam } from '../lib/hesap'
import { adBul, csvIndir, sil, type TumVeri } from '../lib/veri'

export default function Isciler({ veri }: { veri: TumVeri }) {
  const bildir = useBildirim()
  const [gorunum, setGorunum] = useState<'isciler' | 'avanslar'>('isciler')
  const [isciPencere, setIsciPencere] = useState<{ acik: boolean; kayit?: Isci }>({ acik: false })
  const [avansPencere, setAvansPencere] = useState<{ acik: boolean; kayit?: Avans; isciId?: string }>({ acik: false })
  const [secili, setSecili] = useState<string | null>(null)

  const ay = ayBasi()
  const buAy = toplam(veri.avanslar.filter((a) => a.tarih >= ay), (a) => a.tutar)

  return (
    <div>
      <Baslik
        baslik="İşçiler ve Avans"
        alt="İşçilere verilen avansları kaydedin; kişi ve şantiye bazında toplamlar görünür."
        sag={
          <>
            <Dugme onClick={() => setIsciPencere({ acik: true })}>
              <Plus size={18} /> İşçi
            </Dugme>
            <Dugme tur="ana" onClick={() => setAvansPencere({ acik: true })} disabled={!veri.isciler.length}>
              <Plus size={18} /> Avans ver
            </Dugme>
          </>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Ozet etiket="Bu ay verilen avans" deger={para(buAy)} />
        <Ozet etiket="Toplam avans" deger={para(toplam(veri.avanslar, (a) => a.tutar))} alt={`${veri.avanslar.length} kayıt`} />
        <Ozet etiket="Çalışan işçi" deger={String(veri.isciler.filter((i) => i.aktif).length)} />
      </div>
      <Sekmeler
        secili={gorunum}
        sec={setGorunum}
        secenekler={[
          ['isciler', 'İşçiler', veri.isciler.length],
          ['avanslar', 'Tüm avanslar', veri.avanslar.length],
        ]}
      />

      {gorunum === 'isciler' &&
        (veri.isciler.length ? (
          <Kart>
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {veri.isciler.map((i) => {
                const av = veri.avanslar.filter((a) => a.isciId === i.id)
                const acik = secili === i.id
                return (
                  <div key={i.id}>
                    <button type="button" onClick={() => setSecili(acik ? null : i.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800/60">
                      <div className="grid size-10 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        <HardHat size={19} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium text-stone-900 dark:text-stone-100">{i.ad}</span>
                          {!i.aktif && <Rozet>Ayrıldı</Rozet>}
                        </div>
                        <div className="text-[13px] text-stone-500">
                          {i.gorev || 'Görev yazılmadı'} · {av.length} avans
                        </div>
                      </div>
                      <div className="text-right font-semibold tabular-nums">{para(toplam(av, (a) => a.tutar))}</div>
                    </button>
                    {acik && (
                      <div className="bg-stone-50 px-4 py-3 dark:bg-stone-950/60">
                        <div className="mb-3 flex flex-wrap gap-2">
                          <Dugme kucuk tur="ana" onClick={() => setAvansPencere({ acik: true, isciId: i.id })}>
                            <Plus size={15} /> Avans ver
                          </Dugme>
                          <Dugme kucuk onClick={() => setIsciPencere({ acik: true, kayit: i })}>
                            <Pencil size={15} /> Düzenle
                          </Dugme>
                          {i.telefon && (
                            <a href={`tel:${i.telefon.replace(/\s/g, '')}`} className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm text-stone-600 ring-1 ring-stone-200 dark:text-stone-300 dark:ring-stone-700">
                              <Phone size={15} /> Ara
                            </a>
                          )}
                          <Dugme
                            kucuk
                            tur="hayalet"
                            className="text-red-600"
                            onClick={async () => {
                              if (av.length && !confirm('İşçinin avans kayıtları kalır. Yine de silinsin mi?')) return
                              bildir('İşçi silindi', await sil('isciler', i.id))
                            }}
                          >
                            <Trash2 size={15} /> Sil
                          </Dugme>
                        </div>
                        {av.length ? (
                          <ul className="grid gap-1 text-sm">
                            {av.map((a) => (
                              <li key={a.id} className="flex justify-between gap-3">
                                <button type="button" className="text-left hover:underline" onClick={() => setAvansPencere({ acik: true, kayit: a })}>
                                  {tarihGoster(a.tarih)}
                                  <span className="text-stone-500">
                                    {a.santiyeId && ` · ${adBul(veri.santiyeler, a.santiyeId)}`}
                                    {a.aciklama && ` · ${a.aciklama}`}
                                  </span>
                                </button>
                                <span className="tabular-nums">{para(a.tutar)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-stone-500">Henüz avans verilmedi.</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Kart>
        ) : (
          <Kart>
            <Bos simge={<HardHat size={40} />} baslik="Henüz işçi yok" eylem={<Dugme tur="ana" onClick={() => setIsciPencere({ acik: true })}><Plus size={18} /> İşçi ekle</Dugme>} />
          </Kart>
        ))}

      {gorunum === 'avanslar' && (
        <Kart>
          <div className="flex justify-end px-4 pt-3">
            <Dugme
              kucuk
              disabled={!veri.avanslar.length}
              onClick={() =>
                csvIndir(
                  'avanslar.csv',
                  ['Tarih', 'İşçi', 'Tutar', 'Şantiye', 'Açıklama'],
                  veri.avanslar.map((a) => [tarihGoster(a.tarih), adBul(veri.isciler, a.isciId), a.tutar, adBul(veri.santiyeler, a.santiyeId), a.aciklama ?? '']),
                )
              }
            >
              <Download size={15} /> Excel
            </Dugme>
          </div>
          {veri.avanslar.length ? (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {veri.avanslar.map((a) => (
                <div key={a.id} className="flex items-center gap-1 pr-2">
                  <button type="button" onClick={() => setAvansPencere({ acik: true, kayit: a })} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800/60">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{adBul(veri.isciler, a.isciId) || 'İşçi silinmiş'}</div>
                      <div className="truncate text-[13px] text-stone-500">
                        {tarihGoster(a.tarih)}
                        {a.santiyeId && ` · ${adBul(veri.santiyeler, a.santiyeId)}`}
                        {a.aciklama && ` · ${a.aciklama}`}
                      </div>
                    </div>
                    <div className="font-semibold tabular-nums">{para(a.tutar)}</div>
                  </button>
                  <button
                    type="button"
                    aria-label="Sil"
                    className="grid size-11 shrink-0 place-items-center rounded-lg md:size-9 text-stone-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                    onClick={async () => bildir('Avans silindi', await sil('avanslar', a.id))}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <Bos baslik="Avans kaydı yok" />
          )}
        </Kart>
      )}

      <IsciFormu acik={isciPencere.acik} kapat={() => setIsciPencere({ acik: false })} kayit={isciPencere.kayit} />
      <AvansFormu acik={avansPencere.acik} kapat={() => setAvansPencere({ acik: false })} kayit={avansPencere.kayit} isciId={avansPencere.isciId} veri={veri} />
    </div>
  )
}
