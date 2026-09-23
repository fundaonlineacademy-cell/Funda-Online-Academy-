-- Funda Online Academy — Ambassador Cost & Profitability Planning
-- 2026-09-23
-- Finance-side planning only. Does not alter the locked Ambassador portal,
-- commission engine, rank rules, payout controls or Ambassador earnings.

create table if not exists public.finance_ambassador_profitability_plans (
  id uuid primary key default gen_random_uuid(),
  month_start date not null,
  scenario_name text not null,
  projected_ambassador_revenue numeric(14,2) not null default 0 check (projected_ambassador_revenue >= 0),
  commission_rate_snapshot numeric(8,4) not null default 0.15 check (commission_rate_snapshot >= 0 and commission_rate_snapshot <= 1),
  projected_achievement_bonuses numeric(14,2) not null default 0 check (projected_achievement_bonuses >= 0),
  projected_monthly_performance numeric(14,2) not null default 0 check (projected_monthly_performance >= 0),
  projected_other_programme_cost numeric(14,2) not null default 0 check (projected_other_programme_cost >= 0),
  status text not null default 'planning' check (status in ('planning','approved_plan','archived')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finance_ambassador_plan_month_start check (month_start=date_trunc('month',month_start)::date),
  constraint finance_ambassador_plan_name_len check (char_length(btrim(scenario_name))>=3)
);

create unique index if not exists finance_ambassador_profitability_plan_name_month_uq
on public.finance_ambassador_profitability_plans(month_start,lower(scenario_name))
where status<>'archived';

alter table public.finance_ambassador_profitability_plans enable row level security;

drop policy if exists finance_ambassador_profitability_plans_read on public.finance_ambassador_profitability_plans;
create policy finance_ambassador_profitability_plans_read
on public.finance_ambassador_profitability_plans
for select to authenticated
using (
  public.is_admin()
  or public.has_department_access('Finance & Accounting','read')
);

revoke all on public.finance_ambassador_profitability_plans from PUBLIC,anon,authenticated;
grant select on public.finance_ambassador_profitability_plans to authenticated;
grant all on public.finance_ambassador_profitability_plans to service_role;

create or replace function public.finance_save_ambassador_profitability_plan(
  p_id uuid,
  p_month_start date,
  p_scenario_name text,
  p_projected_ambassador_revenue numeric,
  p_projected_achievement_bonuses numeric default 0,
  p_projected_monthly_performance numeric default 0,
  p_projected_other_programme_cost numeric default 0,
  p_notes text default null,
  p_status text default 'planning'
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_id uuid;
  v_month date:=date_trunc('month',p_month_start)::date;
begin
  if not (
    public.is_admin()
    or public.has_department_access('Finance & Accounting','edit')
  ) then
    raise exception 'Finance edit access required' using errcode='42501';
  end if;

  if p_month_start is null then
    raise exception 'Choose a planning month' using errcode='22023';
  end if;
  if char_length(btrim(coalesce(p_scenario_name,'')))<3 then
    raise exception 'Enter a clear scenario name' using errcode='22023';
  end if;
  if coalesce(p_projected_ambassador_revenue,0)<0
     or coalesce(p_projected_achievement_bonuses,0)<0
     or coalesce(p_projected_monthly_performance,0)<0
     or coalesce(p_projected_other_programme_cost,0)<0 then
    raise exception 'Scenario amounts cannot be negative' using errcode='22023';
  end if;
  if p_status not in ('planning','approved_plan') then
    raise exception 'Scenario status must be planning or approved_plan' using errcode='22023';
  end if;
  if p_status='approved_plan' and not (
    public.is_admin()
    or public.has_department_approval('Finance & Accounting')
  ) then
    raise exception 'Finance approval authority required for an approved plan' using errcode='42501';
  end if;

  if p_id is null then
    insert into public.finance_ambassador_profitability_plans(
      month_start,scenario_name,projected_ambassador_revenue,commission_rate_snapshot,
      projected_achievement_bonuses,projected_monthly_performance,projected_other_programme_cost,
      status,notes,created_by,updated_by
    ) values(
      v_month,btrim(p_scenario_name),coalesce(p_projected_ambassador_revenue,0),0.15,
      coalesce(p_projected_achievement_bonuses,0),coalesce(p_projected_monthly_performance,0),
      coalesce(p_projected_other_programme_cost,0),p_status,
      nullif(btrim(coalesce(p_notes,'')),''),auth.uid(),auth.uid()
    )
    returning id into v_id;
  else
    update public.finance_ambassador_profitability_plans
    set month_start=v_month,
        scenario_name=btrim(p_scenario_name),
        projected_ambassador_revenue=coalesce(p_projected_ambassador_revenue,0),
        commission_rate_snapshot=0.15,
        projected_achievement_bonuses=coalesce(p_projected_achievement_bonuses,0),
        projected_monthly_performance=coalesce(p_projected_monthly_performance,0),
        projected_other_programme_cost=coalesce(p_projected_other_programme_cost,0),
        status=p_status,
        notes=nullif(btrim(coalesce(p_notes,'')),''),
        updated_by=auth.uid(),
        updated_at=now()
    where id=p_id and status<>'archived'
    returning id into v_id;
    if v_id is null then
      raise exception 'Ambassador profitability scenario not found or already archived' using errcode='P0002';
    end if;
  end if;

  return v_id;
end;
$$;

create or replace function public.finance_archive_ambassador_profitability_plan(p_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if not (
    public.is_admin()
    or public.has_department_access('Finance & Accounting','edit')
  ) then
    raise exception 'Finance edit access required' using errcode='42501';
  end if;

  update public.finance_ambassador_profitability_plans
  set status='archived',updated_by=auth.uid(),updated_at=now()
  where id=p_id and status<>'archived';

  if not found then
    raise exception 'Ambassador profitability scenario not found or already archived' using errcode='P0002';
  end if;
end;
$$;

create or replace function public.finance_get_ambassador_profitability(p_month date)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_month date:=date_trunc('month',coalesce(p_month,current_date))::date;
  v_next date:=(date_trunc('month',coalesce(p_month,current_date))+interval '1 month')::date;
  v_result jsonb;
begin
  if not (
    public.is_admin()
    or public.has_department_access('Finance & Accounting','read')
  ) then
    raise exception 'Finance read access required' using errcode='42501';
  end if;

  with active_apps as (
    select id
    from public.ambassador_programme_applications
    where status='approved'
      and account_status in ('introductory','active')
  ),
  confirmed as (
    select l.*
    from public.ambassador_earnings_ledger l
    where l.created_at::date>=v_month
      and l.created_at::date<v_next
      and l.earning_status in ('approved','paid')
      and (
        l.earning_type<>'commission'
        or (
          l.payment_id is not null
          and public.ambassador_v2_payment_is_eligible(l.payment_id)
        )
      )
  ),
  actual as (
    select
      coalesce(sum(qualifying_revenue) filter (where earning_type='commission'),0)::numeric as attributed_revenue,
      coalesce(sum(commission_amount) filter (where earning_type='commission'),0)::numeric as commission_cost,
      coalesce(sum(commission_amount) filter (where earning_type='achievement_bonus'),0)::numeric as achievement_bonus_cost,
      coalesce(sum(commission_amount) filter (where earning_type='monthly_performance'),0)::numeric as monthly_performance_cost,
      count(*)::int as confirmed_earning_records
    from confirmed
  ),
  review_exposure as (
    select
      count(*)::int as records,
      coalesce(sum(commission_amount),0)::numeric as amount
    from public.ambassador_earnings_ledger
    where created_at::date>=v_month
      and created_at::date<v_next
      and earning_status in ('pending','held')
  ),
  reversed as (
    select
      count(*)::int as records,
      coalesce(sum(qualifying_revenue) filter (where earning_type='commission'),0)::numeric as qualifying_revenue,
      coalesce(sum(commission_amount),0)::numeric as amount
    from public.ambassador_earnings_ledger
    where created_at::date>=v_month
      and created_at::date<v_next
      and earning_status='reversed'
  ),
  paid_cash as (
    select
      count(*) filter (where status='paid')::int as records,
      coalesce(sum(amount) filter (where status='paid'),0)::numeric as amount
    from public.ambassador_payouts
    where payment_date>=v_month and payment_date<v_next
  ),
  budget as (
    select *
    from public.finance_monthly_budgets
    where month_start=v_month
    limit 1
  ),
  lifetime as (
    select
      a.id application_id,
      coalesce(sum(l.qualifying_revenue) filter (
        where l.earning_type='commission'
          and l.earning_status in ('approved','paid')
          and l.payment_id is not null
          and public.ambassador_v2_payment_is_eligible(l.payment_id)
      ),0)::numeric as lifetime_revenue
    from active_apps a
    left join public.ambassador_earnings_ledger l on l.application_id=a.id
    group by a.id
  ),
  ranks as (
    select
      case
        when lifetime_revenue>=1000000 then 'Elite'
        when lifetime_revenue>=500000 then 'Executive'
        when lifetime_revenue>=250000 then 'Diamond'
        when lifetime_revenue>=100000 then 'Platinum'
        when lifetime_revenue>=50000 then 'Gold'
        when lifetime_revenue>=25000 then 'Silver'
        when lifetime_revenue>=10000 then 'Bronze'
        else 'Ambassador'
      end rank_name,
      count(*)::int ambassador_count
    from lifetime
    group by 1
  ),
  rank_json as (
    select coalesce(jsonb_agg(
      jsonb_build_object('rank',rank_name,'count',ambassador_count)
      order by case rank_name
        when 'Elite' then 1 when 'Executive' then 2 when 'Diamond' then 3
        when 'Platinum' then 4 when 'Gold' then 5 when 'Silver' then 6
        when 'Bronze' then 7 else 8 end
    ),'[]'::jsonb) data
    from ranks
  )
  select jsonb_build_object(
    'month_start',v_month,
    'commission_rate',0.15,
    'active_ambassadors',(select count(*) from active_apps),
    'actual_attributed_revenue',a.attributed_revenue,
    'actual_commission_cost',a.commission_cost,
    'actual_achievement_bonus_cost',a.achievement_bonus_cost,
    'actual_monthly_performance_cost',a.monthly_performance_cost,
    'actual_total_earning_cost',a.commission_cost+a.achievement_bonus_cost+a.monthly_performance_cost,
    'actual_academy_contribution',a.attributed_revenue-(a.commission_cost+a.achievement_bonus_cost+a.monthly_performance_cost),
    'confirmed_earning_records',a.confirmed_earning_records,
    'review_exposure_records',re.records,
    'review_exposure_amount',re.amount,
    'reversed_records',rv.records,
    'reversed_qualifying_revenue',rv.qualifying_revenue,
    'reversed_amount',rv.amount,
    'payouts_paid_records',pc.records,
    'payouts_paid_cash',pc.amount,
    'revenue_target',coalesce(b.revenue_target,0),
    'ambassador_budget',coalesce(b.ambassador_budget,0),
    'direct_cost_budget',coalesce(b.direct_cost_budget,0),
    'people_cost_budget',coalesce(b.people_cost_budget,0),
    'operating_expense_budget',coalesce(b.operating_expense_budget,0),
    'other_expense_budget',coalesce(b.other_expense_budget,0),
    'minimum_surplus_target',coalesce(b.minimum_surplus_target,0),
    'rank_counts',rj.data,
    'plan_terms',jsonb_build_array(
      jsonb_build_object('rank','Ambassador','lifetime_revenue_threshold',0,'cumulative_achievement_bonus',0,'monthly_performance_cap',0),
      jsonb_build_object('rank','Bronze','lifetime_revenue_threshold',10000,'cumulative_achievement_bonus',500,'monthly_performance_cap',0),
      jsonb_build_object('rank','Silver','lifetime_revenue_threshold',25000,'cumulative_achievement_bonus',1000,'monthly_performance_cap',0),
      jsonb_build_object('rank','Gold','lifetime_revenue_threshold',50000,'cumulative_achievement_bonus',2500,'monthly_performance_cap',5000),
      jsonb_build_object('rank','Platinum','lifetime_revenue_threshold',100000,'cumulative_achievement_bonus',5000,'monthly_performance_cap',8000),
      jsonb_build_object('rank','Diamond','lifetime_revenue_threshold',250000,'cumulative_achievement_bonus',10000,'monthly_performance_cap',12000),
      jsonb_build_object('rank','Executive','lifetime_revenue_threshold',500000,'cumulative_achievement_bonus',20000,'monthly_performance_cap',18000),
      jsonb_build_object('rank','Elite','lifetime_revenue_threshold',1000000,'cumulative_achievement_bonus',45000,'monthly_performance_cap',25000)
    ),
    'generated_at',now()
  ) into v_result
  from actual a
  cross join review_exposure re
  cross join reversed rv
  cross join paid_cash pc
  left join budget b on true
  cross join rank_json rj;

  return v_result;
end;
$$;

-- Management P&L: recognise confirmed Ambassador programme earnings when earned.
-- Payouts are settlement/cash timing and are not a second expense.
create or replace function public.get_admin_management_pnl(p_from date, p_to date)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_closed public.finance_month_closes%rowtype;
  v_result jsonb;
begin
  if not (
    public.is_admin()
    or public.has_department_access('Finance & Accounting','read')
  ) then
    raise exception 'Finance read access required' using errcode='42501';
  end if;
  if p_from is null or p_to is null then
    raise exception 'A report start and end date are required' using errcode='22023';
  end if;
  if p_from > p_to then
    raise exception 'Start date cannot be after end date' using errcode='22023';
  end if;

  if p_from=date_trunc('month',p_from)::date
     and p_to=(date_trunc('month',p_from)+interval '1 month - 1 day')::date then
    select * into v_closed
    from public.finance_month_closes
    where month_start=p_from and status='closed';

    if found then
      return v_closed.pnl_snapshot
        || jsonb_build_object(
          'period_status','closed',
          'closed_at',v_closed.closed_at,
          'closed_by',v_closed.closed_by,
          'close_notes',v_closed.notes
        );
    end if;
  end if;

  with pay as (
    select
      coalesce(sum(amount) filter (
        where lower(coalesce(status,'')) in ('verified','paid','approved','completed')
      ),0)::numeric as tuition_revenue,
      coalesce(sum(amount) filter (
        where lower(coalesce(status,'')) not in ('verified','paid','approved','completed','rejected','declined')
      ),0)::numeric as pending_collections,
      count(*) filter (
        where lower(coalesce(status,'')) in ('verified','paid','approved','completed')
      )::int as verified_payment_records,
      count(*) filter (
        where lower(coalesce(status,'')) not in ('verified','paid','approved','completed','rejected','declined')
      )::int as pending_payment_records
    from public.payments
    where coalesce(verified_at,submitted_at,created_at)::date between p_from and p_to
  ),
  cash as (
    select c.*,
      coalesce(cat.parent_group,
        case when lower(c.entry_type)='income' then 'Other Income' else 'Other Expenses' end
      ) as parent_group
    from public.admin_cashbook c
    left join public.accounting_categories cat
      on lower(cat.category_type)=lower(c.entry_type)
     and lower(cat.name)=lower(c.category)
    where c.entry_date between p_from and p_to
      and c.entry_date<=current_date
      and coalesce(c.posting_status,'posted')='posted'
      and coalesce(lower(c.source_type),'manual') not in ('payment','student_payment')
  ),
  income_group as (
    select
      coalesce(sum(amount) filter (
        where lower(entry_type)='income' and parent_group='Operating Income'
      ),0)::numeric as operating_cash_income,
      coalesce(sum(amount) filter (
        where lower(entry_type)='income' and parent_group='Other Operating Income'
      ),0)::numeric as other_operating_income,
      coalesce(sum(amount) filter (
        where lower(entry_type)='income' and parent_group='Finance Income'
      ),0)::numeric as finance_income,
      coalesce(sum(amount) filter (
        where lower(entry_type)='income'
          and parent_group not in ('Operating Income','Other Operating Income','Finance Income')
      ),0)::numeric as non_operating_income
    from cash
  ),
  expense_group as (
    select
      coalesce(sum(amount) filter (
        where lower(entry_type)='expense' and parent_group='Direct Costs'
      ),0)::numeric as direct_costs,
      coalesce(sum(amount) filter (
        where lower(entry_type)='expense' and parent_group='People Costs'
      ),0)::numeric as people_costs,
      coalesce(sum(amount) filter (
        where lower(entry_type)='expense' and parent_group='Operating Expenses'
      ),0)::numeric as operating_expenses,
      coalesce(sum(amount) filter (
        where lower(entry_type)='expense' and parent_group='Depreciation & Amortisation'
      ),0)::numeric as depreciation_amortisation,
      coalesce(sum(amount) filter (
        where lower(entry_type)='expense' and parent_group='Finance Costs'
      ),0)::numeric as finance_costs,
      coalesce(sum(amount) filter (
        where lower(entry_type)='expense' and parent_group='Tax Expense'
      ),0)::numeric as tax_expense,
      coalesce(sum(amount) filter (
        where lower(entry_type)='expense'
          and parent_group not in (
            'Direct Costs','People Costs','Operating Expenses',
            'Depreciation & Amortisation','Finance Costs','Tax Expense'
          )
      ),0)::numeric as non_operating_expenses
    from cash
  ),
  ambassador as (
    select
      coalesce(sum(commission_amount) filter (
        where earning_type='commission'
          and earning_status in ('approved','paid')
          and payment_id is not null
          and public.ambassador_v2_payment_is_eligible(payment_id)
      ),0)::numeric as commission_cost,
      coalesce(sum(commission_amount) filter (
        where earning_type='achievement_bonus'
          and earning_status in ('approved','paid')
      ),0)::numeric as achievement_bonus_cost,
      coalesce(sum(commission_amount) filter (
        where earning_type='monthly_performance'
          and earning_status in ('approved','paid')
      ),0)::numeric as monthly_performance_cost,
      count(*) filter (
        where earning_status in ('approved','paid')
          and (
            earning_type<>'commission'
            or (payment_id is not null and public.ambassador_v2_payment_is_eligible(payment_id))
          )
      )::int as earning_records
    from public.ambassador_earnings_ledger
    where created_at::date between p_from and p_to
  ),
  inc_lines as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object('category',category,'group',parent_group,'amount',amount)
        order by parent_group,amount desc,category
      ),
      '[]'::jsonb
    ) lines
    from (
      select category,parent_group,sum(amount)::numeric amount
      from cash
      where lower(entry_type)='income'
      group by category,parent_group
    ) q
  ),
  exp_lines as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object('category',category,'group',parent_group,'amount',amount)
        order by parent_group,amount desc,category
      ),
      '[]'::jsonb
    ) lines
    from (
      select category,parent_group,sum(amount)::numeric amount
      from cash
      where lower(entry_type)='expense'
      group by category,parent_group
    ) q
  ),
  counts as (
    select
      count(*) filter (where lower(entry_type)='income')::int cash_income_records,
      count(*) filter (where lower(entry_type)='expense')::int cash_expense_records
    from cash
  ),
  future_posted as (
    select count(*)::int records,coalesce(sum(amount),0)::numeric amount
    from public.admin_cashbook
    where entry_date between p_from and p_to
      and entry_date>current_date
      and coalesce(posting_status,'posted')='posted'
      and coalesce(lower(source_type),'manual') not in ('payment','student_payment')
  ),
  totals as (
    select
      pay.tuition_revenue + ig.operating_cash_income as turnover,
      pay.tuition_revenue + ig.operating_cash_income - eg.direct_costs as gross_profit,
      pay.tuition_revenue + ig.operating_cash_income - eg.direct_costs
        + ig.other_operating_income - eg.people_costs - eg.operating_expenses
        - (am.commission_cost+am.achievement_bonus_cost+am.monthly_performance_cost)
        as operating_profit_before_da,
      pay.tuition_revenue + ig.operating_cash_income - eg.direct_costs
        + ig.other_operating_income - eg.people_costs - eg.operating_expenses
        - (am.commission_cost+am.achievement_bonus_cost+am.monthly_performance_cost)
        - eg.depreciation_amortisation
        as operating_profit,
      pay.tuition_revenue + ig.operating_cash_income - eg.direct_costs
        + ig.other_operating_income - eg.people_costs - eg.operating_expenses
        - (am.commission_cost+am.achievement_bonus_cost+am.monthly_performance_cost)
        - eg.depreciation_amortisation
        + ig.finance_income + ig.non_operating_income
        - eg.finance_costs - eg.non_operating_expenses
        as profit_before_tax
    from pay
    cross join income_group ig
    cross join expense_group eg
    cross join ambassador am
  )
  select jsonb_build_object(
    'period_start',p_from,
    'period_end',p_to,
    'period_status','live',

    'tuition_revenue',pay.tuition_revenue,
    'operating_cash_income',ig.operating_cash_income,
    'turnover',t.turnover,
    'other_operating_income',ig.other_operating_income,
    'finance_income',ig.finance_income,
    'non_operating_income',ig.non_operating_income,
    'other_income',ig.other_operating_income+ig.finance_income+ig.non_operating_income,
    'total_income',t.turnover+ig.other_operating_income+ig.finance_income+ig.non_operating_income,

    'direct_costs',eg.direct_costs,
    'gross_profit',t.gross_profit,
    'people_costs',eg.people_costs,
    'operating_expenses',eg.operating_expenses,
    'ambassador_commission_cost',am.commission_cost,
    'ambassador_achievement_bonus_cost',am.achievement_bonus_cost,
    'ambassador_monthly_performance_cost',am.monthly_performance_cost,
    'ambassador_costs',am.commission_cost+am.achievement_bonus_cost+am.monthly_performance_cost,
    'ambassador_earning_records',am.earning_records,
    'depreciation_amortisation',eg.depreciation_amortisation,
    'operating_profit_before_da',t.operating_profit_before_da,
    'operating_profit',t.operating_profit,
    'finance_costs',eg.finance_costs,
    'non_operating_expenses',eg.non_operating_expenses,
    'profit_before_tax',t.profit_before_tax,
    'tax_expense',eg.tax_expense,
    'other_expenses',eg.depreciation_amortisation+eg.finance_costs+eg.tax_expense+eg.non_operating_expenses,
    'total_expenses',eg.direct_costs+eg.people_costs+eg.operating_expenses
      +(am.commission_cost+am.achievement_bonus_cost+am.monthly_performance_cost)
      +eg.depreciation_amortisation+eg.finance_costs+eg.tax_expense+eg.non_operating_expenses,
    'net_result',t.profit_before_tax-eg.tax_expense,

    'pending_collections',pay.pending_collections,
    'verified_payment_records',pay.verified_payment_records,
    'pending_payment_records',pay.pending_payment_records,
    'cash_income_records',ct.cash_income_records,
    'cash_expense_records',ct.cash_expense_records,
    'future_posted_records',fp.records,
    'future_posted_amount',fp.amount,
    'income_lines',il.lines,
    'expense_lines',el.lines,
    'generated_at',now()
  ) into v_result
  from pay
  cross join income_group ig
  cross join expense_group eg
  cross join ambassador am
  cross join inc_lines il
  cross join exp_lines el
  cross join counts ct
  cross join future_posted fp
  cross join totals t;

  return v_result;
end;
$$;

revoke all on function public.finance_save_ambassador_profitability_plan(uuid,date,text,numeric,numeric,numeric,numeric,text,text) from PUBLIC,anon;
revoke all on function public.finance_archive_ambassador_profitability_plan(uuid) from PUBLIC,anon;
revoke all on function public.finance_get_ambassador_profitability(date) from PUBLIC,anon;
revoke all on function public.get_admin_management_pnl(date,date) from PUBLIC,anon;

grant execute on function public.finance_save_ambassador_profitability_plan(uuid,date,text,numeric,numeric,numeric,numeric,text,text) to authenticated,service_role;
grant execute on function public.finance_archive_ambassador_profitability_plan(uuid) to authenticated,service_role;
grant execute on function public.finance_get_ambassador_profitability(date) to authenticated,service_role;
grant execute on function public.get_admin_management_pnl(date,date) to authenticated,service_role;
