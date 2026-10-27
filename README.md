# İnşaat Takip

Çağatay Kurtuluş için hazırlanan şantiye malzeme, maliyet, cari hesap, vade ve avans takip uygulaması.

## Kullanım (Windows)
`İnşaat Takip.exe`'ye çift tıklayın. İnternet gerekmez; uygulama kendi penceresinde açılır.
EXE ile yanındaki `uygulama` klasörü birlikte durmalıdır. Başka bir Windows bilgisayara ikisini birlikte kopyalayın.

Veriler: Edge'in bu uygulamaya ayrılmış profilinde (`%LOCALAPPDATA%\InsaatTakip`).
Otomatik yedekler: `Belgeler\İnşaat Takip Yedekleri` (her değişiklikten sonra; günde bir dosya, 180 gün).

## Geliştirme
```
npm install
npm run dev        # http://localhost:5173
npm test           # hesap testleri
npm run build      # dist/
powershell -ExecutionPolicy Bypass -File masaustu\exe_olustur.ps1   # uygulama/ + İnşaat Takip.exe
```

Yapı: React + TypeScript + Vite, Tailwind, Dexie (IndexedDB), PWA. Başlatıcı: `masaustu/Baslatici.cs` (Windows'un hazır C# derleyicisi).

Yol haritası: [ROADMAP.md](ROADMAP.md) · Gereksinimler: [GEREKSINIMLER.md](GEREKSINIMLER.md)
