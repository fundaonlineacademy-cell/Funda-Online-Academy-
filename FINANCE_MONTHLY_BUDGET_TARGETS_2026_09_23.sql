-- Funda Online Academy — Monthly Budget & Target Planner
-- 2026-09-23
-- FY1: 1 Oct 2026 - 30 Sep 2027
-- Adds monthly planning only. Actual P&L recognition remains unchanged.

create table if not exists public.finance_monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  month_start date not null unique,
  revenue_target numeric(14,2) not null default 0 check (revenue_target >= 0),
  direct_cost_budget numeric(14,2) not null default 0 check (direct_cost_budget >= 0),
  people_cost_budget numeric(14,2) not null default 0 check (people_cost_budget >= 0),
  operating_expense_budget numeric(14,2) not null default 0 check (operating_expense_budget >= 0),
  ambassador_budget numeric(14,2) not null default 0 check (ambassador_budget >= 0),
  other_expense_budget numeric(14,2) not null default 0 check (other_expense_budget >= 0),
  minimum_surplus_target numeric(14,2) not null default 0 check (minimum_surplus_target >= 0),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (month_start=date_trunc('month',month_start)::date)
);

alter table public.finance_monthly_budgets enable row level security;

drop policy if exists finance_monthly_budgets_read on public.finance_monthly_budgets;
create policy finance_monthly_budgets_read
on public.finance_monthly_budgets for select to authenticated
using (
  public.is_admin()
  or public.has_department_access('Finance & Accounting','read')
);

drop policy if exists finance_monthly_budgets_write on public.finance_monthly_budgets;
create policy finance_monthly_budgets_write
on public.finance_monthly_budgets for insert to authenticated
with check (
  public.is_admin()
  or public.has_department_access('Finance & Accounting','edit')
);

drop policy if exists finance_monthly_budgets_update on public.finance_monthly_budgets;
create policy finance_monthly_budgets_update
on public.finance_monthly_budgets for update to authenticated
using (
  public.is_admin()
  or public.has_department_access('Finance & Accounting','edit')
)
with check (
  public.is_admin()
  or public.has_department_access('Finance & Accounting','edit')
);

revoke all on public.finance_monthly_budgets from PUBLIC,anon,authenticated;
grant select,insert,update on public.finance_monthly_budgets to authenticated;
grant all on public.finance_monthly_budgets to service_role;

-- Keep a dedicated actual-expense category ready for future Ambassador costs.
insert into public.accounting_categories(category_type,name,parent_group,active)
values ('expense','Ambassador Commissions & Incentives','Operating Expenses',true)
on conflict(category_type,name) do update
set parent_group=excluded.parent_group, active=true;

-- Baseline FY1 monthly revenue targets. Expense budgets remain zero until approved.
do $$
declare
  v_anchor date;
  v_target numeric(14,2);
  v_base numeric(14,2);
  v_month date;
  i int;
  v_amount numeric(14,2);
begin
  select financial_year_anchor,annual_turnover_target
  into v_anchor,v_target
  from public.finance_management_settings
  where singleton=true;

  if v_anchor is null then v_anchor:=date '2026-10-01'; end if;
  if v_target is null then v_target:=1000000; end if;

  v_base:=round(v_target/12,2);
  for i in 0..11 loop
    v_month:=(v_anchor + make_interval(months=>i))::date;
    v_amount:=case when i=11 then v_target-(v_base*11) else v_base end;

    insert into public.finance_monthly_budgets(
      month_start,revenue_target,direct_cost_budget,people_cost_budget,
      operating_expense_budget,ambassador_budget,other_expense_budget,
      minimum_surplus_target
    )
    values(v_month,v_amount,0,0,0,0,0,0)
    on conflict(month_start) do nothing;
  end loop;
end $$;

create or replace function public.finance_distribute_annual_target(
  p_fy_start date,
  p_annual_target numeric
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_start date;
  v_base numeric(14,2);
  v_month date;
  v_amount numeric(14,2);
  i int;
begin
  if not (
    public.is_admin()
    or public.has_department_access('Finance & Accounting','edit')
  ) then
    raise exception 'Finance edit access required' using errcode='42501';
  end if;

  if p_fy_start is null
     or extract(day from p_fy_start)<>1
     or extract(month from p_fy_start)<>10 then
    raise exception 'Management financial year must begin on 1 October' using errcode='22023';
  end if;

  if p_annual_target is null or p_annual_target<0 then
    raise exception 'Annual target must be zero or greater' using errcode='22023';
  end if;

  v_start:=p_fy_start;
  v_base:=round(p_annual_target/12,2);

  for i in 0..11 loop
    v_month:=(v_start + make_interval(months=>i))::date;
    v_amount:=case when i=11 then p_annual_target-(v_base*11) else v_base end;

    insert into public.finance_monthly_budgets(month_start,revenue_target)
    values(v_month,v_amount)
    on conflict(month_start) do update
      set revenue_target=excluded.revenue_target,
          updated_at=now(),
          updated_by=auth.uid();
  end loop;
end;
$$;

revoke all on function public.finance_distribute_annual_target(date,numeric) from PUBLIC,anon;
grant execute on function public.finance_distribute_annual_target(date,numeric) to authenticated,service_role;
