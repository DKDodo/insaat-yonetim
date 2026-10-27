# İnşaat Yönetim — gereksinimler ve plan

Bu belge projenin başlangıç kaydıdır. Futbol kariyer simülasyonundan tamamen bağımsızdır; o depoya dosya eklenmez.

## Kim için
Tek kullanıcı: kullanıcının kardeşi. İnşaat firmalarına malzeme veren bir işletmeyi yönetiyor. Uygulama hem bilgisayarda (Windows) hem telefonda (iOS) çalışacak; veriler iki cihazda da aynı ve anlık olacak.

## Ne yapacak
1. **Cari hesaplar**: inşaat firmaları, tedarikçiler, diğer kişi ve kurumlar. Her carinin borç/alacak bakiyesi, hareket listesi (ekstre).
2. **Malzeme kartları**: ad, birim (ton, m³, adet, torba...), güncel birim fiyat, fiyat geçmişi.
3. **Giden malzeme (sevkiyat / irsaliye)**: tarih, hangi firmaya / hangi şantiyeye, kalemler (malzeme, miktar, birim fiyat), toplam. Firma başına toplam giden malzeme maliyeti buradan hesaplanır.
4. **Gelir ve giderler**: kasa ve banka hareketleri, kategori (yakıt, nakliye, maaş, kira...), açıklama, belge.
5. **Ödemeler ve tahsilatlar**: planlanan (vadeli) ve gerçekleşen. Yaklaşan ödemeler ve yaklaşan tahsilatlar tek listede; vadesi geçenler vurgulu.
6. **İşçiler ve avanslar**: işçi kartı, verilen avanslar, hakediş / maaş dönemleri, kalan borç.
7. **Raporlar**: firma bazlı maliyet ve kârlılık, dönem gelir/gider özeti, cari ekstre, avans özeti, vade takvimi. Excel ve PDF dışa aktarma.
8. **Pano (ana ekran)**: bugünün özeti: kasa durumu, bu hafta vadesi gelen ödemeler ve tahsilatlar, son sevkiyatlar, en borçlu cariler.

## İlkeler
- Modern, sade, telefonda tek elle kullanılabilir arayüz; bilgisayarda geniş tablolar.
- Türkçe arayüz, Türk Lirası, Türkiye tarih biçimi.
- Her kayıt düzenlenebilir ve silinebilir; silinenler geri alınabilir (çöp kutusu).
- Veri kaybı olmaz: bulut yedek, tek tuşla tam dışa aktarma.
- Giriş: e-posta + şifre, tek hesap. İleride ikinci kullanıcı eklenebilir.

## Kararlar (kullanıcı, 27 Ekim 2026)
- **Teknoloji: A — Web uygulaması (PWA).** Windows'ta tarayıcı ya da masaüstüne kurulan uygulama; iPhone'da Safari'den ana ekrana eklenir. Mac ve Apple üyeliği gerekmez. İleride istenirse App Store'a sarmalanır (C).
- **Veri: bulut veritabanı (Supabase, ücretsiz katman).** Veriler her cihazda aynı anda görünür. Supabase hesabı açılana kadar uygulama cihazda (tarayıcı veritabanı) çalışır; hesap bağlanınca veriler tek tuşla buluta taşınır.
- **İş modeli: firma adına alım / nakliye.** Giden malzemenin maliyeti firmaya yansıtılır (firma carisine borç yazılır); kazanç hizmet ve nakliye bedelidir. Kâr hesabı yok, maliyet ve hizmet bedeli ayrı izlenir.

## Teknoloji seçenekleri (karar için incelenenler)
iOS uygulamasını App Store'a koymak için Mac + Xcode + yıllık Apple geliştirici üyeliği gerekir; bu makine Windows. Seçenekler:

| Seçenek | Windows | iOS | Mac gerekir mi | Not |
|---|---|---|---|---|
| A. Web uygulaması (PWA) + bulut veritabanı | Tarayıcı veya masaüstüne kurulan uygulama | Safari'den ana ekrana eklenir, uygulama gibi açılır | Hayır | En hızlı yol; tek kod; iki cihaz anında eşzamanlı. İleride App Store'a sarmalanabilir. |
| B. Flutter + bulut veritabanı | Gerçek masaüstü uygulaması | Gerçek iOS uygulaması | Evet (ya da ücretli bulut Mac) + Apple üyeliği | Mağaza uygulaması hissi; kurulum ve dağıtım çok daha zahmetli. |
| C. A + sonra Capacitor ile App Store | Aynı | Önce PWA, sonra mağaza | Mağaza aşamasında evet | A'nın doğal devamı. |

Öneri: **A** ile başla (gerekirse C'ye geç). Bulut için Supabase (Postgres, kimlik doğrulama, ücretsiz katman), barındırma için Vercel veya Cloudflare Pages (ücretsiz).

## Makinede kurulu olanlar (27 Ekim 2026)
- Node 24.21, npm 11.19, Git 2.55, Python 3.14.
- Flutter kurulu değil.

## Klasör
`C:\Users\pc\Desktop\insaat_yonetim`
