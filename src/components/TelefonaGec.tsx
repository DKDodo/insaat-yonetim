import { Download, Share, SquarePlus, Smartphone } from 'lucide-react'
import { useMemo } from 'react'
import { renderSVG } from 'uqr'
import { bulutHazir } from '../lib/bulutAyar'
import { bugun } from '../lib/format'
import { elleYedekAlindi } from '../lib/otoyedek'
import { dosyaIndir, yedekAl } from '../lib/veri'
import { YAYIN_ADRESI } from '../lib/yayin'
import { Dugme, Pencere, useBildirim } from './ui'

/*
 * "Telefondan devam et": iPhone kamerasıyla okutulan karekod, uygulamayı aynı ekranda açar.
 * Bulut eşitleme açık değilse kayıtlar yedek dosyasıyla telefona taşınır.
 */
export function TelefonaGec({ acik, kapat }: { acik: boolean; kapat: () => void }) {
  const bildir = useBildirim()
  const adres = useMemo(() => YAYIN_ADRESI + (location.hash && location.hash !== '#/' ? location.hash : ''), [acik]) // eslint-disable-line react-hooks/exhaustive-deps
  const kare = useMemo(() => renderSVG(adres, { ecc: 'M', border: 2 }), [adres])
  return (
    <Pencere acik={acik} kapat={kapat} baslik="Telefondan devam et">
      <div className="grid gap-5 pb-2 sm:grid-cols-[220px_1fr] sm:items-start">
        <div className="mx-auto w-[220px] rounded-2xl bg-white p-3 shadow-sm ring-1 ring-stone-200">
          {/* Karekod yalnız sabit yayın adresinden ve bu ekranın yolundan üretilir. */}
          <div className="aspect-square [&>svg]:h-full [&>svg]:w-full" role="img" aria-label={`Karekod: ${adres}`} dangerouslySetInnerHTML={{ __html: kare }} />
        </div>
        <ol className="grid gap-3 text-[15px]">
          <Adim no={1} simge={<Smartphone size={18} />}>
            iPhone'da <b>Kamera</b>'yı açıp karekoda tutun, çıkan bağlantıya dokunun. Uygulama Safari'de bu ekranla açılır.
          </Adim>
          <Adim no={2} simge={<Share size={18} />}>
            Alttaki <b>Paylaş</b> düğmesine dokunun.
          </Adim>
          <Adim no={3} simge={<SquarePlus size={18} />}>
            <b>Ana Ekrana Ekle</b>'yi seçin. Baret simgesine dokununca uygulama tam ekran açılır.
          </Adim>
        </ol>
      </div>
      <p className="mt-4 rounded-xl bg-stone-100 px-3 py-2 text-xs break-all text-stone-600 dark:bg-stone-800 dark:text-stone-300">{adres}</p>

      {!bulutHazir() && (
        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-100 dark:ring-amber-900">
          <b>Kayıtlarınız telefona kendiliğinden gelmez.</b> Bulut eşitleme açılana kadar her cihaz kendi kaydını tutar. Kayıtlarla devam etmek için:
          <ol className="mt-2 grid list-decimal gap-1 pl-5">
            <li>Aşağıdan yedek dosyasını indirin.</li>
            <li>Dosyayı telefona gönderin (AirDrop, WhatsApp ya da e-posta).</li>
            <li>Telefondaki uygulamada Ayarlar → Yedekten geri yükle ile dosyayı seçin.</li>
          </ol>
          <Dugme
            className="mt-3"
            onClick={async () => {
              const y = await yedekAl()
              dosyaIndir(`insaat-takip-telefona-${bugun()}.json`, JSON.stringify(y), 'application/json')
              elleYedekAlindi()
              bildir('Yedek indirildi; telefona gönderebilirsiniz')
            }}
          >
            <Download size={17} /> Yedeği indir
          </Dugme>
        </div>
      )}
    </Pencere>
  )
}

function Adim({ no, simge, children }: { no: number; simge: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-amber-500 text-sm font-semibold text-stone-950">{no}</span>
      <span className="pt-1 text-stone-700 dark:text-stone-200">
        <span className="mr-1 inline-block align-[-3px] text-stone-400">{simge}</span>
        {children}
      </span>
    </li>
  )
}
