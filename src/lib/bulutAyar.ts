/*
 * Supabase bağlantısı. Bu iki değer tarayıcıda çalışmak için tasarlanmıştır ve uygulamaya
 * gömülmesi güvenlidir: verileri satır düzeyi güvenlik (izinli e-posta) korur.
 * Gizli anahtar (secret / service_role) ve veritabanı şifresi ASLA buraya yazılmaz.
 */
export const BULUT_ADRESI = 'https://azfcjaioudmjwsntkviq.supabase.co'
export const BULUT_ANAHTARI: string = 'sb_publishable_n0X7xC3_jBjz5TyyMdCg_g_FR2uECZI' // publishable key (28 Ekim 2026)

/* Google ile giriş Supabase'de açılınca true yapılır. O zamana kadar yalnız e-posta + şifre. */
export const GOOGLE_GIRISI: boolean = false

export const bulutHazir = (): boolean => BULUT_ANAHTARI.length > 20
