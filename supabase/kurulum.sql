-- İnşaat Takip — Supabase veritabanı kurulumu
-- Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını yapıştırın → Run.
-- Birden fazla çalıştırmak zararsızdır (var olanı bozmaz).
--
-- Güvenlik ilkeleri:
--  * Verileri yalnız izinli e-postalarla giriş yapanlar okuyup yazabilir (satır düzeyi güvenlik).
--  * Uygulamadan hiçbir kayıt kalıcı silinemez: silme yalnız "silindi" işaretidir.
--  * Her ekleme ve değişiklik, eski ve yeni hâliyle değişiklik geçmişine yazılır; geçmiş değiştirilemez.

-- 1) İzinli kullanıcılar --------------------------------------------------------------
create table if not exists public.izinli_kullanicilar (
  email text primary key check (email = lower(email)),
  eklenme timestamptz not null default now()
);
alter table public.izinli_kullanicilar enable row level security;
-- Bu tabloya uygulamadan erişilemez (politika yok); yalnız SQL Editor'dan yönetilir.

create or replace function public.izinli_mi()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.izinli_kullanicilar i
    where i.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.izinli_mi() from public;
grant execute on function public.izinli_mi() to authenticated;

-- 2) Kayıtlar: uygulamadaki her kayıt bir satır ----------------------------------------
create table if not exists public.kayitlar (
  tablo text not null check (tablo in (
    'cariler', 'santiyeler', 'malzemeler', 'sevkiyatlar',
    'hareketler', 'vadeler', 'isciler', 'avanslar', 'silinenler'
  )),
  id text not null check (length(id) between 1 and 100),
  veri jsonb not null,
  silindi boolean not null default false,
  guncelleme timestamptz not null default now(),
  cihaz text,
  degistiren uuid default auth.uid(),
  primary key (tablo, id)
);
create index if not exists kayitlar_guncelleme on public.kayitlar (guncelleme);

-- Zaman damgasını sunucu koyar (cihaz saatleri farklı olabilir).
create or replace function public.kayit_zamani()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.guncelleme := clock_timestamp();
  new.degistiren := auth.uid();
  return new;
end;
$$;
drop trigger if exists kayit_zamani on public.kayitlar;
create trigger kayit_zamani before insert or update on public.kayitlar
  for each row execute function public.kayit_zamani();

alter table public.kayitlar enable row level security;
drop policy if exists "izinli okur" on public.kayitlar;
drop policy if exists "izinli ekler" on public.kayitlar;
drop policy if exists "izinli günceller" on public.kayitlar;
create policy "izinli okur" on public.kayitlar for select to authenticated using (public.izinli_mi());
create policy "izinli ekler" on public.kayitlar for insert to authenticated with check (public.izinli_mi());
create policy "izinli günceller" on public.kayitlar for update to authenticated using (public.izinli_mi()) with check (public.izinli_mi());
-- Silme politikası bilerek yok: uygulamadan kalıcı silme yapılamaz.

-- 3) Değişiklik geçmişi (değiştirilemez) ------------------------------------------------
create table if not exists public.kayit_gecmisi (
  no bigint generated always as identity primary key,
  zaman timestamptz not null default now(),
  tablo text not null,
  id text not null,
  islem text not null,
  eski jsonb,
  yeni jsonb,
  eski_silindi boolean,
  yeni_silindi boolean,
  kim uuid,
  eposta text
);
create index if not exists kayit_gecmisi_kayit on public.kayit_gecmisi (tablo, id, zaman);

create or replace function public.gecmise_yaz()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.veri = new.veri and old.silindi = new.silindi then
    return new; -- içerik değişmediyse yazma
  end if;
  insert into public.kayit_gecmisi (tablo, id, islem, eski, yeni, eski_silindi, yeni_silindi, kim, eposta)
  values (
    new.tablo, new.id, lower(tg_op),
    case when tg_op = 'UPDATE' then old.veri end, new.veri,
    case when tg_op = 'UPDATE' then old.silindi end, new.silindi,
    auth.uid(), auth.jwt() ->> 'email'
  );
  return new;
end;
$$;
drop trigger if exists gecmise_yaz on public.kayitlar;
create trigger gecmise_yaz after insert or update on public.kayitlar
  for each row execute function public.gecmise_yaz();

alter table public.kayit_gecmisi enable row level security;
drop policy if exists "izinli geçmişi okur" on public.kayit_gecmisi;
create policy "izinli geçmişi okur" on public.kayit_gecmisi for select to authenticated using (public.izinli_mi());
-- Ekleme/güncelleme/silme politikası yok: geçmişe yalnız tetikleyici yazar, kimse değiştiremez.

-- 4) Anlık haber: başka cihazda değişiklik olunca uygulamalar hemen eşitlesin -------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'kayitlar'
  ) then
    alter publication supabase_realtime add table public.kayitlar;
  end if;
end $$;

-- 5) İzinli e-posta ---------------------------------------------------------------------
-- Aşağıdaki satırda adresi Çağatay'ın Gmail adresiyle değiştirip çalıştırın (küçük harfle).
-- insert into public.izinli_kullanicilar (email) values ('ornek@gmail.com') on conflict do nothing;
