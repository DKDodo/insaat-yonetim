# İnşaat Takip — Yol haritası

Çağatay Kurtuluş için hazırlanan şirket mali takip uygulaması. Bu liste kullanıcının (abisinin) istekleridir; her adım bitince işaretlenir. Ayrıntılı gereksinimler: [GEREKSINIMLER.md](GEREKSINIMLER.md).

Durum: ✅ bitti · 🔄 sürüyor · ⏳ sırada · ⏸ kullanıcı bekleniyor

## Kullanıcının istekleri (27 Ekim 2026)

| # | İstek | Durum |
|---|---|---|
| 1 | Proje futbol simülasyonunun içine değil, masaüstünde ayrı klasöre kurulsun | ✅ `C:\Users\pc\Desktop\insaat_yonetim` |
| 2 | Tek kullanıcı: kardeşi Çağatay Kurtuluş | ✅ |
| 3 | İnşaata giden malzeme, fiyatı, firmaya giden toplam malzeme maliyeti | ✅ Malzeme Gönder, şantiye özeti |
| 4 | Gelir ve giderler | ✅ Gelir / Gider ekranı |
| 5 | Cari hesaplar | ✅ Bakiye ve ekstre |
| 6 | Yaklaşan ödemeler ve tahsilatlar | ✅ Ödeme ve Tahsilat, Pano'da 14 gün |
| 7 | Giden malzemeler ve maliyet listesi | ✅ Giden Malzemeler, Excel |
| 8 | İşçilere ödenen avanslar | ✅ İşçiler ve Avans |
| 9 | Raporlar | ✅ Şantiye, malzeme, kategori, tedarikçi; Excel ve PDF |
| 10 | Her şey tek yerden, modern arayüz | ✅ |
| 11 | Hem bilgisayar hem iPhone 17 | 🔄 Web uygulaması (PWA); iPhone için yayın Adım 4 |
| 12 | Firma adına alım / nakliye; şantiyeye ne gitti, ne harcandı | ✅ Şantiye merkezli maliyet |
| 13 | Malzemeleri ve miktarlarını ekleyebileceği panel | ✅ Malzeme Gönder (hızlı malzeme düğmeleri, otomatik fiyat) |
| 14 | GitHub'a bağlansın (DKDodo) | 🔄 `DKDodo/insaat-yonetim` (özel) bağlandı; ilk gönderim kullanıcı onayıyla |
| 15 | Masaüstündeki klasöre EXE | ✅ `İnşaat Takip.exe` |
| 16 | Commit ve push öncesi kullanıcı kontrol edecek | ⏸ Kontrolden önce commit/push yapılmaz |
| 17 | Açık / koyu tema, sağ üstte lamba düğmesi | ✅ Seçim hatırlanır |
| 18 | Sol üstte "Çağatay Kurtuluş" imza etiketi | ✅ |
| 19 | Sarı inşaat bareti logosu (EXE ve program) | ✅ EXE simgesi, uygulama ve iPhone simgesi |
| 20 | İstekler yol haritası olarak kaydedilsin | ✅ Bu dosya |
| 21 | Başka bir Windows, iPhone ve Mac'te de çalışsın | 🔄 Windows: EXE + `uygulama` klasörü kopyalanır. iPhone/Mac: Adım 4–5 |
| 22 | Veriler program açılıp kapanınca kaybolmasın | ✅ Kapat-aç testi geçti |
| 23 | Şirketin mali veritabanı: çökme ve veri kaybı olmamalı | 🔄 Adım 2 bitti, bulut ve geçmiş Adım 5–6 |
| 24 | Gmail ve şifreyle giriş | ⏸ KARAR (27 Ekim): Google ile giriş + yedek e-posta/şifre, Supabase. Kullanıcı Supabase ve Google hesaplarını kuruyor |
| 25 | "Ne gitti" satırları tıklanabilir olsun | ✅ Malzemeye tıklayınca sevkiyatları açılır |
| 26 | Programa geri tuşu | ✅ Her ekranda (Pano hariç) |
| 27 | Her yeni EXE kurulunca eskisi silinsin | ✅ Kapalıysa hemen; açıksa yeni EXE ilk açılışta siler |
| 28 | "Tahsil edildi" seçenekli olsun: Tahsil edildi / Edilmedi | ✅ İki seçenekli anahtar (ödemede Ödendi / Ödenmedi) |
| 29 | Silinenler: yanlışlıkla silinene karşı geri alma | ✅ Her silme Silinenler'e düşer; menüde ve Ödeme ve Tahsilat ekranında |
| 30 | Şantiye ekranında harcama kısmına avans | ✅ "Avans" düğmesi (şantiye seçili, yeni işçi oradan eklenir); harcama, avans ve tahsilat tek listede |
| 32 | Commit ve GitHub'a gönderim | ✅ Kullanıcı onayladı (27 Ekim) |
| 33 | Öncelik Mac; iPhone ve Mac için yayın yolu | ✅ KARAR (27 Ekim): ayrı Mac/iPhone uygulaması yok. GitHub → Cloudflare Pages otomatik yayın; Mac'te Safari "Dock'a Ekle", iPhone'da "Ana Ekrana Ekle". Önce Mac |
| 34 | "Telefondan devam et" seçeneği | ✅ Bilgisayarda sol menüde ve Ayarlar'da: karekod (açık olan ekranla), iPhone'a ekleme adımları, kayıtları yedekle taşıma |
| 35 | iPhone 17'ye göre tasarım | ✅ WebKit ile 402×874'te denendi: 12 ekranda yana taşma yok; tablolar telefonda kart; büyük dokunma alanları; açılış ekranı; Dynamic Island; "Ana Ekrana Ekle" ipucu |
| 31 | Ödemelerde "Çek" düğmesi | ✅ Ödeme şekli (Nakit, Havale/EFT, Çek, Senet, Kredi kartı); çek no, banka, şube, keşideci; alınan/verilen çek; "Çekler" süzgeci; tahsil edilince kasaya çek bilgisiyle düşer |

