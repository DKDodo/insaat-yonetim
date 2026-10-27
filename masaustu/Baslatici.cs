// İnşaat Takip — Windows başlatıcısı.
// Yanındaki "uygulama" klasörünü yalnız bu bilgisayara (localhost) sunar ve Edge'i
// adres çubuğu olmayan bir uygulama penceresi olarak açar. Pencere kapanınca kendisi de kapanır.
// Veriler Edge'in bu uygulamaya ayrılmış profilinde (%LOCALAPPDATA%\InsaatTakip) durur.
// Derleme: masaustu\exe_olustur.ps1 (Windows'un hazır C# 5 derleyicisi).

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Management;
using System.Net;
using System.Reflection;
using System.Threading;
using System.Windows.Forms;

[assembly: AssemblyTitle("İnşaat Takip")]
[assembly: AssemblyProduct("İnşaat Takip")]
[assembly: AssemblyDescription("Çağatay Kurtuluş için şantiye malzeme, maliyet ve cari takibi")]
[assembly: AssemblyCopyright("Çağatay Kurtuluş")]
[assembly: AssemblyVersion("0.1.0.0")]
[assembly: AssemblyFileVersion("0.1.0.0")]

static class Baslatici
{
    /* Test için ortam değişkeniyle değiştirilebilir; normal kullanımda hep 47815 (veriler bu adrese bağlıdır). */
    static readonly int Port = OrtamSayi("INSAAT_TAKIP_PORT", 47815);
    const string Baslik = "İnşaat Takip";
    static readonly string Adres = "http://localhost:" + Port + "/";
    static string kok;

