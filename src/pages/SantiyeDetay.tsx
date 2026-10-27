import { ChevronRight, Download, HardHat, Pencil, Plus, Printer, Trash2, Truck, Wallet } from 'lucide-react'
import { Fragment, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AvansFormu, HareketFormu, SantiyeFormu } from '../components/formlar'
import { Baslik, Bos, Dugme, Kart, Liste, Ozet, Rozet, Satir, Sekmeler, useBildirim } from '../components/ui'
import type { Avans, Hareket } from '../db'
import { para, sayi, tarihGoster } from '../lib/format'
import { kalemAnahtari, malzemeOzetle, santiyeOzeti, satirTutari, sevkiyatToplami } from '../lib/hesap'
import { adBul, csvIndir, sil, type TumVeri } from '../lib/veri'

type Sekme = 'malzeme' | 'sevkiyat' | 'harcama'

export default function SantiyeDetay({ veri }: { veri: TumVeri }) {
  const { id } = useParams()
  const git = useNavigate()
  const bildir = useBildirim()
  const [sekme, setSekme] = useState<Sekme>('malzeme')
  const [acikMalzeme, setAcikMalzeme] = useState<string | null>(null)
  const [duzenle, setDuzenle] = useState(false)
  const [harcama, setHarcama] = useState<{ acik: boolean; kayit?: Hareket; varsayilan?: Partial<Hareket> }>({ acik: false })
  const [avans, setAvans] = useState<{ acik: boolean; kayit?: Avans }>({ acik: false })

  const s = veri.santiyeler.find((x) => x.id === id)
  if (!s) return <Bos baslik="Şantiye bulunamadı" eylem={<Dugme onClick={() => git('/santiyeler')}>Şantiyelere dön</Dugme>} />

  const o = santiyeOzeti(s.id, veri.sevkiyatlar, veri.hareketler, veri.avanslar)
  const sevkiyatlar = veri.sevkiyatlar.filter((x) => x.santiyeId === s.id)
  const malzemeler = malzemeOzetle(sevkiyatlar)
  const hareketler = veri.hareketler.filter((h) => h.santiyeId === s.id)
  const avanslar = veri.avanslar.filter((a) => a.santiyeId === s.id)
  /* Harcama, avans ve tahsilat tek listede; en yeni üstte */
  const harcamaListesi: ({ tur: 'hareket'; tarih: string; olusturma: string; h: Hareket } | { tur: 'avans'; tarih: string; olusturma: string; a: Avans })[] = [
    ...hareketler.map((h) => ({ tur: 'hareket' as const, tarih: h.tarih, olusturma: h.olusturma, h })),
    ...avanslar.map((a) => ({ tur: 'avans' as const, tarih: a.tarih, olusturma: a.olusturma, a })),
  ].sort((x, y) => y.tarih.localeCompare(x.tarih) || y.olusturma.localeCompare(x.olusturma))

  const malzemeCsv = () =>
    csvIndir(
      `${s.ad}-malzeme-ozeti.csv`,
      ['Malzeme', 'Toplam miktar', 'Birim', 'Ortalama fiyat', 'Toplam tutar', 'Sefer'],
      malzemeler.map((m) => [m.ad, m.miktar, m.birim, m.ortFiyat, m.tutar, m.sefer]),
    )

  return (
    <div>
      <Baslik
        baslik={s.ad}
        alt={
          <span className="flex flex-wrap items-center gap-2">
            {s.firmaId ? (
              <button type="button" className="hover:underline" onClick={() => git(`/cariler/${s.firmaId}`)}>
                {adBul(veri.cariler, s.firmaId)}
              </button>
            ) : (
              'Firma seçilmedi'
            )}
            {s.adres && <span>· {s.adres}</span>}
            <Rozet ton={s.durum === 'aktif' ? 'yesil' : 'gri'}>{s.durum === 'aktif' ? 'Devam ediyor' : 'Tamamlandı'}</Rozet>
          </span>
        }
        sag={
          <div className="flex flex-wrap gap-2 print:hidden">
            <Dugme tur="ana" onClick={() => git(`/gonder?santiye=${s.id}`)}>
              <Truck size={18} /> Malzeme gönder
            </Dugme>
            <Dugme onClick={() => setHarcama({ acik: true, varsayilan: { tur: 'gider', santiyeId: s.id } })}>
              <Wallet size={17} /> Harcama
            </Dugme>
            <Dugme onClick={() => setAvans({ acik: true })}>
              <HardHat size={17} /> Avans
            </Dugme>
            <Dugme onClick={() => setHarcama({ acik: true, varsayilan: { tur: 'gelir', kategori: 'Tahsilat', santiyeId: s.id, cariId: s.firmaId } })}>
              <Plus size={17} /> Tahsilat
            </Dugme>
            <Dugme tur="hayalet" onClick={() => window.print()} aria-label="Yazdır">
              <Printer size={18} />
            </Dugme>
            <Dugme tur="hayalet" onClick={() => setDuzenle(true)} aria-label="Düzenle">
              <Pencil size={18} />
            </Dugme>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Ozet etiket="Toplam maliyet" deger={para(o.maliyet)} alt="Giden + harcama + avans" />
        <Ozet etiket="Giden malzeme" deger={para(o.malzeme)} alt={`Nakliye ${para(o.nakliye)} · Hizmet ${para(o.hizmet)}`} />
        <Ozet etiket="Harcama ve avans" deger={para(o.gider + o.avans)} alt={`Harcama ${para(o.gider)} · Avans ${para(o.avans)}`} />
        <Ozet etiket="Firmadan kalan" deger={para(o.kalan)} ton={o.kalan > 0 ? 'uyari' : 'iyi'} alt={`Tahsil edilen ${para(o.tahsilat)}`} />
      </div>

      <div className="mt-5 print:hidden">
        <Sekmeler
          secili={sekme}
          sec={setSekme}
          secenekler={[
            ['malzeme', 'Ne gitti', malzemeler.length],
            ['sevkiyat', 'Sevkiyatlar', sevkiyatlar.length],
            ['harcama', 'Harcama, avans, tahsilat', harcamaListesi.length],
          ]}
        />
      </div>

      {sekme === 'malzeme' && (
        <Kart>
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="font-semibold">Malzeme özeti</h2>
            <Dugme kucuk onClick={malzemeCsv} disabled={!malzemeler.length} className="print:hidden">
              <Download size={15} /> Excel
            </Dugme>
          </div>
          {malzemeler.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-y border-stone-100 text-left text-xs text-stone-500 dark:border-stone-800">
                    <th className="px-4 py-2 font-medium">Malzeme</th>
                    <th className="px-4 py-2 text-right font-medium">Toplam miktar</th>
                    <th className="px-4 py-2 text-right font-medium">Ort. fiyat</th>
                    <th className="px-4 py-2 text-right font-medium">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {malzemeler.map((m) => {
                    const acik = acikMalzeme === m.anahtar
                    const gecmis = sevkiyatlar.flatMap((x) => x.kalemler.filter((k) => kalemAnahtari(k) === m.anahtar).map((k) => ({ x, k })))
                    return (
                      <Fragment key={m.anahtar}>
                        <tr
                          className="cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50"
                          onClick={() => setAcikMalzeme(acik ? null : m.anahtar)}
                          aria-expanded={acik}
                        >
                          <td className="px-4 py-2.5 font-medium text-stone-900 dark:text-stone-100">
                            <span className="inline-flex items-center gap-1.5">
                              <ChevronRight size={15} className={'shrink-0 text-stone-400 transition print:hidden ' + (acik ? 'rotate-90' : '')} />
                              {m.ad} <span className="text-xs font-normal text-stone-400">· {m.sefer} sefer</span>
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            {sayi(m.miktar)} {m.birim}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{para(m.ortFiyat)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{para(m.tutar)}</td>
                        </tr>
                        {acik && (
                          <tr className="bg-stone-50 dark:bg-stone-950/60">
                            <td colSpan={4} className="px-4 py-2">
                              <div className="mb-1 text-xs font-medium text-stone-500">Bu malzemenin gittiği sevkiyatlar · düzenlemek için dokunun</div>
                              <ul className="divide-y divide-stone-200/70 dark:divide-stone-800">
                                {gecmis.map(({ x, k }, i) => (
                                  <li key={x.id + i}>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        git(`/gonder/${x.id}`)
                                      }}
                                      className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left hover:bg-white dark:hover:bg-stone-800"
                                    >
                                      <span className="min-w-0">
                                        <span className="font-medium">{tarihGoster(x.tarih)}</span>
                                        <span className="text-stone-500">
                                          {x.irsaliyeNo && ` · İrsaliye ${x.irsaliyeNo}`}
                                          {x.tedarikciId && ` · ${adBul(veri.cariler, x.tedarikciId)}`}
                                        </span>
                                        <span className="block text-xs text-stone-500 tabular-nums">
                                          {sayi(k.miktar)} {k.birim} × {para(k.birimFiyat)}
                                        </span>
                                      </span>
                                      <span className="flex shrink-0 items-center gap-1 font-semibold tabular-nums">
                                        {para(satirTutari(k))}
                                        <Pencil size={14} className="text-stone-400" />
                                      </span>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-stone-200 dark:border-stone-700">
                    <td className="px-4 py-3 font-semibold" colSpan={3}>
                      Toplam malzeme
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{para(o.malzeme)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <Bos baslik="Bu şantiyeye henüz malzeme gitmedi" eylem={<Dugme tur="ana" onClick={() => git(`/gonder?santiye=${s.id}`)}><Truck size={18} /> Malzeme gönder</Dugme>} />
          )}
        </Kart>
      )}

      {sekme === 'sevkiyat' && (
        <Kart>
          {sevkiyatlar.length ? (
            <Liste>
              {sevkiyatlar.map((x) => (
                <Satir
                  key={x.id}
                  onClick={() => git(`/gonder/${x.id}`)}
                  sol={`${tarihGoster(x.tarih)}${x.irsaliyeNo ? ' · İrsaliye ' + x.irsaliyeNo : ''}`}
                  alt={x.kalemler.map((k) => `${k.ad} ${sayi(k.miktar)} ${k.birim}`).join(' · ')}
                  sag={<span className="font-semibold">{para(sevkiyatToplami(x))}</span>}
                />
              ))}
            </Liste>
          ) : (
            <Bos baslik="Sevkiyat yok" />
          )}
        </Kart>
      )}

      {sekme === 'harcama' && (
        <Kart>
          {harcamaListesi.length ? (
            <Liste>
              {harcamaListesi.map((r) =>
                r.tur === 'avans' ? (
                  <div key={r.a.id} className="flex items-center gap-1 pr-2">
                    <Satir
                      className="flex-1"
                      onClick={() => setAvans({ acik: true, kayit: r.a })}
                      sol={
                        <span className="flex items-center gap-2">
                          <Rozet ton="sari">Avans</Rozet>
                          {adBul(veri.isciler, r.a.isciId) || 'İşçi silinmiş'}
                        </span>
                      }
                      alt={`${tarihGoster(r.a.tarih)} · İşçi avansı${r.a.aciklama ? ' · ' + r.a.aciklama : ''}`}
                      sag={<span className="font-semibold">−{para(r.a.tutar)}</span>}
                    />
                    <button
                      type="button"
                      aria-label="Sil"
                      className="grid size-9 shrink-0 place-items-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                      onClick={async () => bildir('Avans silindi', await sil('avanslar', r.a.id))}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div key={r.h.id} className="flex items-center gap-1 pr-2">
                    <Satir
                      className="flex-1"
                      onClick={() => setHarcama({ acik: true, kayit: r.h })}
                      sol={r.h.aciklama || r.h.kategori}
                      alt={`${tarihGoster(r.h.tarih)} · ${r.h.kategori}${r.h.cariId ? ' · ' + adBul(veri.cariler, r.h.cariId) : ''}`}
                      sag={
                        <span className={r.h.tur === 'gelir' ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'font-semibold'}>
                          {r.h.tur === 'gelir' ? '+' : '−'}
                          {para(r.h.tutar)}
                        </span>
                      }
                    />
                    <button
                      type="button"
                      aria-label="Sil"
                      className="grid size-9 shrink-0 place-items-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                      onClick={async () => bildir('Kayıt silindi', await sil('hareketler', r.h.id))}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ),
              )}
            </Liste>
          ) : (
            <Bos baslik="Bu şantiyeye ait harcama, avans ya da tahsilat yok" aciklama="Üstteki Harcama, Avans ya da Tahsilat düğmesiyle ekleyin." />
          )}
        </Kart>
      )}

      {s.notlar && (
        <Kart className="mt-4 p-4 text-sm text-stone-600 dark:text-stone-400">
          <b className="text-stone-800 dark:text-stone-200">Not: </b>
          {s.notlar}
        </Kart>
      )}

      <div className="mt-6 print:hidden">
        <Dugme
          tur="hayalet"
          className="text-red-600"
          onClick={async () => {
            if (sevkiyatlar.length && !confirm(`Bu şantiyenin ${sevkiyatlar.length} sevkiyatı da silinecek. Emin misiniz?`)) return
            const geriler = [await sil('santiyeler', s.id)]
            for (const x of sevkiyatlar) geriler.push(await sil('sevkiyatlar', x.id))
            git('/santiyeler')
            bildir('Şantiye silindi', async () => {
              for (const g of geriler) await g()
            })
          }}
        >
          <Trash2 size={16} /> Şantiyeyi sil
        </Dugme>
      </div>

      <SantiyeFormu acik={duzenle} kapat={() => setDuzenle(false)} kayit={s} veri={veri} />
      <HareketFormu acik={harcama.acik} kapat={() => setHarcama({ acik: false })} kayit={harcama.kayit} varsayilan={harcama.varsayilan} veri={veri} />
      <AvansFormu acik={avans.acik} kapat={() => setAvans({ acik: false })} kayit={avans.kayit} santiyeId={s.id} veri={veri} />
    </div>
  )
}
