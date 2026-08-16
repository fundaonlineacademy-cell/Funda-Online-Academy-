-- FUNDA ONLINE ACADEMY - SAFE DATABASE REPAIR
-- Run once in Supabase SQL Editor if the existing project reports missing columns.
-- This migration is additive and does not delete existing student/course/payment data.

create extension if not exists pgcrypto;

-- Existing installations use enrollment_status. Add the legacy-compatible
-- status column only when it is missing so older code/data can coexist.
alter table if exists public.enrollments
  add column if not exists status text;

update public.enrollments
set status = coalesce(status, enrollment_status, 'pending')
where status is null;

-- Keep status non-null after existing rows have been repaired.
alter table if exists public.enrollments
  alter column status set default 'pending';

-- Student administration fields used by Funda's registration/admin screens.
alter table if exists public.profiles add column if not exists email text;
alter table if exists public.profiles add column if not exists gender text;
alter table if exists public.profiles add column if not exists id_number text;
alter table if exists public.profiles add column if not exists phone text;

-- Course compatibility fields.
alter table if exists public.courses add column if not exists active boolean not null default true;
alter table if exists public.courses add column if not exists duration text;
alter table if exists public.courses add column if not exists description text;
alter table if exists public.courses add column if not exists modules jsonb not null default '[]'::jsonb;
alter table if exists public.courses add column if not exists image_url text;

-- Helpful timestamps where the current installation may not have them.
alter table if exists public.enrollments add column if not exists enrolled_at timestamptz;
update public.enrollments set enrolled_at = coalesce(enrolled_at, created_at, now()) where enrolled_at is null;
alter table if exists public.enrollments alter column enrolled_at set default now();

-- Ensure the supporting tables exist for the full learning/payment/result journey.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  enrolment_id uuid references public.enrollments(id) on delete set null,
  amount numeric(12,2),
  payment_method text,
  status text not null default 'pending',
  proof_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  enrolment_id uuid references public.enrollments(id) on delete cascade,
  assessment_id uuid,
  mark numeric(6,2),
  score numeric(6,2),
  percentage numeric(6,2),
  result text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  enrolment_id uuid references public.enrollments(id) on delete set null,
  course_name text,
  certificate_number text unique,
  status text not null default 'Issued',
  issued_at timestamptz,
  created_at timestamptz not null default now()
);

-- Basic RLS for the new tables. Admin access uses the existing public.is_admin()
-- helper when that helper is already present in the project.
alter table public.payments enable row level security;
alter table public.results enable row level security;
alter table public.certificates enable row level security;

-- Students can see their own records; admins can see everything.
drop policy if exists "students read own payments" on public.payments;
create policy "students read own payments" on public.payments for select
using (student_id in (select id from public.students where user_id = auth.uid()) or public.is_admin());

drop policy if exists "students read own results" on public.results;
create policy "students read own results" on public.results for select
using (student_id in (select id from public.students where user_id = auth.uid()) or public.is_admin());

drop policy if exists "students read own certificates" on public.certificates;
create policy "students read own certificates" on public.certificates for select
using (student_id in (select id from public.students where user_id = auth.uid()) or public.is_admin());

-- Students may submit payment records if the existing application uses direct inserts.
drop policy if exists "students create own payments" on public.payments;
create policy "students create own payments" on public.payments for insert
with check (student_id in (select id from public.students where user_id = auth.uid()));

-- Admins manage payments/results/certificates.
drop policy if exists "admin manage payments" on public.payments;
create policy "admin manage payments" on public.payments for all
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manage results" on public.results;
create policy "admin manage results" on public.results for all
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manage certificates" on public.certificates;
create policy "admin manage certificates" on public.certificates for all
using (public.is_admin()) with check (public.is_admin());
