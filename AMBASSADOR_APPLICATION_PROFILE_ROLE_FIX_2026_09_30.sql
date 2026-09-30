-- Funda Online Academy
-- Ambassador application signup repair
-- Owner-authorised defect correction: 30 September 2026
--
-- Root cause:
-- public.handle_new_user() intentionally creates Ambassador applicant profiles
-- with role='ambassador', but profiles_role_check only allowed student/admin/staff.
-- This caused Supabase Auth signup to fail with "Database error saving new user".
--
-- Scope: constraint compatibility only. No Ambassador business rules, RLS,
-- approval, referral, earnings, Student, Staff/Admin, or portal UI changes.

begin;

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role = any (array[
    'student'::text,
    'admin'::text,
    'staff'::text,
    'ambassador'::text
  ]));

commit;
