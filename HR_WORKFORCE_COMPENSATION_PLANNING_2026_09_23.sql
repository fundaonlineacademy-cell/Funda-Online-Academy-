-- Funda Online Academy — HR Workforce & Compensation Planning
-- 2026-09-23
-- Planning only. Does not create staff, contracts, payroll or accounting entries.

create table if not exists public.hr_workforce_plans (
  id uuid primary key default gen_random_uuid(),
  role_title text not null check (length(btrim(role_title)) >= 2),
  department text not null check (length(btrim(department)) >= 2),
  employment_model text not null default 'full_time'
    check (employment_model in ('full_time','part_time','contractor','hourly_casual')),
  pay_basis text not null default 'monthly'
    check (pay_basis in ('monthly','hourly')),
  monthly_rate numeric(14,2) not null default 0 check (monthly_rate >= 0),
  hourly_rate numeric(14,2) not null default 0 check (hourly_rate >= 0),
  planned_weekly_hours numeric(8,2) not null default 0 check (planned_weekly_hours >= 0 and planned_weekly_hours <= 168),
  planned_headcount integer not null default 1 check (planned_headcount >= 1),
  employer_cost_per_person numeric(14,2) not null default 0 check (employer_cost_per_person >= 0),
  other_monthly_cost_per_person numeric(14,2) not null default 0 check (other_monthly_cost_per_person >= 0),
  start_month date not null,
  end_month date,
  status text not null default 'planning'
    check (status in ('planning','approved_plan','on_hold','retired')),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_month=date_trunc('month',start_month)::date),
  check (end_month is null or end_month=date_trunc('month',end_month)::date),
  check (end_month is null or end_month >= start_month),
  check (
    (pay_basis='monthly' and monthly_rate >= 0)
    or
    (pay_basis='hourly' and hourly_rate >= 0)
  )
);

alter table public.hr_workforce_plans enable row level security;

drop policy if exists hr_workforce_plans_read on public.hr_workforce_plans;
create policy hr_workforce_plans_read
on public.hr_workforce_plans for select to authenticated
using (
  public.is_admin()
  or public.has_department_access('Human Resources','read')
);

drop policy if exists hr_workforce_plans_insert on public.hr_workforce_plans;
create policy hr_workforce_plans_insert
on public.hr_workforce_plans for insert to authenticated
with check (
  public.is_admin()
  or public.has_department_access('Human Resources','edit')
);

drop policy if exists hr_workforce_plans_update on public.hr_workforce_plans;
create policy hr_workforce_plans_update
on public.hr_workforce_plans for update to authenticated
using (
  public.is_admin()
  or public.has_department_access('Human Resources','edit')
)
with check (
  public.is_admin()
  or public.has_department_access('Human Resources','edit')
);

revoke all on public.hr_workforce_plans from PUBLIC,anon,authenticated;
grant select,insert,update on public.hr_workforce_plans to authenticated;
grant all on public.hr_workforce_plans to service_role;

create or replace function public.get_hr_workforce_affordability(p_month date)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_month date;
  v_people_budget numeric(14,2):=0;
  v_revenue_target numeric(14,2):=0;
  v_monthly_cost numeric(14,2):=0;
  v_headcount integer:=0;
begin
  if not (
    public.is_admin()
    or public.has_department_access('Human Resources','read')
    or public.has_department_access('Finance & Accounting','read')
  ) then
    raise exception 'HR or Finance read access required' using errcode='42501';
  end if;

  if p_month is null then
    raise exception 'Planning month is required' using errcode='22023';
  end if;

  v_month:=date_trunc('month',p_month)::date;

  select coalesce(people_cost_budget,0),coalesce(revenue_target,0)
  into v_people_budget,v_revenue_target
  from public.finance_monthly_budgets
  where month_start=v_month;

  select
    coalesce(sum(
      planned_headcount * (
        case
          when pay_basis='hourly'
            then hourly_rate * planned_weekly_hours * 52 / 12
          else monthly_rate
        end
        + employer_cost_per_person
        + other_monthly_cost_per_person
      )
    ),0)::numeric(14,2),
    coalesce(sum(planned_headcount),0)::integer
  into v_monthly_cost,v_headcount
  from public.hr_workforce_plans
  where status in ('planning','approved_plan')
    and start_month<=v_month
    and (end_month is null or end_month>=v_month);

  return jsonb_build_object(
    'month_start',v_month,
    'planned_headcount',v_headcount,
    'planned_workforce_cost',v_monthly_cost,
    'finance_people_budget',coalesce(v_people_budget,0),
    'people_budget_gap',coalesce(v_people_budget,0)-v_monthly_cost,
    'monthly_revenue_target',coalesce(v_revenue_target,0),
    'workforce_cost_pct_of_revenue',
      case when coalesce(v_revenue_target,0)>0
        then round((v_monthly_cost/v_revenue_target)*100,2)
        else 0 end,
    'revenue_remaining_after_workforce',coalesce(v_revenue_target,0)-v_monthly_cost
  );
end;
$$;

revoke all on function public.get_hr_workforce_affordability(date) from PUBLIC,anon;
grant execute on function public.get_hr_workforce_affordability(date) to authenticated,service_role;
