-- Funda Online Academy — Reports, Compliance & Audit finalisation
-- 2026-09-21
-- Adds a unified read-only audit register, a central compliance register,
-- report-history metadata, and append-oriented protection for admin_audit_log.

alter table public.admin_report_runs
  add column if not exists output_format text,
  add column if not exists row_count integer,
  add column if not exists file_name text,
  add column if not exists report_scope text;

create table if not exists public.admin_compliance_register (
  id uuid primary key default gen_random_uuid(),
  control_area text not null,
  control_name text not null,
  requirement_basis text,
  owner_department text not null,
  responsible_person text,
  status text not null default 'not_reviewed'
    check (status in ('not_reviewed','compliant','review_due','action_required','in_progress','closed')),
  evidence text,
  corrective_action text,
  due_date date,
  last_review_date date,
  next_review_date date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_compliance_register_status_idx
  on public.admin_compliance_register(status);
create index if not exists admin_compliance_register_next_review_idx
  on public.admin_compliance_register(next_review_date);
create index if not exists admin_compliance_register_department_idx
  on public.admin_compliance_register(owner_department);

alter table public.admin_compliance_register enable row level security;

drop policy if exists admin_compliance_register_admin_select on public.admin_compliance_register;
create policy admin_compliance_register_admin_select
on public.admin_compliance_register
for select to authenticated
using (public.is_admin());

drop policy if exists admin_compliance_register_admin_insert on public.admin_compliance_register;
create policy admin_compliance_register_admin_insert
on public.admin_compliance_register
for insert to authenticated
with check (public.is_admin() and created_by=auth.uid());

drop policy if exists admin_compliance_register_admin_update on public.admin_compliance_register;
create policy admin_compliance_register_admin_update
on public.admin_compliance_register
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

revoke all on public.admin_compliance_register from PUBLIC, anon;
grant select,insert,update on public.admin_compliance_register to authenticated;
grant all on public.admin_compliance_register to service_role;

-- admin_audit_log is evidence. Authenticated Admin/Finance clients may append
-- permitted rows and read permitted rows, but may not rewrite or delete history.
revoke all on public.admin_audit_log from anon,authenticated;
grant select,insert on public.admin_audit_log to authenticated;

drop policy if exists admin_audit_admin_select on public.admin_audit_log;
create policy admin_audit_admin_select
on public.admin_audit_log
for select to authenticated
using (public.is_admin());

drop policy if exists admin_audit_admin_insert on public.admin_audit_log;
create policy admin_audit_admin_insert
on public.admin_audit_log
for insert to authenticated
with check (public.is_admin() and (actor_id=auth.uid() or actor_id is null));

drop policy if exists admin_all on public.admin_audit_log;

-- Generated report history is also append-oriented from the browser.
revoke all on public.admin_report_runs from anon,authenticated;
grant select,insert on public.admin_report_runs to authenticated;

drop policy if exists admin_report_runs_admin_select on public.admin_report_runs;
create policy admin_report_runs_admin_select
on public.admin_report_runs
for select to authenticated
using (public.is_admin());

drop policy if exists admin_report_runs_admin_insert on public.admin_report_runs;
create policy admin_report_runs_admin_insert
on public.admin_report_runs
for insert to authenticated
with check (public.is_admin() and (generated_by=auth.uid() or generated_by is null));

drop policy if exists admin_all on public.admin_report_runs;

create or replace function public.admin_get_audit_register(
  p_from date default null,
  p_to date default null,
  p_source text default null,
  p_department text default null,
  p_status text default null,
  p_search text default null,
  p_limit integer default 5000
)
returns table (
  event_time timestamptz,
  event_date date,
  source text,
  department text,
  action text,
  entity_type text,
  entity_id text,
  responsible_person text,
  status text,
  details text,
  actor_id uuid,
  actor_name text,
  source_table text,
  source_record_id text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode='42501';
  end if;

  return query
  with unified as (
    select
      a.created_at as event_time,
      coalesce(a.occurred_on,a.created_at::date) as event_date,
      case when lower(coalesce(a.source,'system'))='manual' then 'Manual Audit' else 'Admin System' end as source,
      case
        when a.department='Accounting' then 'Finance & Accounting'
        when a.department='Communication' then 'Communication Hub'
        when a.department='Reports' then 'Executive / Governance'
        else coalesce(a.department,'Executive / Governance')
      end as department,
      a.action,
      coalesce(a.entity_type,'record') as entity_type,
      a.entity_id::text,
      a.responsible_person,
      coalesce(a.status,'recorded') as status,
      a.details,
      a.actor_id,
      coalesce(pa.full_name,pa.email,'System') as actor_name,
      'admin_audit_log'::text as source_table,
      a.id::text as source_record_id
    from public.admin_audit_log a
    left join public.profiles pa on pa.id=a.actor_id

    union all

    select
      a.created_at,a.created_at::date,'Academic Audit','Academic, Assessments & Content',
      a.action,a.entity_type,a.entity_id::text,
      coalesce(ps.full_name,ps.email),
      'recorded',
      concat_ws(' · ',
        nullif(a.details::text,'{}'),
        case when c.title is not null then 'Course: '||c.title end
      ),
      a.actor_id,coalesce(pa.full_name,pa.email,'System'),
      'academic_audit_log',a.id::text
    from public.academic_audit_log a
    left join public.profiles pa on pa.id=a.actor_id
    left join public.profiles ps on ps.id=a.student_id
    left join public.courses c on c.id=a.course_id

    union all

    select
      a.created_at,a.created_at::date,'Course Change Audit','Enrolments & Courses',
      a.action,'course',a.course_id::text,
      coalesce(c.title,a.course_id::text),
      'recorded',
      concat_ws(' · ',
        nullif(a.notes,''),
        case when a.request_id is not null then 'Request: '||a.request_id::text end,
        case when a.before_state is not null then 'Before: '||a.before_state::text end,
        case when a.after_state is not null then 'After: '||a.after_state::text end
      ),
      a.actor_id,coalesce(pa.full_name,a.actor_email,'System'),
      'course_change_audit',a.id::text
    from public.course_change_audit a
    left join public.profiles pa on pa.id=a.actor_id
    left join public.courses c on c.id=a.course_id

    union all

    select
      a.created_at,a.created_at::date,'HR Audit','Human Resources',
      a.action,a.entity_type,a.entity_id,
      coalesce(ps.full_name,ps.email),
      'recorded',a.details::text,
      a.actor_id,coalesce(pa.full_name,pa.email,'System'),
      'hr_audit_log',a.id::text
    from public.hr_audit_log a
    left join public.profiles pa on pa.id=a.actor_id
    left join public.profiles ps on ps.id=a.subject_profile_id

    union all

    select
      a.created_at,a.created_at::date,'CEO Account Control','Executive / Governance',
      a.action,'account',a.target_user_id::text,
      coalesce(a.target_name,a.target_email),
      coalesce(a.outcome,'recorded'),
      concat_ws(' · ',
        case when a.target_role is not null then 'Role: '||a.target_role end,
        case when a.target_email is not null then 'Account: '||a.target_email end,
        case when a.reason is not null then 'Reason: '||a.reason end
      ),
      a.actor_id,coalesce(pa.full_name,pa.email,'CEO'),
      'ceo_account_action_log',a.id::text
    from public.ceo_account_action_log a
    left join public.profiles pa on pa.id=a.actor_id

    union all

    select
      a.created_at,a.created_at::date,'Account Registration','IT, Security & Platform',
      'Account registration recorded','account',a.user_id::text,
      a.email,
      'recorded',
      concat_ws(' · ',
        case when a.declared_role is not null then 'Declared role: '||a.declared_role end,
        case when a.account_type is not null then 'Account type: '||a.account_type end,
        case when a.registration_source is not null then 'Source: '||a.registration_source end
      ),
      null::uuid,'System',
      'account_registration_audit',a.id::text
    from public.account_registration_audit a

    union all

    select
      a.reviewed_at,a.reviewed_at::date,'Security Access Review','IT, Security & Platform',
      'Access review: '||coalesce(a.decision,'reviewed'),'staff_access',a.subject_profile_id::text,
      coalesce(ps.full_name,ps.email),
      coalesce(a.decision,'recorded'),
      concat_ws(' · ',
        case when a.role_snapshot is not null then 'Role: '||a.role_snapshot end,
        case when a.job_title_snapshot is not null then 'Job title: '||a.job_title_snapshot end,
        case when a.department_snapshot is not null then 'Department: '||a.department_snapshot end,
        nullif(a.notes,'')
      ),
      a.reviewed_by,coalesce(pr.full_name,pr.email,'System'),
      'security_access_reviews',a.id::text
    from public.security_access_reviews a
    left join public.profiles ps on ps.id=a.subject_profile_id
    left join public.profiles pr on pr.id=a.reviewed_by

    union all

    select
      a.checked_at,a.checked_at::date,'Platform Security Check','IT, Security & Platform',
      a.check_name,'platform_security',a.id::text,
      a.check_area,
      coalesce(a.status,'recorded'),
      a.evidence,
      a.checked_by,coalesce(p.full_name,p.email,'System'),
      'platform_security_checks',a.id::text
    from public.platform_security_checks a
    left join public.profiles p on p.id=a.checked_by

    union all

    select
      coalesce(a.detected_at,a.created_at),coalesce(a.detected_at,a.created_at)::date,
      'Security Incident','IT, Security & Platform',
      a.title,'security_incident',a.id::text,
      coalesce(pa.full_name,pa.email),
      coalesce(a.status,'recorded'),
      concat_ws(' · ',
        case when a.severity is not null then 'Severity: '||a.severity end,
        nullif(a.description,''),
        case when nullif(a.resolution_notes,'') is not null then 'Resolution: '||a.resolution_notes end
      ),
      a.reported_by,coalesce(pr.full_name,pr.email,'System'),
      'security_incidents',a.id::text
    from public.security_incidents a
    left join public.profiles pr on pr.id=a.reported_by
    left join public.profiles pa on pa.id=a.assigned_to
  )
  select
    u.event_time,u.event_date,u.source,u.department,u.action,u.entity_type,u.entity_id,
    u.responsible_person,u.status,u.details,u.actor_id,u.actor_name,u.source_table,u.source_record_id
  from unified u
  where (p_from is null or u.event_date>=p_from)
    and (p_to is null or u.event_date<=p_to)
    and (p_source is null or p_source='' or lower(u.source)=lower(p_source))
    and (p_department is null or p_department='' or lower(u.department)=lower(p_department))
    and (p_status is null or p_status='' or lower(u.status)=lower(p_status))
    and (
      p_search is null or btrim(p_search)=''
      or concat_ws(' ',u.source,u.department,u.action,u.entity_type,u.entity_id,
                   u.responsible_person,u.status,u.details,u.actor_name)
         ilike '%'||btrim(p_search)||'%'
    )
  order by u.event_time desc nulls last
  limit greatest(1,least(coalesce(p_limit,5000),10000));
end;
$$;

revoke all on function public.admin_get_audit_register(date,date,text,text,text,text,integer)
from PUBLIC,anon;
grant execute on function public.admin_get_audit_register(date,date,text,text,text,text,integer)
to authenticated,service_role;
