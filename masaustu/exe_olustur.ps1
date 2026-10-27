# İnşaat Takip — masaüstü sürümünü oluşturur.
# 1) Uygulamayı derler (npm run build)
# 2) Derlenen dosyaları proje kökündeki "uygulama" klasörüne kopyalar
# 3) "İnşaat Takip.exe" başlatıcısını Windows'un hazır C# derleyicisiyle üretir
# Kullanım: proje klasöründe  powershell -ExecutionPolicy Bypass -File masaustu\exe_olustur.ps1

$ErrorActionPreference = 'Stop'
$proje = Split-Path -Parent $PSScriptRoot
Set-Location $proje

Write-Host '1/3 Uygulama derleniyor...'
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Derleme başarısız.' }

Write-Host '2/3 Dosyalar kopyalanıyor...'
$hedef = Join-Path $proje 'uygulama'
if (Test-Path $hedef) { Remove-Item -Recurse -Force $hedef }
Copy-Item -Recurse (Join-Path $proje 'dist') $hedef

Write-Host '3/3 EXE oluşturuluyor...'
$csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path $csc)) { $csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe' }
$exe = Join-Path $proje 'İnşaat Takip.exe'
$eski = Join-Path $proje 'İnşaat Takip.eski.exe'
$yeni = Join-Path $env:TEMP 'insaat_takip_yeni.exe'
& $csc /nologo /codepage:65001 /optimize+ /target:winexe `
  "/win32icon:$(Join-Path $PSScriptRoot 'insaat_takip.ico')" `
  "/out:$yeni" `
  /r:System.Management.dll /r:System.Windows.Forms.dll `
  (Join-Path $PSScriptRoot 'Baslatici.cs')
if ($LASTEXITCODE -ne 0) { throw 'EXE derlenemedi.' }

# Program açıksa EXE kilitlidir; Windows çalışan dosyanın adının değişmesine izin verir.
# Eski EXE kenara alınır, yenisi yerine konur; açık pencere etkilenmez, bir sonraki açılışta yeni sürüm çalışır.
if (Test-Path $eski) { Remove-Item -Force $eski -ErrorAction SilentlyContinue }
if (Test-Path $exe) {
  try { Remove-Item -Force $exe -ErrorAction Stop } catch { Rename-Item -Path $exe -NewName (Split-Path -Leaf $eski) }
}
Move-Item -Force $yeni $exe

Write-Host "Hazır: $exe"
