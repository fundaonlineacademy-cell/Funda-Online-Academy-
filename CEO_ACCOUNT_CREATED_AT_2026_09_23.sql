-- Funda Online Academy — CEO Account Control creation-date read model
-- 2026-09-23
-- Additive only: preserves the existing CEO account-control actions and v1 list RPC.
-- Provides the original Auth account creation timestamp for the CEO-only account register.

create or replace function public.ceo_list_manageable_accounts_v2()
returns table (
  user_id uuid,
  full_name text,
  email text,
  role text,
  job_title text,
  department text,
  staff_code text,
  student_number text,
  account_created_at timestamptz,
  account_status text,
  status_reason text,
  status_changed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_ceo() then
    raise exception 'CEO authorisation is required.' using errcode='42501';
  end if;

  return query
  select
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.job_title,
    p.department,
    p.staff_number as staff_code,
    p.student_number,
    coalesce(u.created_at,p.created_at) as account_created_at,
    coalesce(s.status,'active') as account_status,
    s.reason as status_reason,
    s.changed_at as status_changed_at
  from public.profiles p
  left join auth.users u on u.id=p.id
  left join public.ceo_account_control_state s on s.user_id=p.id
  where pg_catalog.lower(p.role) in ('student','staff')
  order by
    case when coalesce(s.status,'active')='deleted' then 3
         when pg_catalog.lower(p.role)='staff' then 1
         else 2 end,
    pg_catalog.lower(coalesce(p.full_name,p.email,''));
end;
$$;

revoke all on function public.ceo_list_manageable_accounts_v2() from PUBLIC,anon;
grant execute on function public.ceo_list_manageable_accounts_v2() to authenticated,service_role;
