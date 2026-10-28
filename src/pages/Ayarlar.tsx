import { Cloud, Database, Download, FlaskConical, KeyRound, LogOut, Moon, RefreshCw, Smartphone, Sun, Trash2, Upload } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { Baslik, Dugme, Etiket, Girdi, Kart, useBildirim } from '../components/ui'
import { cikis, sifreBelirle, useOturum } from '../lib/bulut'
import { bulutHazir } from '../lib/bulutAyar'
import { buluttanYenidenIndir, esitle, useEsitleme, type EsitlemeHali } from '../lib/esitleme'
import { TelefonaGec } from '../components/TelefonaGec'
import { bugun } from '../lib/format'
import { YAYIN_ADRESI } from '../lib/yayin'
import { ornekKayitlariBul, ornekVerileriKaldir, ornekVeriYukle } from '../lib/ornek'
import { elleYedekAlindi, simdiYedekle, sonElleYedek, useYedekDurumu } from '../lib/otoyedek'
import { useTema } from '../lib/tema'
import { dosyaIndir, hepsiniSil, useCanli, yedekAl, yedektenYukle, type TumVeri } from '../lib/veri'

export default function Ayarlar({ veri }: { veri: TumVeri }) {
  const bildir = useBildirim()
  const dosya = useRef<HTMLInputElement>(null)
  const [tema, temaDegistir] = useTema()
  const [bekle, setBekle] = useState(false)
  const yd = useYedekDurumu()
  const [telefon, setTelefon] = useState(false)
  const { oturum } = useOturum()
  const bulutAcik = bulutHazir() && !!oturum
  const ornekSayisi = useCanli(async () => (await ornekKayitlariBul()).toplam) ?? 0
  const kayitSayisi =
    veri.cariler.length + veri.santiyeler.length + veri.malzemeler.length + veri.sevkiyatlar.length + veri.hareketler.length + veri.vadeler.length + veri.isciler.length + veri.avanslar.length

  return (
    <div className="max-w-3xl">
      <Baslik baslik="Ayarlar ve Yedek" alt={`Bu cihazda ${kayitSayisi} kayıt var.`} />

      <div className="grid gap-4">
        <Bolum
          simge={<Database size={20} />}
          baslik="Yedek"
          aciklama={
            yd.masaustu
              ? 'Masaüstü sürümü her değişiklikten birkaç saniye sonra tüm verileri kendiliğinden yedekler. Haftada bir de yedeği bilgisayar dışına (e-posta, USB bellek, bulut) kopyalayın.'
              : 'Bu cihazda otomatik yedek klasörü yok. Haftada en az bir kez yedek indirip bilgisayar dışında (e-posta, bulut) saklayın.'
          }
        >
          {yd.masaustu && (
            <div className={'mb-4 rounded-xl px-3 py-2.5 text-sm ' + (yd.sonHata ? 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200' : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200')}>
              {yd.sonHata ? (
                <>
                  <b>Otomatik yedek alınamadı:</b> {yd.sonHata}. Hemen elle yedek indirin.
                </>
              ) : (
                <>
                  <b>Otomatik yedek açık.</b> Son yedek: {yd.sonYedek ? new Date(yd.sonYedek).toLocaleString('tr-TR') : 'henüz yok'}
                  {yd.calisiyor && ' (yedekleniyor…)'}
                </>
              )}
              {yd.klasor && <div className="mt-1 text-xs break-all opacity-80">Klasör: {yd.klasor}</div>}
            </div>
          )}
          {!yd.masaustu && (
            <p className="mb-4 text-sm text-stone-600 dark:text-stone-400">
              Son elle alınan yedek: {sonElleYedek() ? new Date(sonElleYedek()!).toLocaleString('tr-TR') : <b className="text-red-600 dark:text-red-400">hiç alınmadı</b>}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {yd.masaustu && (
              <Dugme onClick={async () => bildir((await simdiYedekle()) ? 'Yedek alındı' : 'Yedek alınamadı')} disabled={yd.calisiyor}>
                <Database size={17} /> Şimdi yedekle
              </Dugme>
            )}
            <Dugme
              tur="ana"
              onClick={async () => {
                const y = await yedekAl()
                dosyaIndir(`insaat-takip-yedek-${bugun()}.json`, JSON.stringify(y, null, 1), 'application/json')
                elleYedekAlindi()
                bildir('Yedek indirildi')
              }}
            >
              <Download size={17} /> Yedek indir
            </Dugme>
            <Dugme onClick={() => dosya.current?.click()} disabled={bekle}>
              <Upload size={17} /> Yedekten geri yükle
            </Dugme>
            <input
              ref={dosya}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f) return
                if (!confirm('Bu cihazdaki tüm veriler silinip yedekteki verilerle değiştirilecek. Devam edilsin mi?')) return
                setBekle(true)
                try {
                  const n = await yedektenYukle(JSON.parse(await f.text()))
                  bildir(`Yedek yüklendi: ${n} kayıt`)
                } catch (err) {
                  alert(err instanceof Error ? err.message : 'Dosya okunamadı.')
                } finally {
                  setBekle(false)
                }
              }}
            />
          </div>
        </Bolum>

        <Bolum simge={tema === 'koyu' ? <Moon size={20} /> : <Sun size={20} />} baslik="Görünüm" aciklama="Sağ üstteki lamba düğmesiyle de değiştirebilirsiniz.">
          <div className="flex gap-2">
            <Dugme tur={tema === 'acik' ? 'ana' : 'ikincil'} onClick={() => temaDegistir('acik')}>
              <Sun size={17} /> Açık tema
            </Dugme>
            <Dugme tur={tema === 'koyu' ? 'ana' : 'ikincil'} onClick={() => temaDegistir('koyu')}>
              <Moon size={17} /> Koyu tema
            </Dugme>
          </div>
        </Bolum>

        <Bolum simge={<Smartphone size={20} />} baslik="iPhone'a uygulama olarak ekle" aciklama="Karekodu iPhone kamerasıyla okutun, açılan sayfada Paylaş → Ana Ekrana Ekle'yi seçin. Simgeye dokununca tam ekran açılır.">
          <Dugme onClick={() => setTelefon(true)}>
            <Smartphone size={17} /> Telefondan devam et (karekod)
          </Dugme>
          <p className="mt-3 text-sm text-stone-500">Mac'te: Safari'de {YAYIN_ADRESI} adresini açıp Dosya → Dock'a Ekle.</p>
          <TelefonaGec acik={telefon} kapat={() => setTelefon(false)} />
        </Bolum>

        <BulutBolumu />

        {ornekSayisi > 0 && (
          <Bolum simge={<FlaskConical size={20} />} baslik="Örnek veriler yüklü" aciklama={`Bu cihazda ${ornekSayisi} örnek kayıt var. Kaldırdığınızda yalnız örnek kayıtlar silinir; sizin girdiğiniz kayıtlara dokunulmaz.`}>
            <Dugme
              tur="ana"
              onClick={async () => {
                if (!confirm(`${ornekSayisi} örnek kayıt kaldırılacak. Sizin girdiğiniz kayıtlara dokunulmaz. Devam edilsin mi?`)) return
                const n = await ornekVerileriKaldir()
                bildir(`${n} örnek kayıt kaldırıldı`)
              }}
            >
              <Trash2 size={17} /> Örnek verileri kaldır
            </Dugme>
          </Bolum>
        )}

        {kayitSayisi === 0 && !bulutAcik && (
          <Bolum simge={<FlaskConical size={20} />} baslik="Örnek verilerle dene" aciklama="Uygulamayı tanımak için kurgusal şantiye, malzeme ve cari kayıtları yükler. Sonra 'Tüm verileri sil' ile temizleyebilirsiniz.">
            <Dugme
              onClick={async () => {
                await ornekVeriYukle()
                bildir('Örnek veriler yüklendi')
              }}
            >
              <FlaskConical size={17} /> Örnek verileri yükle
            </Dugme>
          </Bolum>
        )}

        {!bulutAcik && (
          <Bolum simge={<Trash2 size={20} />} baslik="Tüm verileri sil" aciklama="Bu cihazdaki bütün kayıtları siler. Önce yedek alın.">
            <Dugme
              tur="tehlike"
              disabled={!kayitSayisi}
              onClick={async () => {
                if (!confirm('Bu cihazdaki TÜM kayıtlar silinecek. Emin misiniz?')) return
                const yazilan = prompt('Onaylamak için SİL yazın')
                if (yazilan === null) return
                // Klavye Türkçe olmasa da kabul et: SİL, SIL, sil, sıl
                if (!['sil', 'sıl'].includes(yazilan.trim().toLocaleLowerCase('tr-TR'))) {
                  alert('Silme iptal edildi: onay için SİL yazılmadı. Hiçbir kayıt silinmedi.')
                  return
                }
                const y = await yedekAl()
                dosyaIndir(`insaat-takip-silmeden-once-${bugun()}.json`, JSON.stringify(y), 'application/json')
                await hepsiniSil()
                bildir('Tüm veriler silindi; silmeden önceki yedek indirildi')
              }}
            >
              <Trash2 size={17} /> Tüm verileri sil
            </Dugme>
          </Bolum>
        )}
      </div>
      <p className="mt-8 text-center text-xs text-stone-400">İnşaat Takip · sürüm {__SURUM__}</p>
    </div>
  )
}

