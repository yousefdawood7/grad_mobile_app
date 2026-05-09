create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.classification_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  image_uri text not null,
  image_source text not null check (image_source in ('camera', 'gallery', 'file')),
  result_label text not null check (
    result_label in ('Water Hyacinth', 'Needs Review', 'No Water Hyacinth')
  ),
  confidence integer not null check (confidence between 0 and 100),
  is_positive boolean not null default false,
  recommendation text not null,
  model_version text not null default 'placeholder-v1',
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;
alter table public.classification_runs enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do update
  set full_name = excluded.full_name,
      updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create policy "profiles select own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles update own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "profiles insert own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "classification_runs select own"
on public.classification_runs
for select
to authenticated
using (auth.uid() = user_id);

create policy "classification_runs insert own"
on public.classification_runs
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "classification_runs update own"
on public.classification_runs
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "classification_runs delete own"
on public.classification_runs
for delete
to authenticated
using (auth.uid() = user_id);
