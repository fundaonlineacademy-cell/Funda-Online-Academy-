-- Funda Online Academy — Expenses, Income & Management P&L finalisation
-- 2026-09-21
-- Management reporting only. The configured October-September cycle is an
-- internal management year and must not be presented as a statutory tax year
-- unless confirmed by the Academy's accountant.

alter table public.admin_cashbook
  add column if not exists posting_status text not null default 'posted',
  add column if not exists recurrence text not null default 'none',
  add column if not exists void_reason text,
  add column if not exists voided_by uuid references public.profiles(id) on delete set null,
  add column if not exists voided_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.admin_cashbook'::regclass
      and conname='admin_cashbook_posting_status_check'
  ) then
    alter table public.admin_cashbook
      add constraint admin_cashbook_posting_status_check
      check (posting_status in ('posted','planned','voided'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.admin_cashbook'::regclass
      and conname='admin_cashbook_recurrence_check'
  ) then
    alter table public.admin_cashbook
      add constraint admin_cashbook_recurrence_check
      check (recurrence in ('none','monthly'));
  end if;
end $$;

create table if not exists public.finance_management_settings (
  singleton boolean primary key default true check (singleton),
  financial_year_anchor date not null default date '2026-10-01',
  fiscal_year_start_month smallint not null default 10 check (fiscal_year_start_month between 1 and 12),
  annual_turnover_target numeric(14,2) not null default 1000000 check (annual_turnover_target >= 0),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.finance_management_settings(singleton,financial_year_anchor,fiscal_year_start_month,annual_turnover_target)
values(true,date '2026-10-01',10,1000000)
on conflict(singleton) do nothing;

alter table public.finance_management_settings enable row level security;
drop policy if exists finance_management_settings_read on public.finance_management_settings;
create policy finance_management_settings_read
on public.finance_management_settings for select to authenticated
using (
  public.is_admin()
  or public.has_department_access('Finance & Accounting','read')
);
drop policy if exists finance_management_settings_admin_update on public.finance_management_settings;
create policy finance_management_settings_admin_update
on public.finance_management_settings for update to authenticated
using (public.is_admin()) with check (public.is_admin());

revoke all on public.finance_management_settings from PUBLIC,anon,authenticated;
grant select on public.finance_management_settings to authenticated;
grant update on public.finance_management_settings to authenticated;
grant all on public.finance_management_settings to service_role;

create table if not exists public.finance_month_closes (
  id uuid primary key default gen_random_uuid(),
  month_start date not null unique,
  status text not null default 'closed' check (status in ('closed','reopened')),
  pnl_snapshot jsonb not null,
  notes text,
  closed_by uuid references public.profiles(id) on delete set null,
  closed_at timestamptz not null default now(),
  reopened_by uuid references public.profiles(id) on delete set null,
  reopened_at timestamptz,
  reopen_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (month_start=date_trunc('month',month_start)::date)
);

alter table public.finance_month_closes enable row level security;
drop policy if exists finance_month_closes_read on public.finance_month_closes;
create policy finance_month_closes_read
on public.finance_month_closes for select to authenticated
using (
  public.is_admin()
  or public.has_department_access('Finance & Accounting','read')
);
revoke all on public.finance_month_closes from PUBLIC,anon,authenticated;
grant select on public.finance_month_closes to authenticated;
grant all on public.finance_month_closes to service_role;

-- Cashbook history must not be hard-deleted by browser users.
revoke all on public.admin_cashbook from anon,authenticated;
grant select,insert,update on public.admin_cashbook to authenticated;
grant all on public.admin_cashbook to service_role;

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
      coalesce(sum(amount) filter (where lower(entry_type)='income' and parent_group='Operating Income'),0)::numeric as operating_cash_income,
      coalesce(sum(amount) filter (where lower(entry_type)='income' and parent_group<>'Operating Income'),0)::numeric as other_income
    from cash
  ),
  expense_group as (
    select
      coalesce(sum(amount) filter (where lower(entry_type)='expense' and parent_group='Direct Costs'),0)::numeric as direct_costs,
      coalesce(sum(amount) filter (where lower(entry_type)='expense' and parent_group='People Costs'),0)::numeric as people_costs,
      coalesce(sum(amount) filter (where lower(entry_type)='expense' and parent_group='Operating Expenses'),0)::numeric as operating_expenses,
      coalesce(sum(amount) filter (where lower(entry_type)='expense' and parent_group not in ('Direct Costs','People Costs','Operating Expenses')),0)::numeric as other_expenses
    from cash
  ),
  inc_lines as (
    select coalesce(
      jsonb_agg(jsonb_build_object('category',category,'group',parent_group,'amount',amount) order by amount desc),
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
      jsonb_agg(jsonb_build_object('category',category,'group',parent_group,'amount',amount) order by parent_group,amount desc),
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
  )
  select jsonb_build_object(
    'period_start',p_from,
    'period_end',p_to,
    'period_status','live',
    'tuition_revenue',pay.tuition_revenue,
    'operating_cash_income',ig.operating_cash_income,
    'turnover',pay.tuition_revenue+ig.operating_cash_income,
    'other_income',ig.other_income,
    'total_income',pay.tuition_revenue+ig.operating_cash_income+ig.other_income,
    'direct_costs',eg.direct_costs,
    'gross_profit',pay.tuition_revenue+ig.operating_cash_income-eg.direct_costs,
    'people_costs',eg.people_costs,
    'operating_expenses',eg.operating_expenses,
    'other_expenses',eg.other_expenses,
    'total_expenses',eg.direct_costs+eg.people_costs+eg.operating_expenses+eg.other_expenses,
    'net_result',pay.tuition_revenue+ig.operating_cash_income+ig.other_income
      -eg.direct_costs-eg.people_costs-eg.operating_expenses-eg.other_expenses,
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
  cross join future_posted fp;

  return v_result;
end;
$$;

revoke all on function public.get_admin_management_pnl(date,date) from PUBLIC,anon;
grant execute on function public.get_admin_management_pnl(date,date) to authenticated,service_role;

create or replace function public.finance_close_month(
  p_month_start date,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_month date:=date_trunc('month',p_month_start)::date;
  v_end date:=(date_trunc('month',p_month_start)+interval '1 month - 1 day')::date;
  v_snapshot jsonb;
  v_row public.finance_month_closes%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Administrator approval is required to close a finance month' using errcode='42501';
  end if;
  if v_end >= current_date then
    raise exception 'A finance month can be closed only after the month has ended' using errcode='22023';
  end if;

  select * into v_row from public.finance_month_closes where month_start=v_month;
  if found and v_row.status='closed' then
    raise exception 'This finance month is already closed' using errcode='23505';
  end if;

  v_snapshot:=public.get_admin_management_pnl(v_month,v_end);

  insert into public.finance_month_closes(
    month_start,status,pnl_snapshot,notes,closed_by,closed_at,reopened_by,reopened_at,reopen_reason,updated_at
  )
  values(v_month,'closed',v_snapshot,p_notes,auth.uid(),now(),null,null,null,now())
  on conflict(month_start) do update set
    status='closed',
    pnl_snapshot=excluded.pnl_snapshot,
    notes=excluded.notes,
    closed_by=excluded.closed_by,
    closed_at=excluded.closed_at,
    reopened_by=null,
    reopened_at=null,
    reopen_reason=null,
    updated_at=now();

  return v_snapshot||jsonb_build_object('period_status','closed','closed_at',now(),'close_notes',p_notes);
end;
$$;

create or replace function public.finance_reopen_month(
  p_month_start date,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator approval is required to reopen a finance month' using errcode='42501';
  end if;
  if char_length(btrim(coalesce(p_reason,'')))<8 then
    raise exception 'Enter a clear reopening reason of at least 8 characters' using errcode='22023';
  end if;
  update public.finance_month_closes
  set status='reopened',reopened_by=auth.uid(),reopened_at=now(),reopen_reason=btrim(p_reason),updated_at=now()
  where month_start=date_trunc('month',p_month_start)::date and status='closed';
  if not found then
    raise exception 'Closed finance month not found' using errcode='P0002';
  end if;
end;
$$;

revoke all on function public.finance_close_month(date,text) from PUBLIC,anon;
revoke all on function public.finance_reopen_month(date,text) from PUBLIC,anon;
grant execute on function public.finance_close_month(date,text) to authenticated,service_role;
grant execute on function public.finance_reopen_month(date,text) to authenticated,service_role;

create or replace function public.guard_finance_cashbook_insert()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if auth.uid() is not null
     and not public.is_admin()
     and not public.has_department_access('Finance & Accounting','edit') then
    raise exception 'Finance edit access required' using errcode='42501';
  end if;

  if new.amount is null or new.amount<=0 then
    raise exception 'Cashbook amount must be greater than zero' using errcode='22023';
  end if;

  new.posting_status:=coalesce(new.posting_status,'posted');
  new.recurrence:=coalesce(new.recurrence,'none');

  if new.source_type='student_payment' then
    new.posting_status:='posted';
    new.recurrence:='none';
  elsif new.posting_status='posted' and new.entry_date>current_date then
    raise exception 'Future-dated cashbook items must be saved as planned, not posted' using errcode='22023';
  end if;

  if new.posting_status='posted' and exists(
    select 1 from public.finance_month_closes mc
    where mc.month_start=date_trunc('month',new.entry_date)::date
      and mc.status='closed'
  ) then
    raise exception 'This finance month is closed. Record an adjustment in an open period instead.' using errcode='22023';
  end if;

  new.updated_at:=now();
  return new;
end;
$$;

drop trigger if exists trg_guard_finance_cashbook_insert on public.admin_cashbook;
create trigger trg_guard_finance_cashbook_insert
before insert on public.admin_cashbook
for each row execute function public.guard_finance_cashbook_insert();

create or replace function public.guard_finance_cashbook_update()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_special boolean:=coalesce(current_setting('funda.finance_cashbook_rpc',true),'')='on';
begin
  if auth.uid() is not null
     and not public.is_admin()
     and not public.has_department_access('Finance & Accounting','edit') then
    raise exception 'Finance edit access required' using errcode='42501';
  end if;

  if new.id is distinct from old.id
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at
     or new.source_type is distinct from old.source_type
     or new.source_id is distinct from old.source_id then
    raise exception 'Protected cashbook source fields cannot be changed';
  end if;

  if old.posting_status='voided' and not v_special then
    raise exception 'Voided cashbook entries cannot be edited';
  end if;

  if new.posting_status is distinct from old.posting_status and not v_special then
    raise exception 'Use the controlled Post or Void action to change posting status';
  end if;

  if old.source_type='student_payment' and (
    new.entry_type is distinct from old.entry_type
    or new.amount is distinct from old.amount
    or new.reference_number is distinct from old.reference_number
    or new.entry_date is distinct from old.entry_date
    or new.category is distinct from old.category
  ) then
    raise exception 'Student-payment cashbook amounts, dates, categories and references are protected';
  end if;

  if old.reconciliation_status='reconciled'
     and not v_special
     and (
       new.entry_type is distinct from old.entry_type
       or new.amount is distinct from old.amount
       or new.entry_date is distinct from old.entry_date
       or new.category is distinct from old.category
       or new.counterparty is distinct from old.counterparty
       or new.reference_number is distinct from old.reference_number
     ) then
    raise exception 'Reconciled accounting values cannot be rewritten. Use a controlled adjustment instead.';
  end if;

  if new.posting_status='posted'
     and new.entry_date>current_date
     and old.posting_status is distinct from 'posted' then
    raise exception 'A planned item cannot be posted with a future date';
  end if;

  if new.posting_status='posted'
     and exists(
       select 1 from public.finance_month_closes mc
       where mc.month_start=date_trunc('month',new.entry_date)::date
         and mc.status='closed'
     )
     and (
       old.posting_status is distinct from 'posted'
       or new.entry_date is distinct from old.entry_date
       or new.amount is distinct from old.amount
       or new.entry_type is distinct from old.entry_type
     ) then
    raise exception 'This finance month is closed. Record an adjustment in an open period instead.';
  end if;

  if new.reconciliation_status is distinct from old.reconciliation_status then
    if old.reconciliation_status='reconciled' then
      raise exception 'A reconciled entry cannot be returned to unreconciled by direct edit';
    end if;
    if new.reconciliation_status='reconciled' then
      if not (
        public.is_admin()
        or public.has_department_approval('Finance & Accounting')
      ) then
        raise exception 'Finance approval authority required to reconcile cashbook entries';
      end if;
      new.reconciled_by:=auth.uid();
      new.reconciled_at:=now();
    end if;
  end if;

  new.updated_at:=now();
  return new;
end;
$$;

drop trigger if exists trg_guard_finance_cashbook_update on public.admin_cashbook;
create trigger trg_guard_finance_cashbook_update
before update on public.admin_cashbook
for each row execute function public.guard_finance_cashbook_update();

revoke all on function public.guard_finance_cashbook_insert() from PUBLIC,anon,authenticated;
revoke all on function public.guard_finance_cashbook_update() from PUBLIC,anon,authenticated;

create or replace function public.finance_post_planned_cashbook_entry(
  p_id uuid,
  p_entry_date date default current_date
)
returns void
language plpgsql
security definer
set search_path=''
as $
declare
  v_row public.admin_cashbook%rowtype;
  v_next date;
begin
  if not (
    public.is_admin()
    or public.has_department_access('Finance & Accounting','edit')
  ) then
    raise exception 'Finance edit access required' using errcode='42501';
  end if;
  if p_entry_date>current_date then
    raise exception 'A planned item cannot be posted with a future date' using errcode='22023';
  end if;

  select * into v_row
  from public.admin_cashbook
  where id=p_id and posting_status='planned'
  for update;
  if not found then raise exception 'Planned cashbook item not found' using errcode='P0002'; end if;

  if v_row.recurrence='monthly' then
    v_next:=(v_row.entry_date+interval '1 month')::date;
    insert into public.admin_cashbook(
      entry_type,category,description,amount,entry_date,counterparty,reference_number,payment_method,
      department,tax_treatment,reconciliation_status,source_type,source_id,receipt_url,created_by,
      posting_status,recurrence
    ) values(
      v_row.entry_type,v_row.category,v_row.description,v_row.amount,v_next,v_row.counterparty,null,v_row.payment_method,
      v_row.department,v_row.tax_treatment,'unreconciled','manual',null,v_row.receipt_url,auth.uid(),
      'planned','monthly'
    );
  end if;

  perform set_config('funda.finance_cashbook_rpc','on',true);
  update public.admin_cashbook
  set posting_status='posted',entry_date=p_entry_date,recurrence='none',updated_at=now()
  where id=p_id;
end;
$;

create or replace function public.finance_void_cashbook_entry(
  p_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if not (
    public.is_admin()
    or public.has_department_approval('Finance & Accounting')
  ) then
    raise exception 'Finance approval authority required to void a cashbook entry' using errcode='42501';
  end if;
  if char_length(btrim(coalesce(p_reason,'')))<8 then
    raise exception 'Enter a clear void reason of at least 8 characters' using errcode='22023';
  end if;
  perform set_config('funda.finance_cashbook_rpc','on',true);
  update public.admin_cashbook
  set posting_status='voided',void_reason=btrim(p_reason),voided_by=auth.uid(),voided_at=now(),updated_at=now()
  where id=p_id and posting_status<>'voided';
  if not found then raise exception 'Active cashbook entry not found' using errcode='P0002'; end if;
end;
$$;

revoke all on function public.finance_post_planned_cashbook_entry(uuid,date) from PUBLIC,anon;
revoke all on function public.finance_void_cashbook_entry(uuid,text) from PUBLIC,anon;
grant execute on function public.finance_post_planned_cashbook_entry(uuid,date) to authenticated,service_role;
grant execute on function public.finance_void_cashbook_entry(uuid,text) to authenticated,service_role;

-- Keep the existing Finance Control Centre canonical calculations aligned
-- with the cashbook posting rules and avoid double-counting imported payments.
create or replace function public.get_admin_finance_period(p_from date default null,p_to date default null)
returns jsonb
language plpgsql
security definer
set search_path='public'
as $$
declare result jsonb;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_from is not null and p_to is not null and p_from>p_to then
    raise exception 'Start date cannot be after end date';
  end if;

  with p as (
    select
      count(*)::int as payment_records,
      coalesce(sum(case when lower(coalesce(status,'')) in ('verified','paid','approved','completed') then coalesce(amount,0) else 0 end),0)::numeric as verified_tuition,
      coalesce(sum(case when lower(coalesce(status,'')) not in ('verified','paid','approved','completed','rejected','declined') then coalesce(amount,0) else 0 end),0)::numeric as pending_collections,
      count(*) filter(where lower(coalesce(status,'')) not in ('verified','paid','approved','completed','rejected','declined'))::int as pending_payment_records
    from public.payments
    where (p_from is null or coalesce(verified_at,created_at)::date>=p_from)
      and (p_to is null or coalesce(verified_at,created_at)::date<=p_to)
  ), c as (
    select count(*)::int as cashbook_entries,
      coalesce(sum(case when lower(coalesce(entry_type,''))='income'
        and coalesce(lower(source_type),'manual') not in ('payment','student_payment')
        then coalesce(amount,0) else 0 end),0)::numeric as other_income,
      coalesce(sum(case when lower(coalesce(entry_type,''))='expense' then coalesce(amount,0) else 0 end),0)::numeric as expenses
    from public.admin_cashbook
    where coalesce(posting_status,'posted')='posted'
      and entry_date<=current_date
      and (p_from is null or entry_date>=p_from)
      and (p_to is null or entry_date<=p_to)
  )
  select jsonb_build_object(
    'period_start',p_from,'period_end',p_to,
    'verified_tuition',p.verified_tuition,
    'pending_collections',p.pending_collections,
    'pending_payment_records',p.pending_payment_records,
    'other_income',c.other_income,'expenses',c.expenses,
    'confirmed_income',p.verified_tuition+c.other_income,
    'net_result',p.verified_tuition+c.other_income-c.expenses,
    'payment_records',p.payment_records,'cashbook_entries',c.cashbook_entries,
    'generated_at',now()
  ) into result from p cross join c;
  return result;
end;
$$;

create or replace function public.get_admin_finance_snapshot()
returns jsonb
language plpgsql
security definer
set search_path='public'
as $$
declare result jsonb;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  with approved_totals as (
    select
      count(*)::int approved_enrolments,
      count(distinct student_id)::int approved_students,
      coalesce(sum(live_course_price),0)::numeric live_approved_tuition,
      coalesce(sum(enrolment_snapshot_amount),0)::numeric enrolment_snapshot_tuition,
      coalesce(sum(least(live_course_price,verified_paid)),0)::numeric verified_against_approved,
      coalesce(sum(live_outstanding),0)::numeric outstanding_tuition,
      count(*) filter(where live_outstanding>0)::int outstanding_enrolments
    from public.academy_live_enrolment_finance
    where enrolment_status='approved'
  ), payment_totals as (
    select count(*)::int payment_records,
      count(*) filter(where lower(coalesce(status,'')) not in ('verified','paid','approved','completed','rejected','declined'))::int pending_payment_records,
      coalesce(sum(case when lower(coalesce(status,'')) in ('verified','paid','approved','completed') then coalesce(amount,0) else 0 end),0)::numeric verified_payments_all,
      coalesce(sum(case when lower(coalesce(status,'')) not in ('verified','paid','approved','completed','rejected','declined') then coalesce(amount,0) else 0 end),0)::numeric pending_payment_value
    from public.payments
  ), cash_totals as (
    select count(*)::int cashbook_entries,
      coalesce(sum(case when lower(coalesce(entry_type,''))='income'
        and coalesce(lower(source_type),'manual') not in ('payment','student_payment')
        then coalesce(amount,0) else 0 end),0)::numeric other_income,
      coalesce(sum(case when lower(coalesce(entry_type,''))='expense' then coalesce(amount,0) else 0 end),0)::numeric operating_expenses
    from public.admin_cashbook
    where coalesce(posting_status,'posted')='posted'
      and entry_date<=current_date
  )
  select jsonb_build_object(
    'approved_enrolments',a.approved_enrolments,
    'approved_students',a.approved_students,
    'approved_tuition',a.live_approved_tuition,
    'approved_tuition_live',a.live_approved_tuition,
    'enrolment_snapshot_tuition',a.enrolment_snapshot_tuition,
    'verified_against_approved',a.verified_against_approved,
    'outstanding_tuition',a.outstanding_tuition,
    'outstanding_enrolments',a.outstanding_enrolments,
    'catalogue_reprice_value',a.live_approved_tuition,
    'catalogue_variance',a.live_approved_tuition-a.enrolment_snapshot_tuition,
    'pricing_source','courses.price',
    'payment_records',pt.payment_records,
    'pending_payment_records',pt.pending_payment_records,
    'verified_payments_all',pt.verified_payments_all,
    'pending_payment_value',pt.pending_payment_value,
    'cashbook_entries',ct.cashbook_entries,
    'other_income',ct.other_income,
    'operating_expenses',ct.operating_expenses,
    'confirmed_cash_income',pt.verified_payments_all+ct.other_income,
    'net_cash_result',pt.verified_payments_all+ct.other_income-ct.operating_expenses,
    'generated_at',now()
  ) into result
  from approved_totals a cross join payment_totals pt cross join cash_totals ct;
  return result;
end;
$$;