const HAL_YAZISI: Record<EsitlemeHali, string> = {
  kapali: 'Bağlı değil',
  esitleniyor: 'Eşitleniyor…',
  esit: 'Eşit, her şey bulutta',
  cevrimdisi: 'İnternet yok; değişiklikler cihazda bekliyor, bağlanınca gönderilecek',
  hata: 'Eşitleme hatası',
  yetkisiz: 'Bu hesabın bulut izni yok',
}

function BulutBolumu() {
  const bildir = useBildirim()
  const { oturum } = useOturum()
  const e = useEsitleme()
  const [sifre, setSifre] = useState('')
  const [sifreAcik, setSifreAcik] = useState(false)
  if (!bulutHazir())
    return (
      <Bolum simge={<Cloud size={20} />} baslik="Bulut eşitleme" aciklama="Telefon, Mac ve bilgisayarın aynı verileri anında görmesi için Supabase bağlantısı kuruluyor. Bağlanana kadar her cihaz kendi verisini tutar.">
        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Hazırlanıyor</p>
      </Bolum>
    )
  const iyi = e.hal === 'esit'
  const kotu = e.hal === 'hata' || e.hal === 'yetkisiz'
  return (
    <Bolum simge={<Cloud size={20} />} baslik="Bulut eşitleme" aciklama="Veriler her cihazda tam kopya olarak durur, internet yokken de çalışır; bağlanınca bulutla eşitlenir. Bulutta hiçbir kayıt kalıcı silinmez, her değişikliğin geçmişi tutulur.">
      <div className={'mb-4 rounded-xl px-3 py-2.5 text-sm ' + (kotu ? 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200' : iyi ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200' : 'bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200')}>
        <b>{HAL_YAZISI[e.hal]}</b>
        {e.bekleyen > 0 && <> · {e.bekleyen} değişiklik gönderilmeyi bekliyor</>}
        {e.son && <div className="mt-0.5 text-xs opacity-80">Son eşitleme: {new Date(e.son).toLocaleString('tr-TR')}</div>}
        {e.hata && kotu && <div className="mt-0.5 text-xs break-words opacity-80">{e.hata}</div>}
        {oturum?.user.email && <div className="mt-0.5 text-xs opacity-80">Hesap: {oturum.user.email}</div>}
      </div>
      <div className="flex flex-wrap gap-2">
        <Dugme onClick={() => void esitle()} disabled={e.hal === 'esitleniyor'}>
          <RefreshCw size={17} /> Şimdi eşitle
        </Dugme>
        <Dugme onClick={() => setSifreAcik((x) => !x)}>
          <KeyRound size={17} /> Şifreyi değiştir
        </Dugme>
        <Dugme
          onClick={async () => {
            if (!confirm('Bu cihazdaki kopya silinip buluttan baştan indirilecek. Buluttaki verilere dokunulmaz. Devam edilsin mi?')) return
            try {
              await buluttanYenidenIndir()
              bildir('Buluttan yeniden indirildi')
            } catch (err) {
              alert(err instanceof Error ? err.message : String(err))
            }
          }}
        >
          <Download size={17} /> Buluttan yeniden indir
        </Dugme>
        <Dugme
          tur="hayalet"
          onClick={async () => {
            if (e.bekleyen > 0 && !confirm('Gönderilmemiş değişiklikler var. Çıkış yapsanız da cihazda kalırlar ve yeniden girince gönderilirler. Çıkılsın mı?')) return
            await cikis()
          }}
        >
          <LogOut size={17} /> Çıkış yap
        </Dugme>
      </div>
      {sifreAcik && (
        <form
          className="mt-4 flex flex-wrap items-end gap-2"
          onSubmit={async (ev) => {
            ev.preventDefault()
            try {
              await sifreBelirle(sifre)
              setSifre('')
              setSifreAcik(false)
              bildir('Yeni şifre kaydedildi; bundan sonra bu şifreyle girin')
            } catch (err) {
              alert(err instanceof Error ? err.message : String(err))
            }
          }}
        >
          <Etiket etiket="Yeni şifre (en az 10 karakter)" className="min-w-[240px] flex-1">
            <Girdi type="password" autoComplete="new-password" value={sifre} onChange={(ev) => setSifre(ev.target.value)} />
          </Etiket>
          <Dugme tur="ana" type="submit">
            Kaydet
          </Dugme>
        </form>
      )}
    </Bolum>
  )
}

function Bolum({ simge, baslik, aciklama, children }: { simge: ReactNode; baslik: string; aciklama: string; children: ReactNode }) {
  return (
    <Kart className="p-5">
      <div className="flex gap-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">{simge}</div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-stone-900 dark:text-white">{baslik}</h2>
          <p className="mt-1 mb-4 text-sm text-stone-500">{aciklama}</p>
          {children}
        </div>
      </div>
    </Kart>
  )
}
