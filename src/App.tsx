import { useEffect, useRef, useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { HataSiniri } from './components/HataSiniri'
import { Kabuk } from './components/Kabuk'
import { BildirimSaglayici } from './components/ui'
import { bulut, izinliMi, useOturum } from './lib/bulut'
import { bulutHazir } from './lib/bulutAyar'
import { esitlemeBaslat, esitlemeDurdur, esitlemeIste } from './lib/esitleme'
import { degisiklikOldu, otoYedekBaslat } from './lib/otoyedek'
import { useTumu } from './lib/veri'
import Giris, { Yetkisiz } from './pages/Giris'
import Ayarlar from './pages/Ayarlar'
import { CariDetay, Cariler } from './pages/Cariler'
import Gonder from './pages/Gonder'
import Isciler from './pages/Isciler'
import Kasa from './pages/Kasa'
import Malzemeler from './pages/Malzemeler'
import Pano from './pages/Pano'
import Raporlar from './pages/Raporlar'
import SantiyeDetay from './pages/SantiyeDetay'
import Santiyeler from './pages/Santiyeler'
import Sevkiyatlar from './pages/Sevkiyatlar'
import Silinenler from './pages/Silinenler'
import Vadeler from './pages/Vadeler'

/*
 * Bulut bağlantısı ayarlıysa önce giriş istenir; giriş yapan hesap izinli değilse uygulama açılmaz.
 * Oturum cihazda saklanır: bir kez girdikten sonra internet yokken de açılır.
 */
export default function App() {
  const { hazir, oturum } = useOturum()
  const [izin, setIzin] = useState<boolean | null>(null)
  const kullanici = oturum?.user.id
  useEffect(() => {
    if (!kullanici) {
      setIzin(null)
      esitlemeDurdur()
      return
    }
    let canli = true
    void izinliMi().then((v) => {
      if (!canli) return
      setIzin(v)
      const b = bulut()
      if (v !== false && b) void esitlemeBaslat(b, kullanici)
    })
    return () => {
      canli = false
    }
  }, [kullanici])

  if (bulutHazir()) {
    if (!hazir) return <div className="grid min-h-dvh place-items-center bg-stone-100 text-sm text-stone-500 dark:bg-stone-950">Yükleniyor…</div>
    if (!oturum) return <Giris />
    if (izin === false) return <Yetkisiz eposta={oturum.user.email} />
  }
  return <Uygulama />
}

function Uygulama() {
  const veri = useTumu()
  const ilkVeri = useRef(true)
  useEffect(() => {
    void otoYedekBaslat()
  }, [])
  /* Her veri değişikliğinden sonra otomatik yedek (masaüstü) ve bulut eşitlemesi */
  useEffect(() => {
    if (!veri) return
    if (ilkVeri.current) {
      ilkVeri.current = false
      return
    }
    degisiklikOldu()
    esitlemeIste()
  }, [veri])
  return (
    <HashRouter>
      <BildirimSaglayici>
        <Kabuk>
          <HataSiniri>
          {!veri ? (
            <div className="grid min-h-[50vh] place-items-center text-sm text-stone-500">Yükleniyor…</div>
          ) : (
            <Routes>
              <Route path="/" element={<Pano veri={veri} />} />
              <Route path="/gonder" element={<Gonder key="yeni" veri={veri} />} />
              <Route path="/gonder/:id" element={<Gonder veri={veri} />} />
              <Route path="/sevkiyatlar" element={<Sevkiyatlar veri={veri} />} />
              <Route path="/santiyeler" element={<Santiyeler veri={veri} />} />
              <Route path="/santiyeler/:id" element={<SantiyeDetay veri={veri} />} />
              <Route path="/malzemeler" element={<Malzemeler veri={veri} />} />
              <Route path="/cariler" element={<Cariler veri={veri} />} />
              <Route path="/cariler/:id" element={<CariDetay veri={veri} />} />
              <Route path="/kasa" element={<Kasa veri={veri} />} />
              <Route path="/vadeler" element={<Vadeler veri={veri} />} />
              <Route path="/isciler" element={<Isciler veri={veri} />} />
              <Route path="/raporlar" element={<Raporlar veri={veri} />} />
              <Route path="/ayarlar" element={<Ayarlar veri={veri} />} />
              <Route path="/silinenler" element={<Silinenler veri={veri} />} />
              <Route path="*" element={<Pano veri={veri} />} />
            </Routes>
          )}
          </HataSiniri>
        </Kabuk>
      </BildirimSaglayici>
    </HashRouter>
  )
}
