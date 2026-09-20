-- Funda Online Academy
-- Student account creation hardening and registration audit
-- Owner-approved 20 September 2026
--
-- Goals:
-- 1. reject blank/anonymous Student profiles;
-- 2. reject reserved automation/security-test email prefixes for Student accounts;
-- 3. preserve a minimal Admin-visible registration provenance record;
-- 4. ensure CEO Student Growth excludes accounts already marked permanently deleted.

begin;

create table if not exists public.account_registration_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text not null,
  declared_role text,
  account_type text,
  registration_source text,
  created_at timestamptz not null default now()
);

alter table public.account_registration_audit enable row level security;

revoke all on table public.account_registration_audit from anon;
revoke insert, update, delete on table public.account_registration_audit from authenticated;
grant select on table public.account_registration_audit to authenticated;

drop policy if exists account_registration_audit_admin_read
  on public.account_registration_audit;
create policy account_registration_audit_admin_read
on public.account_registration_audit
for select
to authenticated
using (public.is_admin());

create or replace function public.guard_student_profile_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_email text := pg_catalog.lower(pg_catalog.btrim(coalesce(new.email,'')));
  v_local text := split_part(v_email,'@',1);
begin
  if pg_catalog.lower(coalesce(new.role,'')) <> 'student' then
    return new;
  end if;

  if nullif(pg_catalog.btrim(coalesce(new.full_name,'')),'') is null then
    raise exception 'Student account creation requires a full name.';
  end if;

  if v_email = '' or position('@' in v_email) <= 1 then
    raise exception 'Student account creation requires a valid email address.';
  end if;

  if v_local ~ '^(audit|audit_sec|security|sec|qa|test|demo)([._+-]|$)' then
    raise exception 'This email prefix is reserved and cannot be used for a live Student account.';
  end if;

  return new;
end;
$function$;

revoke all on function public.guard_student_profile_integrity()
from public, anon, authenticated;

drop trigger if exists trg_guard_student_profile_integrity
  on public.profiles;
create trigger trg_guard_student_profile_integrity
before insert or update of full_name,email,role
on public.profiles
for each row
execute function public.guard_student_profile_integrity();

create or replace function public.audit_auth_account_registration()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.account_registration_audit(
    user_id,
    email,
    declared_role,
    account_type,
    registration_source
  )
  values(
    new.id,
    pg_catalog.lower(coalesce(new.email,'')),
    nullif(pg_catalog.lower(pg_catalog.btrim(coalesce(new.raw_user_meta_data->>'role',''))),''),
    nullif(pg_catalog.lower(pg_catalog.btrim(coalesce(new.raw_user_meta_data->>'account_type',''))),''),
    nullif(pg_catalog.btrim(coalesce(new.raw_user_meta_data->>'registration_source','')),'')
  );

  return new;
end;
$function$;

revoke all on function public.audit_auth_account_registration()
from public, anon, authenticated;

drop trigger if exists on_auth_user_registration_audit
  on auth.users;
create trigger on_auth_user_registration_audit
after insert
on auth.users
for each row
execute function public.audit_auth_account_registration();

create or replace function public.get_admin_executive_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  fin jsonb;
  student_profiles int;
  active_courses int;
  issued_certificates int;
  passed_results int;
  published_communications int;
  open_support_tickets int;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  fin := public.get_admin_finance_snapshot();

  select count(*)::int
    into student_profiles
    from public.profiles p
   where lower(coalesce(p.role,''))='student'
     and not exists (
       select 1
         from public.ceo_account_control_state s
        where s.user_id=p.id
          and s.status='deleted'
     );

  select count(*)::int into active_courses
  from public.courses
  where coalesce(active,true)=true;

  select count(*)::int into issued_certificates
  from public.certificates
  where lower(coalesce(certificate_status,''))='issued';

  select count(*)::int into passed_results
  from public.course_results
  where lower(coalesce(result_status,''))='passed';

  select count(*)::int into published_communications
  from public.communications
  where coalesce(published,false)=true;

  select count(*)::int into open_support_tickets
  from public.support_tickets
  where lower(coalesce(status,'')) not in ('solved','closed','resolved');

  return fin || jsonb_build_object(
    'student_profiles',student_profiles,
    'active_courses',active_courses,
    'issued_certificates',issued_certificates,
    'passed_course_results',passed_results,
    'published_communications',published_communications,
    'open_support_tickets',open_support_tickets,
    'executive_generated_at',now()
  );
end;
$function$;

commit;
