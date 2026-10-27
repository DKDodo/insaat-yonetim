import { useState } from 'react'
import { SilinenlerListesi, TABLO_ADLARI } from '../components/SilinenlerListesi'
import { Baslik, Sekmeler } from '../components/ui'
import { TABLOLAR, type TabloAdi } from '../db'
import type { TumVeri } from '../lib/veri'

export default function Silinenler({ veri }: { veri: TumVeri }) {
  const [tablo, setTablo] = useState<TabloAdi | 'hepsi'>('hepsi')
  return (
    <div>
      <Baslik baslik="Silinenler" alt="Yanlışlıkla silinen her şey burada; tek dokunuşla geri alın." />
      <Sekmeler secili={tablo} sec={setTablo} secenekler={[['hepsi', 'Tümü'], ...TABLOLAR.map((t) => [t, TABLO_ADLARI[t]] as [TabloAdi, string])]} />
      <SilinenlerListesi veri={veri} tablo={tablo === 'hepsi' ? undefined : tablo} />
    </div>
  )
}
