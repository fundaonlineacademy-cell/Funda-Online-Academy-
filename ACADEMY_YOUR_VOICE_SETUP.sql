-- Funda Online Academy — secure Student and Ambassador "Your Voice" workflow.
-- Users submit through scoped RPCs. They cannot read the base table directly.
-- Administrators receive every item in one department-routed inbox.

create extension if not exists pgcrypto;

create table if not exists public.academy_voice_submissions (
  id uuid primary key default gen_random_uuid(),
  reference_number text not null unique,
  submitter_user_id uuid references auth.users(id) on delete set null,
  submitter_role text not null check (submitter_role in ('student', 'ambassador')),
  ambassador_application_id uuid references public.ambassador_programme_applications(id) on delete set null,
  submission_type text not null check (submission_type in ('suggestion', 'complaint', 'compliment')),
  service_area text not null check (service_area in (
    'general',
    'learning_assessments',
    'enrolment_course_access',
    'finance_payments',
    'technical_platform',
    'student_support',
    'career_workplace',
    'ambassador_programme',
    'marketing_communication',
    'privacy_conduct'
  )),
  routed_department text not null check (routed_department in (
    'Management & Governance',
    'Academic, Assessments & Content',
    'Enrolments & Courses',
    'Finance & Accounting',
    'IT, Security & Platform',
    'Student Support & CRM',
    'Career & Workplace Support',
    'Ambassador Programme',
    'Communication Hub'
  )),
  subject text not null check (char_length(subject) between 5 and 160),
  message text not null check (char_length(message) between 20 and 5000),
  preferred_outcome text check (preferred_outcome is null or char_length(preferred_outcome) <= 1500),
  confidential boolean not null default false,
  priority text not null default 'standard' check (priority in ('standard', 'high', 'urgent')),
  status text not null default 'received' check (status in ('received', 'under_review', 'referred', 'responded', 'resolved', 'closed')),
  public_response text check (public_response is null or char_length(public_response) <= 5000),
  internal_notes text check (internal_notes is null or char_length(internal_notes) <= 5000),
  responded_by uuid references auth.users(id) on delete set null,
  responded_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Ambassador application linkage is required by the submission RPC. The
  -- nullable column still permits lawful account/application deletion later
  -- while retaining the non-identifying service record.
  constraint academy_voice_submissions_role_link_check
    check (submitter_role = 'ambassador' or
           (submitter_role = 'student' and ambassador_application_id is null)),
  check (not confidential or submission_type = 'complaint')
);

comment on table public.academy_voice_submissions is
  'Secure, traceable suggestions, complaints and compliments submitted from Student and Ambassador portals.';

create index if not exists academy_voice_owner_portal_created_idx
  on public.academy_voice_submissions (submitter_user_id, submitter_role, created_at desc);
create index if not exists academy_voice_department_status_created_idx
  on public.academy_voice_submissions (routed_department, status, created_at desc);
create index if not exists academy_voice_type_created_idx
  on public.academy_voice_submissions (submission_type, created_at desc);
create index if not exists academy_voice_ambassador_application_idx
  on public.academy_voice_submissions (ambassador_application_id)
  where ambassador_application_id is not null;
create index if not exists academy_voice_responded_by_idx
  on public.academy_voice_submissions (responded_by)
  where responded_by is not null;

alter table public.academy_voice_submissions enable row level security;

drop policy if exists "Admins can read Academy voice submissions" on public.academy_voice_submissions;
create policy "Admins can read Academy voice submissions"
on public.academy_voice_submissions
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
);

-- No direct student/ambassador table policy is intentional. The two safe RPCs
-- below expose only the submitter's public fields and never internal admin notes.
revoke all on table public.academy_voice_submissions from anon, authenticated;
grant select on table public.academy_voice_submissions to authenticated;
grant all on table public.academy_voice_submissions to service_role;

