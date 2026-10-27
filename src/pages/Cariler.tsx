import { CalendarClock, Download, Pencil, Phone, Plus, Search, Trash2, Users, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CariFormu, HareketFormu, VadeFormu } from '../components/formlar'
import { Baslik, Bos, Dugme, Girdi, Kart, Ozet, Rozet, Sekmeler, cx, useBildirim } from '../components/ui'
import { CARI_TURLERI, type Cari, type CariTur, type Hareket } from '../db'
import { para, tarihGoster, yuvarla } from '../lib/format'
import { cariBakiye, malzemeTutari, sevkiyatToplami } from '../lib/hesap'
import { adBul, csvIndir, sil, type TumVeri } from '../lib/veri'

function bakiyeYazisi(c: Cari, b: number): { metin: string; ton: 'iyi' | 'kotu' | undefined } {
  if (Math.abs(b) < 0.005) return { metin: 'Hesap kapalı', ton: undefined }
  if (b > 0) return { metin: c.tur === 'firma' ? 'Size borçlu' : 'Alacaklısınız', ton: 'iyi' }
  return { metin: 'Siz borçlusunuz', ton: 'kotu' }
}

export function Cariler({ veri }: { veri: TumVeri }) {
  const git = useNavigate()
  const [tur, setTur] = useState<CariTur | 'hepsi'>('hepsi')
  const [ara, setAra] = useState('')
  const [pencere, setPencere] = useState(false)
  const santiyeFirma = useMemo(() => new Map(veri.santiyeler.map((s) => [s.id, s.firmaId])), [veri.santiyeler])

  const liste = veri.cariler
    .filter((c) => tur === 'hepsi' || c.tur === tur)
    .filter((c) => !ara.trim() || c.ad.toLocaleLowerCase('tr-TR').includes(ara.trim().toLocaleLowerCase('tr-TR')))
    .map((c) => ({ c, b: cariBakiye(c, santiyeFirma, veri.sevkiyatlar, veri.hareketler) }))

  const alacak = yuvarla(liste.filter((x) => x.b.bakiye > 0).reduce((t, x) => t + x.b.bakiye, 0))
  const borc = yuvarla(liste.filter((x) => x.b.bakiye < 0).reduce((t, x) => t - x.b.bakiye, 0))
  const say = (t: CariTur) => veri.cariler.filter((c) => c.tur === t).length

  return (
    <div>
      <Baslik
        baslik="Cari Hesaplar"
        alt="İnşaat firmaları, tedarikçiler ve diğerleri."
        sag={
          <Dugme tur="ana" onClick={() => setPencere(true)}>
            <Plus size={18} /> Yeni cari
          </Dugme>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Ozet etiket="Toplam alacağınız" deger={para(alacak)} ton="iyi" />
        <Ozet etiket="Toplam borcunuz" deger={para(borc)} ton={borc > 0 ? 'kotu' : undefined} />
      </div>
      <Sekmeler
        secili={tur}
        sec={setTur}
        secenekler={[
          ['hepsi', 'Tümü', veri.cariler.length],
          ['firma', 'Firmalar', say('firma')],
          ['tedarikci', 'Tedarikçiler', say('tedarikci')],
          ['diger', 'Diğer', say('diger')],
        ]}
      />
      <div className="relative mb-4">
        <Search size={17} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-stone-400" />
        <Girdi value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Cari ara" className="pl-9" />
      </div>
      {liste.length ? (
        <Kart>
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {liste.map(({ c, b }) => {
              const y = bakiyeYazisi(c, b.bakiye)
              return (
                <button key={c.id} type="button" onClick={() => git(`/cariler/${c.id}`)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800/60">
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-stone-100 text-sm font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                    {c.ad.slice(0, 1).toLocaleUpperCase('tr-TR')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-stone-900 dark:text-stone-100">{c.ad}</div>
                    <div className="text-[13px] text-stone-500">{CARI_TURLERI[c.tur]}</div>
                  </div>
                  <div className="text-right tabular-nums">
                    <div className={cx('font-semibold', y.ton === 'iyi' && 'text-emerald-600 dark:text-emerald-400', y.ton === 'kotu' && 'text-red-600 dark:text-red-400')}>
                      {para(Math.abs(b.bakiye))}
                    </div>
                    <div className="text-xs text-stone-500">{y.metin}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </Kart>
      ) : (
        <Kart>
          <Bos simge={<Users size={40} />} baslik="Cari yok" eylem={<Dugme tur="ana" onClick={() => setPencere(true)}><Plus size={18} /> Cari ekle</Dugme>} />
        </Kart>
      )}
      <CariFormu acik={pencere} kapat={() => setPencere(false)} varsayilanTur={tur === 'hepsi' ? 'firma' : tur} olustu={(c) => git(`/cariler/${c.id}`)} />
    </div>
  )
}

interface EkstreSatiri {
  anahtar: string
  tarih: string
  aciklama: string
  borc: number
  alacak: number
  bakiye: number
  hareket?: Hareket
  sevkiyatId?: string
}

export function CariDetay({ veri }: { veri: TumVeri }) {
  const { id } = useParams()
  const git = useNavigate()
  const bildir = useBildirim()
  const [duzenle, setDuzenle] = useState(false)
  const [hareket, setHareket] = useState<{ acik: boolean; kayit?: Hareket; varsayilan?: Partial<Hareket> }>({ acik: false })
  const [vade, setVade] = useState(false)
  const c = veri.cariler.find((x) => x.id === id)
  const santiyeFirma = useMemo(() => new Map(veri.santiyeler.map((s) => [s.id, s.firmaId])), [veri.santiyeler])

  if (!c) return <Bos baslik="Cari bulunamadı" eylem={<Dugme onClick={() => git('/cariler')}>Carilere dön</Dugme>} />

  const b = cariBakiye(c, santiyeFirma, veri.sevkiyatlar, veri.hareketler)
  const y = bakiyeYazisi(c, b.bakiye)

  /* Ekstre: bakiye artışı "borç" sütununda (size borçlanma), azalışı "alacak" sütununda */
  const ham: Omit<EkstreSatiri, 'bakiye'>[] = []
  if (c.tur === 'firma') {
    for (const s of veri.sevkiyatlar.filter((s) => santiyeFirma.get(s.santiyeId) === c.id))
      ham.push({ anahtar: s.id, tarih: s.tarih, aciklama: `Malzeme · ${adBul(veri.santiyeler, s.santiyeId)}`, borc: sevkiyatToplami(s), alacak: 0, sevkiyatId: s.id })
  }
  if (c.tur === 'tedarikci') {
    for (const s of veri.sevkiyatlar.filter((s) => s.tedarikciId === c.id))
      ham.push({ anahtar: s.id, tarih: s.tarih, aciklama: `Alınan malzeme · ${adBul(veri.santiyeler, s.santiyeId)}`, borc: 0, alacak: malzemeTutari(s), sevkiyatId: s.id })
  }
  for (const h of veri.hareketler.filter((h) => h.cariId === c.id))
    ham.push({
      anahtar: h.id,
      tarih: h.tarih,
      aciklama: `${h.kategori}${h.aciklama ? ' · ' + h.aciklama : ''}`,
      borc: h.tur === 'gider' ? h.tutar : 0,
      alacak: h.tur === 'gelir' ? h.tutar : 0,
      hareket: h,
    })
  ham.sort((a, z) => a.tarih.localeCompare(z.tarih))
  let yuruyen = 0
  const ekstre: EkstreSatiri[] = ham.map((r) => {
    yuruyen = yuvarla(yuruyen + r.borc - r.alacak)
    return { ...r, bakiye: yuruyen }
  })
  const bekleyenVade = veri.vadeler.filter((v) => v.cariId === c.id && v.durum === 'bekliyor')
  const santiyeleri = veri.santiyeler.filter((s) => s.firmaId === c.id)

  return (
    <div>
      <Baslik
        baslik={c.ad}
        alt={
          <span className="flex flex-wrap items-center gap-2">
            <Rozet>{CARI_TURLERI[c.tur]}</Rozet>
            {c.telefon && (
              <a href={`tel:${c.telefon.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 hover:underline">
                <Phone size={14} /> {c.telefon}
              </a>
            )}
          </span>
        }
        sag={
          <div className="flex flex-wrap gap-2 print:hidden">
            <Dugme tur="ana" onClick={() => setHareket({ acik: true, varsayilan: { tur: c.tur === 'tedarikci' ? 'gider' : 'gelir', kategori: c.tur === 'tedarikci' ? 'Ödeme' : 'Tahsilat', cariId: c.id } })}>
              <Wallet size={17} /> {c.tur === 'tedarikci' ? 'Ödeme yap' : 'Tahsilat al'}
            </Dugme>
            <Dugme onClick={() => setVade(true)}>
              <CalendarClock size={17} /> Vade ekle
            </Dugme>
            <Dugme
              tur="hayalet"
              aria-label="Ekstreyi Excel'e aktar"
              onClick={() =>
                csvIndir(`${c.ad}-ekstre.csv`, ['Tarih', 'Açıklama', 'Borç', 'Alacak', 'Bakiye'], ekstre.map((r) => [tarihGoster(r.tarih), r.aciklama, r.borc, r.alacak, r.bakiye]))
              }
            >
              <Download size={18} />
            </Dugme>
            <Dugme tur="hayalet" onClick={() => setDuzenle(true)} aria-label="Düzenle">
              <Pencil size={18} />
            </Dugme>
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Ozet etiket="Bakiye" deger={para(Math.abs(b.bakiye))} alt={y.metin} ton={y.ton} />
        <Ozet etiket={c.tur === 'tedarikci' ? 'Alınan malzeme' : 'Toplam borçlanma'} deger={para(c.tur === 'tedarikci' ? b.alacak : b.borc)} />
        <Ozet etiket={c.tur === 'tedarikci' ? 'Yapılan ödeme' : 'Tahsil edilen'} deger={para(c.tur === 'tedarikci' ? b.borc : b.alacak)} />
      </div>

      {santiyeleri.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {santiyeleri.map((s) => (
            <button key={s.id} type="button" onClick={() => git(`/santiyeler/${s.id}`)} className="rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-stone-200 hover:ring-amber-400 dark:bg-stone-900 dark:ring-stone-700">
              {s.ad}
            </button>
          ))}
        </div>
      )}

      {bekleyenVade.length > 0 && (
        <Kart className="mt-4 p-4">
          <h2 className="mb-2 font-semibold">Bekleyen vadeler</h2>
          <ul className="grid gap-1.5 text-sm">
            {bekleyenVade.map((v) => (
              <li key={v.id} className="flex justify-between gap-3">
                <span>
                  {tarihGoster(v.vade)} · {v.yon === 'tahsilat' ? 'Tahsilat' : 'Ödeme'}
                  {v.aciklama && <span className="text-stone-500"> · {v.aciklama}</span>}
                </span>
                <span className="font-semibold tabular-nums">{para(v.tutar)}</span>
              </li>
            ))}
          </ul>
        </Kart>
      )}

      <Kart className="mt-4">
        <h2 className="px-4 pt-4 pb-2 font-semibold">Hesap ekstresi</h2>
        {ekstre.length ? (
          <>
          {/* Telefon: her hareket bir satır; borç artı, alacak eksi, altta yürüyen bakiye */}
          <div className="divide-y divide-stone-100 border-t border-stone-100 md:hidden dark:divide-stone-800 dark:border-stone-800 print:hidden">
            {[...ekstre].reverse().map((r) => (
              <div key={r.anahtar} className="flex items-center gap-1 pr-2">
                <button
                  type="button"
                  onClick={() => (r.sevkiyatId ? git(`/gonder/${r.sevkiyatId}`) : setHareket({ acik: true, kayit: r.hareket }))}
                  className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left active:bg-stone-50 dark:active:bg-stone-800/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-stone-900 dark:text-stone-100">{r.aciklama}</div>
                    <div className="text-[13px] text-stone-500 tabular-nums">{tarihGoster(r.tarih)} · bakiye {para(r.bakiye)}</div>
                  </div>
                  <div className={cx('shrink-0 text-right font-semibold tabular-nums', r.alacak ? 'text-emerald-600 dark:text-emerald-400' : '')}>
                    {r.borc ? para(r.borc) : '−' + para(r.alacak)}
                    <div className="text-[11px] font-normal text-stone-500">{r.borc ? 'Borç' : 'Alacak'}</div>
                  </div>
                </button>
                {r.hareket && (
                  <button
                    type="button"
                    aria-label="Sil"
                    className="grid size-11 shrink-0 place-items-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                    onClick={async () => bildir('Kayıt silindi', await sil('hareketler', r.hareket!.id))}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block print:block">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-y border-stone-100 text-left text-xs text-stone-500 dark:border-stone-800">
                  <th className="px-4 py-2 font-medium">Tarih</th>
                  <th className="px-4 py-2 font-medium">Açıklama</th>
                  <th className="px-4 py-2 text-right font-medium">Borç</th>
                  <th className="px-4 py-2 text-right font-medium">Alacak</th>
                  <th className="px-4 py-2 text-right font-medium">Bakiye</th>
                  <th className="w-10 print:hidden" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {[...ekstre].reverse().map((r) => (
                  <tr key={r.anahtar} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                    <td className="px-4 py-2.5 whitespace-nowrap tabular-nums">{tarihGoster(r.tarih)}</td>
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        className="text-left hover:underline"
                        onClick={() => (r.sevkiyatId ? git(`/gonder/${r.sevkiyatId}`) : setHareket({ acik: true, kayit: r.hareket }))}
                      >
                        {r.aciklama}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{r.borc ? para(r.borc) : ''}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{r.alacak ? para(r.alacak) : ''}</td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums">{para(r.bakiye)}</td>
                    <td className="pr-2 print:hidden">
                      {r.hareket && (
                        <button
                          type="button"
                          aria-label="Sil"
                          className="grid size-8 place-items-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                          onClick={async () => bildir('Kayıt silindi', await sil('hareketler', r.hareket!.id))}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        ) : (
          <Bos baslik="Hareket yok" />
        )}
      </Kart>

      {c.notlar && <Kart className="mt-4 p-4 text-sm text-stone-600 dark:text-stone-400">{c.notlar}</Kart>}

      <div className="mt-6 print:hidden">
        <Dugme
          tur="hayalet"
          className="text-red-600"
          onClick={async () => {
            if (ekstre.length && !confirm('Bu carinin hareketleri kalır ama cari adı görünmez olur. Silinsin mi?')) return
            const geri = await sil('cariler', c.id)
            git('/cariler')
            bildir('Cari silindi', geri)
          }}
        >
          <Trash2 size={16} /> Cariyi sil
        </Dugme>
      </div>

      <CariFormu acik={duzenle} kapat={() => setDuzenle(false)} kayit={c} />
      <HareketFormu acik={hareket.acik} kapat={() => setHareket({ acik: false })} kayit={hareket.kayit} varsayilan={hareket.varsayilan} veri={veri} />
      <VadeFormu acik={vade} kapat={() => setVade(false)} veri={veri} varsayilanYon={c.tur === 'tedarikci' ? 'odeme' : 'tahsilat'} varsayilanCari={c.id} />
    </div>
  )
}