    static readonly Dictionary<string, string> Turler = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        { ".html", "text/html; charset=utf-8" },
        { ".js", "text/javascript; charset=utf-8" },
        { ".mjs", "text/javascript; charset=utf-8" },
        { ".css", "text/css; charset=utf-8" },
        { ".json", "application/json; charset=utf-8" },
        { ".webmanifest", "application/manifest+json; charset=utf-8" },
        { ".svg", "image/svg+xml" },
        { ".png", "image/png" },
        { ".ico", "image/x-icon" },
        { ".woff", "font/woff" },
        { ".woff2", "font/woff2" },
        { ".txt", "text/plain; charset=utf-8" },
    };

    [STAThread]
    static int OrtamSayi(string ad, int varsayilan)
    {
        int n;
        string v = Environment.GetEnvironmentVariable(ad);
        return v != null && int.TryParse(v, out n) && n > 1024 && n < 65535 ? n : varsayilan;
    }

    static void Main(string[] argumanlar)
    {
        bool yalnizSunucu = Array.IndexOf(argumanlar, "--sunucu") >= 0;
        // Güncellemeden kalan eski EXE varsa sil (eskisi o sırada açık olduğu için silinememişti).
        try
        {
            string eskiExe = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "İnşaat Takip.eski.exe");
            if (File.Exists(eskiExe)) File.Delete(eskiExe);
        }
        catch { }
        kok = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "uygulama"));
        if (!File.Exists(Path.Combine(kok, "index.html")))
        {
            Hata("Uygulama dosyaları bulunamadı:\n" + kok + "\n\nmasaustu\\exe_olustur.ps1 ile yeniden oluşturun.");
            return;
        }
        string profil = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "InsaatTakip", "TarayiciProfili");

        bool ilk;
        using (Mutex kilit = new Mutex(true, "InsaatTakip_Baslatici_" + Port, out ilk))
        {
            if (!ilk)
            {
                // Zaten açık: yalnız pencereyi öne getir / yeni pencere aç.
                PencereAc(profil);
                return;
            }

            HttpListener dinleyici = new HttpListener();
            dinleyici.Prefixes.Add(Adres);
            try
            {
                dinleyici.Start();
            }
            catch (Exception e)
            {
                Hata("Uygulama başlatılamadı (port " + Port + ").\n" + e.Message);
                return;
            }
            Thread is_ = new Thread(delegate () { Dinle(dinleyici); });
            is_.IsBackground = true;
            is_.Start();

            if (yalnizSunucu)
            {
                // Test modu: pencere açmadan sunar; işlem sonlandırılana kadar çalışır.
                Thread.Sleep(Timeout.Infinite);
            }
            else if (PencereAc(profil))
            {
                Thread.Sleep(5000);
                KapananaKadarBekle();
            }
            else
            {
                MessageBox.Show("İnşaat Takip tarayıcıda açıldı.\nİşiniz bitince bu kutuyu kapatın.", Baslik, MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            try { dinleyici.Stop(); } catch { }
        }
    }

    static string EdgeYolu()
    {
        string[] adaylar =
        {
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Microsoft\Edge\Application\msedge.exe"),
        };
        foreach (string a in adaylar)
            if (File.Exists(a)) return a;
        return null;
    }

    static bool PencereAc(string profil)
    {
        string edge = EdgeYolu();
        if (edge == null)
        {
            Process.Start(Adres);
            return false;
        }
        ProcessStartInfo bilgi = new ProcessStartInfo(edge,
            "--app=" + Adres + " --user-data-dir=\"" + profil + "\" --no-first-run --no-default-browser-check --window-size=1400,900");
        bilgi.UseShellExecute = false;
        Process.Start(bilgi);
        return true;
    }

    /* Bu uygulamanın Edge profiliyle çalışan pencere kalmayınca döner. */
    static void KapananaKadarBekle()
    {
        int bos = 0;
        while (bos < 2)
        {
            Thread.Sleep(1500);
            bos = AcikPencereVar() ? 0 : bos + 1;
        }
    }

    static bool AcikPencereVar()
    {
        try
        {
            using (ManagementObjectSearcher ara = new ManagementObjectSearcher(
                "SELECT ProcessId FROM Win32_Process WHERE Name = 'msedge.exe' AND CommandLine LIKE '%InsaatTakip%TarayiciProfili%'"))
            using (ManagementObjectCollection sonuc = ara.Get())
            {
                return sonuc.Count > 0;
            }
        }
        catch
        {
            return true;
        }
    }

    static void Dinle(HttpListener dinleyici)
    {
        while (dinleyici.IsListening)
        {
            HttpListenerContext baglam;
            try
            {
                baglam = dinleyici.GetContext();
            }
            catch
            {
                return;
            }
            ThreadPool.QueueUserWorkItem(delegate (object _) { Sun(baglam); });
        }
    }

    /* Otomatik yedek klasörü: Belgeler\İnşaat Takip Yedekleri */
    static string YedekKlasoru()
    {
        string test = Environment.GetEnvironmentVariable("INSAAT_TAKIP_YEDEK");
        if (!string.IsNullOrEmpty(test)) return test;
        return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "İnşaat Takip Yedekleri");
    }

    static readonly object yedekKilidi = new object();
    const int SaklanacakGun = 180;

    /* Yalnız bu uygulamanın penceresinden gelen isteği kabul et (başka site yerel sunucuya yazamasın). */
    static bool GuvenliIstek(HttpListenerRequest istek)
    {
        string host = istek.Headers["Host"];
        string koken = istek.Headers["Origin"];
        string beklenen = "http://localhost:" + Port;
        return host == "localhost:" + Port && koken == beklenen;
    }

    static void Json(HttpListenerResponse yanit, int durum, string govde)
    {
        yanit.StatusCode = durum;
        yanit.ContentType = "application/json; charset=utf-8";
        yanit.Headers["Cache-Control"] = "no-store";
        byte[] b = System.Text.Encoding.UTF8.GetBytes(govde);
        yanit.ContentLength64 = b.Length;
        yanit.OutputStream.Write(b, 0, b.Length);
    }

    static string JsonMetin(string s)
    {
        return "\"" + s.Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"";
    }

    /*
     * Yedeği önce geçici dosyaya yazar, okuyup boyutunu doğrular, sonra yerine koyar.
     * Günde bir dosya (yedek-YYYY-AA-GG.json) ve her zaman güncel "son-yedek.json" tutulur.
     */
    static string YedekYaz(byte[] veri)
    {
        string klasor = YedekKlasoru();
        Directory.CreateDirectory(klasor);
        string gunluk = Path.Combine(klasor, "yedek-" + DateTime.Now.ToString("yyyy-MM-dd") + ".json");
        string son = Path.Combine(klasor, "son-yedek.json");
        lock (yedekKilidi)
        {
            foreach (string hedef in new[] { gunluk, son })
            {
                string gecici = hedef + ".yaziliyor";
                using (FileStream fs = new FileStream(gecici, FileMode.Create, FileAccess.Write, FileShare.None))
                {
                    fs.Write(veri, 0, veri.Length);
                    fs.Flush(true);
                }
                if (new FileInfo(gecici).Length != veri.Length) throw new IOException("Yedek dosyası eksik yazıldı.");
                if (File.Exists(hedef)) File.Replace(gecici, hedef, null);
                else File.Move(gecici, hedef);
            }
            // Eski günlük yedekleri temizle (en yeni SaklanacakGun dosya kalır).
            string[] eski = Directory.GetFiles(klasor, "yedek-????-??-??.json");
            Array.Sort(eski, StringComparer.Ordinal);
            for (int i = 0; i < eski.Length - SaklanacakGun; i++)
            {
                try { File.Delete(eski[i]); } catch { }
            }
        }
        return gunluk;
    }

    static void Api(HttpListenerContext baglam, string yol)
    {
        HttpListenerRequest istek = baglam.Request;
        HttpListenerResponse yanit = baglam.Response;
        if (yol == "api/durum" && istek.HttpMethod == "GET")
        {
            Json(yanit, 200, "{\"masaustu\":true,\"yedekKlasoru\":" + JsonMetin(YedekKlasoru()) + "}");
            return;
        }
        if (yol == "api/yedek" && istek.HttpMethod == "POST")
        {
            if (!GuvenliIstek(istek)) { Json(yanit, 403, "{\"hata\":\"izin yok\"}"); return; }
            if (istek.ContentLength64 > 200L * 1024 * 1024) { Json(yanit, 413, "{\"hata\":\"çok büyük\"}"); return; }
            byte[] veri;
            using (MemoryStream ms = new MemoryStream())
            {
                istek.InputStream.CopyTo(ms);
                veri = ms.ToArray();
            }
            // Basit doğrulama: bu uygulamanın yedeği mi?
            string bas = System.Text.Encoding.UTF8.GetString(veri, 0, Math.Min(veri.Length, 400));
            if (veri.Length < 20 || bas.IndexOf("\"insaat_yonetim\"", StringComparison.Ordinal) < 0)
            {
                Json(yanit, 400, "{\"hata\":\"geçersiz yedek\"}");
                return;
            }
            try
            {
                string dosya = YedekYaz(veri);
                Json(yanit, 200, "{\"tamam\":true,\"dosya\":" + JsonMetin(dosya) + ",\"bayt\":" + veri.Length + "}");
            }
            catch (Exception e)
            {
                Json(yanit, 500, "{\"hata\":" + JsonMetin(e.Message) + "}");
            }
            return;
        }
        Json(yanit, 404, "{\"hata\":\"yok\"}");
    }

    static void Sun(HttpListenerContext baglam)
    {
        HttpListenerResponse yanit = baglam.Response;
        try
        {
            string apiYol = baglam.Request.Url.AbsolutePath.TrimStart('/');
            if (apiYol.StartsWith("api/", StringComparison.Ordinal))
            {
                Api(baglam, apiYol);
                return;
            }
            string yol = Uri.UnescapeDataString(baglam.Request.Url.AbsolutePath).TrimStart('/');
            if (yol.Length == 0) yol = "index.html";
            string tam = Path.GetFullPath(Path.Combine(kok, yol.Replace('/', Path.DirectorySeparatorChar)));
            // Klasör dışına çıkmayı engelle; bilinmeyen yol tek sayfalık uygulamaya döner.
            if (!tam.StartsWith(kok + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) || !File.Exists(tam))
                tam = Path.Combine(kok, "index.html");

            string uzanti = Path.GetExtension(tam);
            string tur;
            yanit.ContentType = Turler.TryGetValue(uzanti, out tur) ? tur : "application/octet-stream";
            string ad = Path.GetFileName(tam);
            bool degismez = tam.IndexOf(Path.DirectorySeparatorChar + "assets" + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) >= 0;
            yanit.Headers["Cache-Control"] = degismez ? "public, max-age=31536000, immutable" : "no-cache";
            if (ad == "sw.js") yanit.Headers["Service-Worker-Allowed"] = "/";
            yanit.Headers["X-Content-Type-Options"] = "nosniff";

            byte[] veri = File.ReadAllBytes(tam);
            yanit.ContentLength64 = veri.Length;
            if (baglam.Request.HttpMethod != "HEAD") yanit.OutputStream.Write(veri, 0, veri.Length);
        }
        catch
        {
            try { yanit.StatusCode = 500; } catch { }
        }
        finally
        {
            try { yanit.OutputStream.Close(); } catch { }
        }
    }

    static void Hata(string mesaj)
    {
        MessageBox.Show(mesaj, Baslik, MessageBoxButtons.OK, MessageBoxIcon.Error);
    }
}