create or replace function public.submit_academy_voice(
  p_portal text,
  p_submission_type text,
  p_service_area text,
  p_subject text,
  p_message text,
  p_preferred_outcome text default null,
  p_confidential boolean default false
)
returns table (
  id uuid,
  reference_number text,
  status text,
  routed_department text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_portal text := lower(trim(coalesce(p_portal, '')));
  v_type text := lower(trim(coalesce(p_submission_type, '')));
  v_area text := lower(trim(coalesce(p_service_area, '')));
  v_subject text := trim(coalesce(p_subject, ''));
  v_message text := trim(coalesce(p_message, ''));
  v_outcome text := nullif(trim(coalesce(p_preferred_outcome, '')), '');
  v_confidential boolean := false;
  v_department text;
  v_application_id uuid;
  v_id uuid := gen_random_uuid();
  v_reference text;
begin
  if v_user_id is null then
    raise exception 'You must be signed in to submit feedback.';
  end if;

  if v_portal = 'student' then
    if not exists (
      select 1 from public.profiles p
      where p.id = v_user_id and p.role = 'student'
    ) then
      raise exception 'This login is not authorised for the Student Portal.';
    end if;
    if v_area = 'ambassador_programme' then
      raise exception 'Please choose a Student Portal service area.';
    end if;
  elsif v_portal = 'ambassador' then
    select a.id
      into v_application_id
      from public.ambassador_programme_applications a
     where a.auth_user_id = v_user_id
       and a.status = 'approved'
       and a.account_status in ('introductory', 'active')
     limit 1;
    if v_application_id is null then
      raise exception 'This login is not connected to an active Ambassador account.';
    end if;
    if v_area in ('learning_assessments', 'enrolment_course_access', 'student_support', 'career_workplace') then
      raise exception 'Please choose an Ambassador Portal service area.';
    end if;
  else
    raise exception 'The portal source is invalid.';
  end if;

  if v_type not in ('suggestion', 'complaint', 'compliment') then
    raise exception 'Choose Suggestion, Complaint or Compliment.';
  end if;
  if v_area not in (
    'general', 'learning_assessments', 'enrolment_course_access', 'finance_payments',
    'technical_platform', 'student_support', 'career_workplace',
    'ambassador_programme', 'marketing_communication', 'privacy_conduct'
  ) then
    raise exception 'Choose a valid service area.';
  end if;
  if char_length(v_subject) < 5 or char_length(v_subject) > 160 then
    raise exception 'The subject must be between 5 and 160 characters.';
  end if;
  if char_length(v_message) < 20 or char_length(v_message) > 5000 then
    raise exception 'The message must be between 20 and 5000 characters.';
  end if;
  if v_outcome is not null and char_length(v_outcome) > 1500 then
    raise exception 'The requested outcome must not exceed 1500 characters.';
  end if;
  if exists (
    select 1
    from public.academy_voice_submissions s
    where s.submitter_user_id = v_user_id
      and s.created_at > now() - interval '20 seconds'
  ) then
    raise exception 'Please wait a few seconds before sending another submission.';
  end if;

  v_department := case v_area
    when 'learning_assessments' then 'Academic, Assessments & Content'
    when 'enrolment_course_access' then 'Enrolments & Courses'
    when 'finance_payments' then 'Finance & Accounting'
    when 'technical_platform' then 'IT, Security & Platform'
    when 'student_support' then 'Student Support & CRM'
    when 'career_workplace' then 'Career & Workplace Support'
    when 'ambassador_programme' then 'Ambassador Programme'
    when 'marketing_communication' then 'Communication Hub'
    else 'Management & Governance'
  end;

  v_confidential := coalesce(p_confidential, false) and v_type = 'complaint';
  if v_confidential then
    v_department := 'Management & Governance';
  end if;

  v_reference := 'VOICE-' || to_char(clock_timestamp(), 'YYYYMMDD') || '-' ||
                 upper(substr(replace(v_id::text, '-', ''), 1, 8));

  insert into public.academy_voice_submissions (
    id, reference_number, submitter_user_id, submitter_role,
    ambassador_application_id, submission_type, service_area,
    routed_department, subject, message, preferred_outcome, confidential
  ) values (
    v_id, v_reference, v_user_id, v_portal,
    v_application_id, v_type, v_area,
    v_department, v_subject, v_message, v_outcome, v_confidential
  );

  return query
  select s.id, s.reference_number, s.status, s.routed_department, s.created_at
  from public.academy_voice_submissions s
  where s.id = v_id;
end;
$$;

create or replace function public.get_own_academy_voice_submissions(p_portal text)
returns table (
  id uuid,
  reference_number text,
  submission_type text,
  service_area text,
  routed_department text,
  subject text,
  message text,
  preferred_outcome text,
  confidential boolean,
  priority text,
  status text,
  public_response text,
  responded_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_portal text := lower(trim(coalesce(p_portal, '')));
begin
  if v_user_id is null then
    raise exception 'You must be signed in to view submissions.';
  end if;
  if v_portal not in ('student', 'ambassador') then
    raise exception 'The portal source is invalid.';
  end if;

  if v_portal = 'student' and not exists (
    select 1 from public.profiles p
    where p.id = v_user_id and p.role = 'student'
  ) then
    raise exception 'This login is not authorised for the Student Portal.';
  end if;
  if v_portal = 'ambassador' and not exists (
    select 1 from public.ambassador_programme_applications a
    where a.auth_user_id = v_user_id
      and a.status = 'approved'
      and a.account_status in ('introductory', 'active')
  ) then
    raise exception 'This login is not connected to an active Ambassador account.';
  end if;

  return query
  select s.id, s.reference_number, s.submission_type, s.service_area,
         s.routed_department, s.subject, s.message, s.preferred_outcome,
         s.confidential, s.priority, s.status, s.public_response,
         s.responded_at, s.created_at, s.updated_at
    from public.academy_voice_submissions s
   where s.submitter_user_id = v_user_id
     and s.submitter_role = v_portal
   order by s.created_at desc;
end;
$$;

create or replace function public.get_admin_academy_voice_submissions()
returns table (
  id uuid,
  reference_number text,
  submitter_role text,
  submitter_name text,
  submitter_email text,
  submitter_reference text,
  submission_type text,
  service_area text,
  routed_department text,
  subject text,
  message text,
  preferred_outcome text,
  confidential boolean,
  priority text,
  status text,
  public_response text,
  internal_notes text,
  responded_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ) then
    raise exception 'Administrator access is required.';
  end if;

  return query
  select s.id,
         s.reference_number,
         s.submitter_role,
         coalesce(a.full_name, p.full_name, 'Portal user') as submitter_name,
         coalesce(a.email, p.email, '') as submitter_email,
         case
           when s.submitter_role = 'ambassador' then 'AMB-' || upper(substr(coalesce(a.id, s.id)::text, 1, 8))
           else coalesce(p.student_number, 'STU-' || upper(substr(coalesce(s.submitter_user_id, s.id)::text, 1, 8)))
         end as submitter_reference,
         s.submission_type,
         s.service_area,
         s.routed_department,
         s.subject,
         s.message,
         s.preferred_outcome,
         s.confidential,
         s.priority,
         s.status,
         s.public_response,
         s.internal_notes,
         s.responded_at,
         s.created_at,
         s.updated_at
    from public.academy_voice_submissions s
    left join public.profiles p on p.id = s.submitter_user_id
    left join public.ambassador_programme_applications a on a.id = s.ambassador_application_id
   order by
     case s.status when 'received' then 1 when 'under_review' then 2 when 'referred' then 3 when 'responded' then 4 else 5 end,
     s.created_at desc;
end;
$$;

create or replace function public.admin_review_academy_voice(
  p_submission_id uuid,
  p_status text,
  p_routed_department text,
  p_priority text,
  p_public_response text default null,
  p_internal_notes text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text := lower(trim(coalesce(p_status, '')));
  v_department text := trim(coalesce(p_routed_department, ''));
  v_priority text := lower(trim(coalesce(p_priority, '')));
  v_response text := nullif(trim(coalesce(p_public_response, '')), '');
  v_notes text := nullif(trim(coalesce(p_internal_notes, '')), '');
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ) then
    raise exception 'Administrator access is required.';
  end if;
  if v_status not in ('received', 'under_review', 'referred', 'responded', 'resolved', 'closed') then
    raise exception 'Choose a valid review status.';
  end if;
  if v_priority not in ('standard', 'high', 'urgent') then
    raise exception 'Choose a valid priority.';
  end if;
  if v_department not in (
    'Management & Governance', 'Academic, Assessments & Content', 'Enrolments & Courses',
    'Finance & Accounting', 'IT, Security & Platform', 'Student Support & CRM',
    'Career & Workplace Support', 'Ambassador Programme', 'Communication Hub'
  ) then
    raise exception 'Choose a valid Academy department.';
  end if;
  if v_response is not null and char_length(v_response) > 5000 then
    raise exception 'The public response must not exceed 5000 characters.';
  end if;
  if v_notes is not null and char_length(v_notes) > 5000 then
    raise exception 'Internal notes must not exceed 5000 characters.';
  end if;
  if v_status in ('responded', 'resolved', 'closed') and v_response is null then
    raise exception 'A public response is required before this submission can be completed.';
  end if;

  update public.academy_voice_submissions s
     set status = v_status,
         routed_department = v_department,
         priority = v_priority,
         public_response = v_response,
         internal_notes = v_notes,
         responded_by = case when v_response is not null then auth.uid() else s.responded_by end,
         responded_at = case when v_response is not null then now() else s.responded_at end,
         resolved_at = case when v_status in ('resolved', 'closed') then now() else null end,
         updated_at = now()
   where s.id = p_submission_id;

  if not found then
    raise exception 'The submission could not be found.';
  end if;

  if to_regclass('public.admin_audit_log') is not null then
    insert into public.admin_audit_log (actor_id, action, department, entity_type, entity_id)
    values (auth.uid(), 'Reviewed Your Voice submission', v_department, 'academy_voice_submission', p_submission_id::text);
  end if;

  return true;
end;
$$;

revoke all on function public.submit_academy_voice(text, text, text, text, text, text, boolean) from public, anon;
revoke all on function public.get_own_academy_voice_submissions(text) from public, anon;
revoke all on function public.get_admin_academy_voice_submissions() from public, anon;
revoke all on function public.admin_review_academy_voice(uuid, text, text, text, text, text) from public, anon;

grant execute on function public.submit_academy_voice(text, text, text, text, text, text, boolean) to authenticated;
grant execute on function public.get_own_academy_voice_submissions(text) to authenticated;
grant execute on function public.get_admin_academy_voice_submissions() to authenticated;
grant execute on function public.admin_review_academy_voice(uuid, text, text, text, text, text) to authenticated;

grant execute on function public.submit_academy_voice(text, text, text, text, text, text, boolean) to service_role;
grant execute on function public.get_own_academy_voice_submissions(text) to service_role;
grant execute on function public.get_admin_academy_voice_submissions() to service_role;
grant execute on function public.admin_review_academy_voice(uuid, text, text, text, text, text) to service_role;
