-- Funda Online Academy — Expenses, Income & strategic Management P&L audit
-- 2026-09-23
-- Additive chart-of-accounts coverage plus a fuller management P&L hierarchy.
-- Existing finance controls, month-close snapshots, verified-payment recognition,
-- void/planned exclusions and access checks are preserved.

insert into public.accounting_categories(category_type,name,parent_group,active)
values
  ('income','Grants & Sponsorships','Other Operating Income',true),
  ('income','Other Operating Income','Other Operating Income',true),
  ('income','Interest Income','Finance Income',true),
  ('income','Other Non-operating Income','Other Income',true),

  ('expense','Course Materials & Learning Resources','Direct Costs',true),
  ('expense','Assessment & Certification Costs','Direct Costs',true),
  ('expense','Facilitator / Tutor Delivery Costs','Direct Costs',true),
  ('expense','Payment Processing Fees','Direct Costs',true),
  ('expense','Student Refunds & Credits','Direct Costs',true),

  ('expense','Employer Contributions & Benefits','People Costs',true),
  ('expense','Contractors & Freelancers','People Costs',true),
  ('expense','Recruitment & Staff Welfare','People Costs',true),

  ('expense','Insurance','Operating Expenses',true),
  ('expense','Licences, Registrations & Compliance','Operating Expenses',true),
  ('expense','Rent & Premises','Operating Expenses',true),
  ('expense','Utilities','Operating Expenses',true),
  ('expense','Repairs & Maintenance','Operating Expenses',true),
  ('expense','Printing & Stationery','Operating Expenses',true),
  ('expense','Security & Data Protection','Operating Expenses',true),
  ('expense','Courier & Postage','Operating Expenses',true),
  ('expense','Bad Debts & Write-offs','Operating Expenses',true),

  ('expense','Depreciation & Amortisation','Depreciation & Amortisation',true),
  ('expense','Interest & Finance Costs','Finance Costs',true),
  ('expense','Income Tax Expense','Tax Expense',true),
  ('expense','Other Non-operating Expenses','Other Expenses',true)
on conflict(category_type,name) do update
set parent_group=excluded.parent_group,
    active=true;

create or replace function public.get_admin_management_pnl(
  p_from date,
  p_to date
)
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
        as operating_profit_before_da,
      pay.tuition_revenue + ig.operating_cash_income - eg.direct_costs
        + ig.other_operating_income - eg.people_costs - eg.operating_expenses
        - eg.depreciation_amortisation
        as operating_profit,
      pay.tuition_revenue + ig.operating_cash_income - eg.direct_costs
        + ig.other_operating_income - eg.people_costs - eg.operating_expenses
        - eg.depreciation_amortisation
        + ig.finance_income + ig.non_operating_income
        - eg.finance_costs - eg.non_operating_expenses
        as profit_before_tax
    from pay
    cross join income_group ig
    cross join expense_group eg
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
    'depreciation_amortisation',eg.depreciation_amortisation,
    'operating_profit_before_da',t.operating_profit_before_da,
    'operating_profit',t.operating_profit,
    'finance_costs',eg.finance_costs,
    'non_operating_expenses',eg.non_operating_expenses,
    'profit_before_tax',t.profit_before_tax,
    'tax_expense',eg.tax_expense,
    'other_expenses',eg.depreciation_amortisation+eg.finance_costs+eg.tax_expense+eg.non_operating_expenses,
    'total_expenses',eg.direct_costs+eg.people_costs+eg.operating_expenses
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
  cross join inc_lines il
  cross join exp_lines el
  cross join counts ct
  cross join future_posted fp
  cross join totals t;

  return v_result;
end;
$$;

revoke all on function public.get_admin_management_pnl(date,date) from PUBLIC,anon;
grant execute on function public.get_admin_management_pnl(date,date) to authenticated,service_role;
