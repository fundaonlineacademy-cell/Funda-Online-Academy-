-- Funda Online Academy — Petty Cash Control
-- 2026-09-23
-- Controlled imprest-style petty cash. Funding/replenishment is not P&L income/expense.
-- Only approved petty-cash vouchers create actual cashbook expenses.

alter table public.admin_cashbook
  drop constraint if exists admin_cashbook_source_type_check;

alter table public.admin_cashbook
  add constraint admin_cashbook_source_type_check
  check (source_type = any (array[
    'manual'::text,'student_payment'::text,'adjustment'::text,
    'opening_balance'::text,'other'::text,'petty_cash'::text
  ]));

create table if not exists public.finance_petty_cash_funds (
  id uuid primary key default gen_random_uuid(),
  fund_name text not null unique check (length(btrim(fund_name)) >= 2),
  custodian_profile_id uuid references public.profiles(id) on delete set null,
  custodian_name text,
  authorized_float numeric(14,2) not null default 0 check (authorized_float >= 0),
  status text not null default 'active' check (status in ('active','closed')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_petty_cash_movements (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references public.finance_petty_cash_funds(id) on delete restrict,
  movement_type text not null check (movement_type in ('opening_float','replenishment','return_to_bank')),
  amount numeric(14,2) not null check (amount > 0),
  movement_date date not null default current_date,
  reference_number text,
  notes text,
  status text not null default 'posted' check (status in ('posted','voided')),
  void_reason text,
  voided_by uuid references auth.users(id) on delete set null,
  voided_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check ((status='voided') = (voided_at is not null))
);

create sequence if not exists public.finance_petty_cash_voucher_seq start with 1;

create table if not exists public.finance_petty_cash_vouchers (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references public.finance_petty_cash_funds(id) on delete restrict,
  voucher_number text not null unique,
  expense_date date not null default current_date,
  category text not null,
  payee text,
  department text,
  description text not null check (length(btrim(description)) >= 3),
  amount numeric(14,2) not null check (amount > 0),
  receipt_url text,
  evidence_note text,
  status text not null default 'pending'
    check (status in ('pending','posted','rejected','voided')),
  requested_by uuid references auth.users(id) on delete set null,
  requested_at timestamptz not null default now(),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  review_note text,
  cashbook_entry_id uuid references public.admin_cashbook(id) on delete restrict,
  void_reason text,
  voided_by uuid references auth.users(id) on delete set null,
  voided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    coalesce(nullif(btrim(receipt_url),''),nullif(btrim(evidence_note),'')) is not null
  )
);

create table if not exists public.finance_petty_cash_reconciliations (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references public.finance_petty_cash_funds(id) on delete restrict,
  reconciliation_date date not null default current_date,
  system_balance numeric(14,2) not null,
  counted_cash numeric(14,2) not null check (counted_cash >= 0),
  variance numeric(14,2) not null,
  notes text,
  reconciled_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.finance_petty_cash_funds enable row level security;
alter table public.finance_petty_cash_movements enable row level security;
alter table public.finance_petty_cash_vouchers enable row level security;
alter table public.finance_petty_cash_reconciliations enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'finance_petty_cash_funds','finance_petty_cash_movements',
    'finance_petty_cash_vouchers','finance_petty_cash_reconciliations'
  ] loop
    execute format('drop policy if exists %I on public.%I','pc_read_'||t,t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_admin() or public.has_department_access(''Finance & Accounting'',''read''))',
      'pc_read_'||t,t
    );
    execute format('revoke all on public.%I from PUBLIC,anon,authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
end $$;

revoke all on sequence public.finance_petty_cash_voucher_seq from PUBLIC,anon,authenticated;
grant all on sequence public.finance_petty_cash_voucher_seq to service_role;

create or replace function public.finance_petty_cash_balance_raw(
  p_fund_id uuid,
  p_as_of date default current_date
)
returns numeric
language sql
stable
security definer
set search_path=''
as $$
  select
    coalesce((
      select sum(
        case
          when m.movement_type in ('opening_float','replenishment') then m.amount
          when m.movement_type='return_to_bank' then -m.amount
          else 0
        end
      )
      from public.finance_petty_cash_movements m
      where m.fund_id=p_fund_id
        and m.status='posted'
        and m.movement_date<=coalesce(p_as_of,current_date)
    ),0)
    -
    coalesce((
      select sum(v.amount)
      from public.finance_petty_cash_vouchers v
      where v.fund_id=p_fund_id
        and v.status='posted'
        and v.expense_date<=coalesce(p_as_of,current_date)
    ),0)
$$;

revoke all on function public.finance_petty_cash_balance_raw(uuid,date) from PUBLIC,anon,authenticated;
grant execute on function public.finance_petty_cash_balance_raw(uuid,date) to service_role;

create or replace function public.finance_create_petty_cash_fund(
  p_fund_name text,
  p_custodian_profile_id uuid default null,
  p_custodian_name text default null,
  p_authorized_float numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare v_id uuid;
begin
  if not (
    public.is_admin()
    or public.has_department_approval('Finance & Accounting')
  ) then
    raise exception 'Finance approval authority required' using errcode='42501';
  end if;
  if char_length(btrim(coalesce(p_fund_name,'')))<2 then
    raise exception 'Enter a petty cash fund name' using errcode='22023';
  end if;
  if coalesce(p_authorized_float,0)<0 then
    raise exception 'Authorized float cannot be negative' using errcode='22023';
  end if;

  insert into public.finance_petty_cash_funds(
    fund_name,custodian_profile_id,custodian_name,authorized_float,created_by,updated_by
  )
  values(
    btrim(p_fund_name),p_custodian_profile_id,nullif(btrim(coalesce(p_custodian_name,'')),''),
    coalesce(p_authorized_float,0),auth.uid(),auth.uid()
  )
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.finance_update_petty_cash_fund(
  p_fund_id uuid,
  p_fund_name text,
  p_custodian_profile_id uuid default null,
  p_custodian_name text default null,
  p_authorized_float numeric default 0,
  p_status text default 'active'
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_balance numeric;
begin
  if not (
    public.is_admin()
    or public.has_department_approval('Finance & Accounting')
  ) then
    raise exception 'Finance approval authority required' using errcode='42501';
  end if;
  if p_status not in ('active','closed') then
    raise exception 'Invalid petty cash fund status' using errcode='22023';
  end if;
  if char_length(btrim(coalesce(p_fund_name,'')))<2 then
    raise exception 'Enter a petty cash fund name' using errcode='22023';
  end if;
  if coalesce(p_authorized_float,0)<0 then
    raise exception 'Authorized float cannot be negative' using errcode='22023';
  end if;

  v_balance:=public.finance_petty_cash_balance_raw(p_fund_id,current_date);
  if p_status='closed' and abs(v_balance)>0.005 then
    raise exception 'Petty cash fund must have a zero balance before it can be closed' using errcode='22023';
  end if;
  if coalesce(p_authorized_float,0)>0 and v_balance>p_authorized_float then
    raise exception 'Authorized float cannot be lower than the current petty cash balance' using errcode='22023';
  end if;

  update public.finance_petty_cash_funds
  set fund_name=btrim(p_fund_name),
      custodian_profile_id=p_custodian_profile_id,
      custodian_name=nullif(btrim(coalesce(p_custodian_name,'')),''),
      authorized_float=coalesce(p_authorized_float,0),
      status=p_status,
      updated_by=auth.uid(),
      updated_at=now()
  where id=p_fund_id;
  if not found then raise exception 'Petty cash fund not found' using errcode='P0002'; end if;
end;
$$;

create or replace function public.finance_record_petty_cash_movement(
  p_fund_id uuid,
  p_movement_type text,
  p_amount numeric,
  p_movement_date date default current_date,
  p_reference_number text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_fund public.finance_petty_cash_funds%rowtype;
  v_balance numeric;
  v_id uuid;
begin
  if not (
    public.is_admin()
    or public.has_department_approval('Finance & Accounting')
  ) then
    raise exception 'Finance approval authority required' using errcode='42501';
  end if;
  if p_movement_type not in ('opening_float','replenishment','return_to_bank') then
    raise exception 'Invalid petty cash movement type' using errcode='22023';
  end if;
  if coalesce(p_amount,0)<=0 then
    raise exception 'Petty cash movement amount must be greater than zero' using errcode='22023';
  end if;
  if p_movement_date is null or p_movement_date>current_date then
    raise exception 'Petty cash movement date cannot be in the future' using errcode='22023';
  end if;

  select * into v_fund
  from public.finance_petty_cash_funds
  where id=p_fund_id
  for update;
  if not found then raise exception 'Petty cash fund not found' using errcode='P0002'; end if;
  if v_fund.status<>'active' then
    raise exception 'Petty cash fund is closed' using errcode='22023';
  end if;

  v_balance:=public.finance_petty_cash_balance_raw(p_fund_id,p_movement_date);

  if p_movement_type='opening_float' then
    if exists(
      select 1 from public.finance_petty_cash_movements
      where fund_id=p_fund_id and movement_type='opening_float' and status='posted'
    ) then
      raise exception 'Opening float has already been recorded for this fund' using errcode='23505';
    end if;
    if v_fund.authorized_float<=0 then
      raise exception 'Set an authorized float before recording the opening float' using errcode='22023';
    end if;
    if p_amount>v_fund.authorized_float then
      raise exception 'Opening float cannot exceed the authorized float' using errcode='22023';
    end if;
  elsif p_movement_type='replenishment' then
    if not exists(
      select 1 from public.finance_petty_cash_movements
      where fund_id=p_fund_id and movement_type='opening_float' and status='posted'
    ) then
      raise exception 'Record the opening float before replenishing petty cash' using errcode='22023';
    end if;
    if v_fund.authorized_float<=0 or v_balance+p_amount>v_fund.authorized_float+0.005 then
      raise exception 'Replenishment would exceed the authorized petty cash float' using errcode='22023';
    end if;
  elsif p_movement_type='return_to_bank' then
    if p_amount>v_balance+0.005 then
      raise exception 'Return-to-bank amount cannot exceed the available petty cash balance' using errcode='22023';
    end if;
  end if;

  insert into public.finance_petty_cash_movements(
    fund_id,movement_type,amount,movement_date,reference_number,notes,created_by
  )
  values(
    p_fund_id,p_movement_type,p_amount,p_movement_date,
    nullif(btrim(coalesce(p_reference_number,'')),''),
    nullif(btrim(coalesce(p_notes,'')),''),
    auth.uid()
  )
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.finance_create_petty_cash_voucher(
  p_fund_id uuid,
  p_expense_date date,
  p_category text,
  p_payee text,
  p_department text,
  p_description text,
  p_amount numeric,
  p_receipt_url text default null,
  p_evidence_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_fund public.finance_petty_cash_funds%rowtype;
  v_id uuid;
  v_no text;
begin
  if not (
    public.is_admin()
    or public.has_department_access('Finance & Accounting','edit')
  ) then
    raise exception 'Finance edit access required' using errcode='42501';
  end if;
  select * into v_fund from public.finance_petty_cash_funds where id=p_fund_id;
  if not found then raise exception 'Petty cash fund not found' using errcode='P0002'; end if;
  if v_fund.status<>'active' then raise exception 'Petty cash fund is closed' using errcode='22023'; end if;

  if p_expense_date is null or p_expense_date>current_date then
    raise exception 'Petty cash expense date cannot be in the future' using errcode='22023';
  end if;
  if coalesce(p_amount,0)<=0 then
    raise exception 'Petty cash voucher amount must be greater than zero' using errcode='22023';
  end if;
  if char_length(btrim(coalesce(p_description,'')))<3 then
    raise exception 'Enter a clear petty cash description' using errcode='22023';
  end if;
  if coalesce(nullif(btrim(coalesce(p_receipt_url,'')),''),nullif(btrim(coalesce(p_evidence_note,'')),'')) is null then
    raise exception 'Provide a receipt/evidence URL or explain why evidence is unavailable' using errcode='22023';
  end if;
  if not exists(
    select 1 from public.accounting_categories
    where category_type='expense'
      and active=true
      and lower(name)=lower(btrim(p_category))
  ) then
    raise exception 'Choose an active accounting expense category' using errcode='22023';
  end if;
  if lower(btrim(p_category))='depreciation & amortisation' then
    raise exception 'Depreciation is non-cash and cannot be paid from petty cash' using errcode='22023';
  end if;

  v_no:='PCV-'||to_char(p_expense_date,'YYYY')||'-'||lpad(nextval('public.finance_petty_cash_voucher_seq'::regclass)::text,6,'0');

  insert into public.finance_petty_cash_vouchers(
    fund_id,voucher_number,expense_date,category,payee,department,description,amount,
    receipt_url,evidence_note,status,requested_by
  )
  values(
    p_fund_id,v_no,p_expense_date,btrim(p_category),
    nullif(btrim(coalesce(p_payee,'')),''),
    nullif(btrim(coalesce(p_department,'')),''),
    btrim(p_description),p_amount,
    nullif(btrim(coalesce(p_receipt_url,'')),''),
    nullif(btrim(coalesce(p_evidence_note,'')),''),
    'pending',auth.uid()
  )
  returning id into v_id;

  return jsonb_build_object('id',v_id,'voucher_number',v_no);
end;
$$;

create or replace function public.finance_approve_petty_cash_voucher(
  p_voucher_id uuid,
  p_review_note text default null
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_v public.finance_petty_cash_vouchers%rowtype;
  v_f public.finance_petty_cash_funds%rowtype;
  v_balance numeric;
  v_cashbook_id uuid;
begin
  if not (
    public.is_admin()
    or public.has_department_approval('Finance & Accounting')
  ) then
    raise exception 'Finance approval authority required' using errcode='42501';
  end if;

  select * into v_v
  from public.finance_petty_cash_vouchers
  where id=p_voucher_id
  for update;
  if not found then raise exception 'Petty cash voucher not found' using errcode='P0002'; end if;
  if v_v.status<>'pending' then
    raise exception 'Only pending petty cash vouchers can be approved' using errcode='22023';
  end if;

  select * into v_f
  from public.finance_petty_cash_funds
  where id=v_v.fund_id
  for update;
  if not found or v_f.status<>'active' then
    raise exception 'Active petty cash fund not found' using errcode='22023';
  end if;

  v_balance:=public.finance_petty_cash_balance_raw(v_v.fund_id,v_v.expense_date);
  if v_v.amount>v_balance+0.005 then
    raise exception 'Insufficient petty cash balance for this voucher' using errcode='22023';
  end if;

  insert into public.admin_cashbook(
    entry_type,category,description,amount,entry_date,receipt_url,created_by,
    counterparty,reference_number,payment_method,department,tax_treatment,
    reconciliation_status,source_type,source_id,posting_status,recurrence
  )
  values(
    'expense',v_v.category,v_v.description,v_v.amount,v_v.expense_date,v_v.receipt_url,auth.uid(),
    v_v.payee,v_v.voucher_number,'Petty Cash',coalesce(v_v.department,'Finance & Accounting'),null,
    'excluded','petty_cash',v_v.id::text,'posted','none'
  )
  returning id into v_cashbook_id;

  update public.finance_petty_cash_vouchers
  set status='posted',
      approved_by=auth.uid(),
      approved_at=now(),
      review_note=nullif(btrim(coalesce(p_review_note,'')),''),
      cashbook_entry_id=v_cashbook_id,
      updated_at=now()
  where id=p_voucher_id;

  return v_cashbook_id;
end;
$$;

create or replace function public.finance_reject_petty_cash_voucher(
  p_voucher_id uuid,
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
    raise exception 'Finance approval authority required' using errcode='42501';
  end if;
  if char_length(btrim(coalesce(p_reason,'')))<5 then
    raise exception 'Enter a clear rejection reason' using errcode='22023';
  end if;

  update public.finance_petty_cash_vouchers
  set status='rejected',
      approved_by=auth.uid(),
      approved_at=now(),
      review_note=btrim(p_reason),
      updated_at=now()
  where id=p_voucher_id and status='pending';
  if not found then raise exception 'Pending petty cash voucher not found' using errcode='P0002'; end if;
end;
$$;

create or replace function public.finance_void_petty_cash_voucher(
  p_voucher_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare v_v public.finance_petty_cash_vouchers%rowtype;
begin
  if not (
    public.is_admin()
    or public.has_department_approval('Finance & Accounting')
  ) then
    raise exception 'Finance approval authority required' using errcode='42501';
  end if;
  if char_length(btrim(coalesce(p_reason,'')))<8 then
    raise exception 'Enter a clear void reason of at least 8 characters' using errcode='22023';
  end if;

  select * into v_v
  from public.finance_petty_cash_vouchers
  where id=p_voucher_id
  for update;
  if not found then raise exception 'Petty cash voucher not found' using errcode='P0002'; end if;
  if v_v.status<>'posted' then raise exception 'Only posted petty cash vouchers can be voided' using errcode='22023'; end if;
  if v_v.cashbook_entry_id is null then raise exception 'Linked cashbook entry is missing' using errcode='P0002'; end if;

  perform set_config('funda.finance_cashbook_rpc','on',true);
  update public.admin_cashbook
  set posting_status='voided',
      void_reason=btrim(p_reason),
      voided_by=auth.uid(),
      voided_at=now(),
      updated_at=now()
  where id=v_v.cashbook_entry_id and source_type='petty_cash' and posting_status='posted';
  if not found then raise exception 'Active linked petty cashbook entry not found' using errcode='P0002'; end if;

  update public.finance_petty_cash_vouchers
  set status='voided',
      void_reason=btrim(p_reason),
      voided_by=auth.uid(),
      voided_at=now(),
      updated_at=now()
  where id=p_voucher_id;
end;
$$;

create or replace function public.finance_reconcile_petty_cash(
  p_fund_id uuid,
  p_reconciliation_date date,
  p_counted_cash numeric,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_balance numeric;
  v_variance numeric;
  v_id uuid;
begin
  if not (
    public.is_admin()
    or public.has_department_approval('Finance & Accounting')
  ) then
    raise exception 'Finance approval authority required' using errcode='42501';
  end if;
  if p_reconciliation_date is null or p_reconciliation_date>current_date then
    raise exception 'Reconciliation date cannot be in the future' using errcode='22023';
  end if;
  if coalesce(p_counted_cash,-1)<0 then
    raise exception 'Counted cash cannot be negative' using errcode='22023';
  end if;
  if not exists(select 1 from public.finance_petty_cash_funds where id=p_fund_id) then
    raise exception 'Petty cash fund not found' using errcode='P0002';
  end if;

  v_balance:=public.finance_petty_cash_balance_raw(p_fund_id,p_reconciliation_date);
  v_variance:=p_counted_cash-v_balance;
  if abs(v_variance)>0.005 and char_length(btrim(coalesce(p_notes,'')))<5 then
    raise exception 'Explain the reconciliation variance in the notes' using errcode='22023';
  end if;

  insert into public.finance_petty_cash_reconciliations(
    fund_id,reconciliation_date,system_balance,counted_cash,variance,notes,reconciled_by
  )
  values(
    p_fund_id,p_reconciliation_date,v_balance,p_counted_cash,v_variance,
    nullif(btrim(coalesce(p_notes,'')),''),auth.uid()
  )
  returning id into v_id;

  return jsonb_build_object(
    'id',v_id,
    'system_balance',v_balance,
    'counted_cash',p_counted_cash,
    'variance',v_variance
  );
end;
$$;

revoke all on function public.finance_create_petty_cash_fund(text,uuid,text,numeric) from PUBLIC,anon;
revoke all on function public.finance_update_petty_cash_fund(uuid,text,uuid,text,numeric,text) from PUBLIC,anon;
revoke all on function public.finance_record_petty_cash_movement(uuid,text,numeric,date,text,text) from PUBLIC,anon;
revoke all on function public.finance_create_petty_cash_voucher(uuid,date,text,text,text,text,numeric,text,text) from PUBLIC,anon;
revoke all on function public.finance_approve_petty_cash_voucher(uuid,text) from PUBLIC,anon;
revoke all on function public.finance_reject_petty_cash_voucher(uuid,text) from PUBLIC,anon;
revoke all on function public.finance_void_petty_cash_voucher(uuid,text) from PUBLIC,anon;
revoke all on function public.finance_reconcile_petty_cash(uuid,date,numeric,text) from PUBLIC,anon;

grant execute on function public.finance_create_petty_cash_fund(text,uuid,text,numeric) to authenticated,service_role;
grant execute on function public.finance_update_petty_cash_fund(uuid,text,uuid,text,numeric,text) to authenticated,service_role;
grant execute on function public.finance_record_petty_cash_movement(uuid,text,numeric,date,text,text) to authenticated,service_role;
grant execute on function public.finance_create_petty_cash_voucher(uuid,date,text,text,text,text,numeric,text,text) to authenticated,service_role;
grant execute on function public.finance_approve_petty_cash_voucher(uuid,text) to authenticated,service_role;
grant execute on function public.finance_reject_petty_cash_voucher(uuid,text) to authenticated,service_role;
grant execute on function public.finance_void_petty_cash_voucher(uuid,text) to authenticated,service_role;
grant execute on function public.finance_reconcile_petty_cash(uuid,date,numeric,text) to authenticated,service_role;