## Adımlar

### Adım 1 — Temel uygulama ✅
- Ekranlar: Pano, Malzeme Gönder, Giden Malzemeler, Şantiyeler (+ ayrıntı), Malzemeler, Cari Hesaplar (+ ekstre), Gelir/Gider, Ödeme ve Tahsilat, İşçiler ve Avans, Raporlar, Silinenler, Ayarlar ve Yedek
- Excel (CSV) dışa aktarma, yazdır / PDF, örnek veriyle deneme
- Açık / koyu tema, imza etiketi, geri tuşu

### Adım 2 — Logo, EXE ve veri güvenliği (ilk katman) ✅
- Sarı baret logosu
- `İnşaat Takip.exe`: internetsiz çalışır, Edge'i uygulama penceresi olarak açar, pencere kapanınca kapanır
- Otomatik yedek: her değişiklikten 3 sn sonra `Belgeler\İnşaat Takip Yedekleri` (günde bir dosya, 180 gün saklanır, `son-yedek.json`); önce geçici dosyaya yazılır, doğrulanır, sonra yerine konur
- Yerel sunucu yalnız bu uygulamanın penceresinden yazma kabul eder; klasör dışı dosya sunmaz
- Silinenler (çöp kutusu), hata sınırı (bir ekran çökerse yedek indir düğmesi), yedek eskiyince Pano uyarısı
- Kuruş doğruluğu: her satır kuruşa yuvarlanır; 23 otomatik hesap testi
- Uçtan uca test: 17/17 (yedek, güvenlik, kapat-aç, silme/geri alma, tahsil anahtarı, tema, geri tuşu)

### Adım 3 — Kullanıcı kontrolü ⏸
- Kullanıcı EXE'yi ve ekranları dener
- Onaydan sonra ilk commit ve GitHub'a gönderim

### Adım 4 — İnternette yayın (önce Mac, sonra iPhone) 🔄
- KARAR (27 Ekim): Cloudflare `pages.dev` Türkiye'de erişime kapalı → **GitHub Pages**. Kişisel kullanım, ticari değil.
- Kurgu: kod gizli `insaat-yonetim`'de; GitHub Actions (`.github/workflows/yayin.yml`) her gönderimde test + derleme yapar, derlenen hâli herkese açık `DKDodo/insaat-takip` deposunun `gh-pages` dalına kopyalar → `https://dkdodo.github.io/insaat-takip/`
- ⏸ Kullanıcı: herkese açık boş `insaat-takip` deposu, yalnız o depoya yazabilen anahtar, gizli depoya `YAYIN_ANAHTARI` olarak eklenmesi
- ⏳ Yayın dosyasının commit'i (kullanıcı onayıyla), ilk yayından sonra Pages'i açmak (gh-pages dalı)
- ⏳ Mac: Safari → Dosya → Dock'a Ekle · iPhone 17: Safari → Paylaş → Ana Ekrana Ekle
- ⏳ Gerçek Mac'te ve iPhone'da Safari ile deneme turu
- Not: bulut eşitleme (Adım 5) gelene kadar her cihaz kendi verisini tutar

### Adım 5 — Bulut veritabanı ve giriş 🔄 (veri güvenliğinin ikinci katmanı)
- ✅ Supabase projesi açıldı (azfcjaioudmjwsntkviq, kullanıcı açtı)
- ✅ Veritabanı kurulum SQL'i: `supabase/kurulum.sql` (izin listesi, satır düzeyi güvenlik, kalıcı silme yok, değiştirilemez değişiklik geçmişi, anlık haber)
- ✅ Uygulama: giriş ekranı (Google + e-posta/şifre), izinsiz hesap ekranı, çevrimdışı öncelikli eşitleme motoru, Ayarlar'da bulut durumu; 13 eşitleme testi
- ⏸ BEKLETİLİYOR (kullanıcı, 27 Ekim: "Bunu beklet, sonra hatırlat"). Kalan: SQL'i çalıştırmak, Google istemcisini kurmak, publishable key ve Çağatay'ın Gmail adresini göndermek
- Supabase (Postgres): veriler bulutta, her cihazda aynı
- Giriş: Google ile giriş (Gmail hesabı) + yedek olarak e-posta ve şifre; yalnız Çağatay'ın e-postası kayıt olabilir
- Satır düzeyi güvenlik: her kayıt yalnız sahibinin hesabından okunur/yazılır
- Cihazdaki mevcut verileri tek tuşla buluta taşıma; çevrimdışıyken de çalışır, bağlanınca eşitler
- Bulut tarafında günlük otomatik yedek
- Bitene kadar tek ana cihaz kullanılmalı (iki cihazda ayrı veri birikmesin)

### Adım 6 — Mali kayıt güvencesi ⏳
- Değişiklik geçmişi: her kayıt için kim, ne zaman, neyi değiştirdi; eski hâline dönme
- Dönem kapama: geçmiş ayları kilitleme
- Düzenli yedek kopyası bilgisayar dışına (USB / bulut klasörü)

### Sonra (fikir havuzu)
- Fatura / irsaliye fotoğrafı ekleme
- Vadesi yaklaşan ödeme için bildirim
- İşçi maaş / hakediş dönemleri
