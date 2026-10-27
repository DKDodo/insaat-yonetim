/*
 * Supabase bağlantısı. Bu iki değer tarayıcıda çalışmak için tasarlanmıştır ve uygulamaya
 * gömülmesi güvenlidir: verileri satır düzeyi güvenlik (izinli e-posta) korur.
 * Gizli anahtar (secret / service_role) ve veritabanı şifresi ASLA buraya yazılmaz.
 */
export const BULUT_ADRESI = 'https://azfcjaioudmjwsntkviq.supabase.co'
export const BULUT_ANAHTARI: string = '' // publishable key: kullanıcı gönderince doldurulacak

export const bulutHazir = (): boolean => BULUT_ANAHTARI.length > 20
