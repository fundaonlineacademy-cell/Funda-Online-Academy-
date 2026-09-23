-- Funda Online Academy — Petty Cash Accounts, Cost Controls & VAT Tracking
-- 2026-09-23
-- Extends the governed Petty Cash control. No real fund or expense is created.

create sequence if not exists public.finance_petty_cash_account_seq start with 1;
create sequence if not exists public.finance_petty_cash_cost_control_seq start with 1;

create table if not exists public.finance_petty_cash_accounts (
  id uuid primary key default gen_random_uuid(),
  account_code text not null unique,
  account_name text not null unique,
  default_expense_category text not null,
  description text,
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

alter table public.finance_petty_cash_accounts enable row level security;

drop policy if exists finance_petty_cash_accounts_read on public.finance_petty_cash_accounts;
create policy finance_petty_cash_accounts_read
on public.finance_petty_cash_accounts for select to authenticated
using (
  public.is_admin()
  or public.has_department_access('Finance & Accounting','read')
);

revoke all on public.finance_petty_cash_accounts from PUBLIC,anon,authenticated;
grant select on public.finance_petty_cash_accounts to authenticated;
grant all on public.finance_petty_cash_accounts to service_role;

insert into public.finance_petty_cash_accounts(
  account_code,account_name,default_expense_category,description,active,sort_order
)
values
  ('PC-STA','Stationery & Printing','Printing & Stationery','Pens, paper, printing, small office stationery and similar low-value consumables.',true,10),
  ('PC-EQP','Small Equipment & Accessories','Equipment','Low-value equipment, small tools and accessories. Capital assets should not be processed as routine petty cash.',true,20),
  ('PC-REF','Staff Refreshments','Recruitment & Staff Welfare','Approved staff refreshments and small staff-welfare purchases.',true,30),
  ('PC-MKT','Marketing, Posters & Promotions','Advertising & Marketing','Posters, flyers, promotional printing and small approved marketing purchases.',true,40),
  ('PC-TRV','Local Travel & Transport','Travel & Transport','Approved local transport, parking and small travel-related costs.',true,50),
  ('PC-CUR','Courier & Postage','Courier & Postage','Courier, postage and small delivery charges.',true,60),
  ('PC-CLN','Cleaning & Consumables','Office & Administration','Cleaning materials and small general consumables.',true,70),
  ('PC-WEL','Staff Welfare & Team Needs','Recruitment & Staff Welfare','Small approved staff welfare and team-support purchases.',true,80),
  ('PC-ITA','IT Accessories, Data & Small Tech','Equipment','Small IT accessories, cables, adapters and low-value technology needs. Airtime/data may use Internet & Telephone on the voucher.',true,90),
  ('PC-RPR','Minor Repairs & Maintenance','Repairs & Maintenance','Minor repair and maintenance purchases suitable for petty cash.',true,100),
  ('PC-MTG','Meetings & Event Sundries','Office & Administration','Small meeting, event and operational sundry purchases.',true,110),
  ('PC-OTH','Other Approved Petty Cash','Other Operating Expenses','Controlled fallback for an approved petty-cash purpose not covered by another listed account.',true,999)
on conflict(account_code) do update set
  account_name=excluded.account_name,
  default_expense_category=excluded.default_expense_category,
  description=excluded.description,
  active=excluded.active,
  sort_order=excluded.sort_order;

alter table public.finance_petty_cash_funds
  add column if not exists petty_account_id uuid references public.finance_petty_cash_accounts(id) on delete restrict,
  add column if not exists cost_control_reference text unique,
  add column if not exists cost_owner_type text,
  add column if not exists cost_owner_profile_id uuid references public.profiles(id) on delete restrict,
  add column if not exists default_vat_treatment text not null default 'not_confirmed',
  add column if not exists purpose_reason text,
  add column if not exists currency_code text not null default 'ZAR';

alter table public.finance_petty_cash_funds
  drop constraint if exists finance_petty_cash_funds_cost_owner_type_check,
  add constraint finance_petty_cash_funds_cost_owner_type_check
    check (cost_owner_type is null or cost_owner_type in ('business','ceo','staff')),
  drop constraint if exists finance_petty_cash_funds_default_vat_treatment_check,
  add constraint finance_petty_cash_funds_default_vat_treatment_check
    check (default_vat_treatment in ('vat_included','no_vat','not_confirmed')),
  drop constraint if exists finance_petty_cash_funds_currency_code_check,
  add constraint finance_petty_cash_funds_currency_code_check
    check (currency_code='ZAR');

alter table public.finance_petty_cash_vouchers
  add column if not exists vat_treatment text not null default 'not_confirmed',
  add column if not exists vat_rate numeric(8,2) not null default 15.00,
  add column if not exists vat_amount numeric(14,2) not null default 0,
  add column if not exists net_amount numeric(14,2),
  add column if not exists currency_code text not null default 'ZAR';

update public.finance_petty_cash_vouchers
set net_amount=amount
where net_amount is null;

alter table public.finance_petty_cash_vouchers
  alter column net_amount set not null,
  drop constraint if exists finance_petty_cash_vouchers_vat_treatment_check,
  add constraint finance_petty_cash_vouchers_vat_treatment_check
    check (vat_treatment in ('vat_included','no_vat','not_confirmed')),
  drop constraint if exists finance_petty_cash_vouchers_vat_rate_check,
  add constraint finance_petty_cash_vouchers_vat_rate_check
    check (vat_rate >= 0 and vat_rate <= 100),
  drop constraint if exists finance_petty_cash_vouchers_vat_amount_check,
  add constraint finance_petty_cash_vouchers_vat_amount_check
    check (vat_amount >= 0 and vat_amount <= amount),
  drop constraint if exists finance_petty_cash_vouchers_currency_code_check,
  add constraint finance_petty_cash_vouchers_currency_code_check
    check (currency_code='ZAR');

create or replace function public.finance_create_petty_cash_account(
  p_account_name text,
  p_default_expense_category text,
  p_description text default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_id uuid;
  v_code text;
begin
  if not (
    public.is_admin()
    or public.has_department_approval('Finance & Accounting')
  ) then
    raise exception 'Finance approval authority required' using errcode='42501';
  end if;

  if char_length(btrim(coalesce(p_account_name,'')))<3 then
    raise exception 'Enter a clear petty cash account name' using errcode='22023';
  end if;

  if not exists(
    select 1 from public.accounting_categories
    where category_type='expense'
      and active=true
      and lower(name)=lower(btrim(p_default_expense_category))
      and lower(name)<>'depreciation & amortisation'
  ) then
    raise exception 'Choose an active cash expense category' using errcode='22023';
  end if;

  v_code:='PC-CUS-'||lpad(nextval('public.finance_petty_cash_account_seq'::regclass)::text,3,'0');

  insert into public.finance_petty_cash_accounts(
    account_code,account_name,default_expense_category,description,active,sort_order
  )
  values(
    v_code,btrim(p_account_name),btrim(p_default_expense_category),
    nullif(btrim(coalesce(p_description,'')),''),true,500
  )
  returning id into v_id;

  return jsonb_build_object('id',v_id,'account_code',v_code);
end;
$$;

create or replace function public.finance_create_petty_cash_fund_v2(
  p_petty_account_id uuid,
  p_cost_owner_type text,
  p_cost_owner_profile_id uuid default null,
  p_fund_name text default null,
  p_custodian_profile_id uuid default null,
  p_custodian_name text default null,
  p_authorized_float numeric default 0,
  p_default_vat_treatment text default 'not_confirmed',
  p_purpose_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_account public.finance_petty_cash_accounts%rowtype;
  v_owner_profile uuid;
  v_owner_name text;
  v_owner_token text;
  v_staff_number text;
  v_ref text;
  v_id uuid;
  v_name text;
begin
  if not (
    public.is_admin()
    or public.has_department_approval('Finance & Accounting')
  ) then
    raise exception 'Finance approval authority required' using errcode='42501';
  end if;

  select * into v_account
  from public.finance_petty_cash_accounts
  where id=p_petty_account_id and active=true;
  if not found then raise exception 'Choose an active petty cash account' using errcode='22023'; end if;

  if p_cost_owner_type not in ('business','ceo','staff') then
    raise exception 'Choose whether this cost belongs to the Business, CEO or a Staff member' using errcode='22023';
  end if;

  if p_default_vat_treatment not in ('vat_included','no_vat','not_confirmed') then
    raise exception 'Choose a valid VAT treatment' using errcode='22023';
  end if;

  if coalesce(p_authorized_float,0)<0 then
    raise exception 'Authorised amount cannot be negative' using errcode='22023';
  end if;

  if char_length(btrim(coalesce(p_purpose_reason,'')))<5 then
    raise exception 'Enter a clear business reason / purpose for this petty cash fund' using errcode='22023';
  end if;

  if p_cost_owner_type='business' then
    v_owner_profile:=null;
    v_owner_name:='Funda Online Academy';
    v_owner_token:='BUS';
  elsif p_cost_owner_type='ceo' then
    select c.user_id,p.full_name
    into v_owner_profile,v_owner_name
    from public.ceo_authority_assignments c
    join public.profiles p on p.id=c.user_id
    where c.active=true
    limit 1;
    if v_owner_profile is null then
      raise exception 'Active CEO profile could not be resolved' using errcode='P0002';
    end if;
    v_owner_token:='CEO';
  else
    select p.id,p.full_name,p.staff_number
    into v_owner_profile,v_owner_name,v_staff_number
    from public.profiles p
    where p.id=p_cost_owner_profile_id
      and lower(p.role)='staff';
    if v_owner_profile is null then
      raise exception 'Choose an active Staff profile for this cost control' using errcode='22023';
    end if;
    v_owner_token:=coalesce(nullif(regexp_replace(v_staff_number,'[^A-Za-z0-9]','','g'),''),'STAFF');
  end if;

  v_ref:='CC-'||v_account.account_code||'-'||v_owner_token||'-'
    ||lpad(nextval('public.finance_petty_cash_cost_control_seq'::regclass)::text,4,'0');

  v_name:=nullif(btrim(coalesce(p_fund_name,'')),'');
  if v_name is null then
    v_name:=v_account.account_name||' — '||coalesce(v_owner_name,'Business');
  end if;

  insert into public.finance_petty_cash_funds(
    fund_name,petty_account_id,cost_control_reference,cost_owner_type,cost_owner_profile_id,
    custodian_profile_id,custodian_name,authorized_float,default_vat_treatment,purpose_reason,
    currency_code,status,created_by,updated_by
  )
  values(
    v_name,v_account.id,v_ref,p_cost_owner_type,v_owner_profile,
    p_custodian_profile_id,nullif(btrim(coalesce(p_custodian_name,'')),''),
    coalesce(p_authorized_float,0),p_default_vat_treatment,btrim(p_purpose_reason),
    'ZAR','active',auth.uid(),auth.uid()
  )
  returning id into v_id;

  return jsonb_build_object(
    'id',v_id,
    'cost_control_reference',v_ref,
    'fund_name',v_name,
    'account_code',v_account.account_code,
    'account_name',v_account.account_name
  );
end;
$$;

create or replace function public.finance_update_petty_cash_fund_v2(
  p_fund_id uuid,
  p_fund_name text,
  p_custodian_profile_id uuid default null,
  p_custodian_name text default null,
  p_authorized_float numeric default 0,
  p_default_vat_treatment text default 'not_confirmed',
  p_purpose_reason text default null,
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
    raise exception 'Enter the fund label' using errcode='22023';
  end if;
  if coalesce(p_authorized_float,0)<0 then
    raise exception 'Authorised amount cannot be negative' using errcode='22023';
  end if;
  if p_default_vat_treatment not in ('vat_included','no_vat','not_confirmed') then
    raise exception 'Choose a valid VAT treatment' using errcode='22023';
  end if;
  if char_length(btrim(coalesce(p_purpose_reason,'')))<5 then
    raise exception 'Enter a clear business reason / purpose' using errcode='22023';
  end if;

  v_balance:=public.finance_petty_cash_balance_raw(p_fund_id,current_date);
  if p_status='closed' and abs(v_balance)>0.005 then
    raise exception 'Petty cash fund must have a zero balance before it can be closed' using errcode='22023';
  end if;
  if coalesce(p_authorized_float,0)>0 and v_balance>p_authorized_float+0.005 then
    raise exception 'Authorised amount cannot be lower than the current petty cash balance' using errcode='22023';
  end if;

  update public.finance_petty_cash_funds
  set fund_name=btrim(p_fund_name),
      custodian_profile_id=p_custodian_profile_id,
      custodian_name=nullif(btrim(coalesce(p_custodian_name,'')),''),
      authorized_float=coalesce(p_authorized_float,0),
      default_vat_treatment=p_default_vat_treatment,
      purpose_reason=btrim(p_purpose_reason),
      status=p_status,
      updated_by=auth.uid(),
      updated_at=now()
  where id=p_fund_id;
  if not found then raise exception 'Petty cash fund not found' using errcode='P0002'; end if;
end;
$$;

create or replace function public.finance_create_petty_cash_voucher_v2(
  p_fund_id uuid,
  p_expense_date date,
  p_category text,
  p_payee text,
  p_department text,
  p_description text,
  p_amount numeric,
  p_vat_treatment text default 'not_confirmed',
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
  v_rate numeric(8,2):=15.00;
  v_vat numeric(14,2):=0;
  v_net numeric(14,2);
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
  if v_fund.petty_account_id is null or v_fund.cost_control_reference is null then
    raise exception 'This fund does not yet have the required petty cash account and cost control reference' using errcode='22023';
  end if;

  if p_expense_date is null or p_expense_date>current_date then
    raise exception 'Petty cash expense date cannot be in the future' using errcode='22023';
  end if;
  if coalesce(p_amount,0)<=0 then
    raise exception 'Petty cash amount in Rands must be greater than zero' using errcode='22023';
  end if;
  if char_length(btrim(coalesce(p_description,'')))<3 then
    raise exception 'Enter a clear petty cash reason / description' using errcode='22023';
  end if;
  if p_vat_treatment not in ('vat_included','no_vat','not_confirmed') then
    raise exception 'Choose a valid VAT treatment' using errcode='22023';
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

  if p_vat_treatment='vat_included' then
    v_vat:=round(p_amount*v_rate/(100+v_rate),2);
  else
    v_vat:=0;
  end if;
  v_net:=p_amount-v_vat;

  v_no:='PCV-'||to_char(p_expense_date,'YYYY')||'-'||lpad(nextval('public.finance_petty_cash_voucher_seq'::regclass)::text,6,'0');

  insert into public.finance_petty_cash_vouchers(
    fund_id,voucher_number,expense_date,category,payee,department,description,amount,
    receipt_url,evidence_note,status,requested_by,vat_treatment,vat_rate,vat_amount,net_amount,currency_code
  )
  values(
    p_fund_id,v_no,p_expense_date,btrim(p_category),
    nullif(btrim(coalesce(p_payee,'')),''),
    nullif(btrim(coalesce(p_department,'')),''),
    btrim(p_description),p_amount,
    nullif(btrim(coalesce(p_receipt_url,'')),''),
    nullif(btrim(coalesce(p_evidence_note,'')),''),
    'pending',auth.uid(),p_vat_treatment,v_rate,v_vat,v_net,'ZAR'
  )
  returning id into v_id;

  return jsonb_build_object(
    'id',v_id,
    'voucher_number',v_no,
    'gross_amount',p_amount,
    'vat_amount',v_vat,
    'net_amount',v_net,
    'vat_treatment',p_vat_treatment
  );
end;
$$;

revoke all on function public.finance_create_petty_cash_account(text,text,text) from PUBLIC,anon;
revoke all on function public.finance_create_petty_cash_fund_v2(uuid,text,uuid,text,uuid,text,numeric,text,text) from PUBLIC,anon;
revoke all on function public.finance_update_petty_cash_fund_v2(uuid,text,uuid,text,numeric,text,text,text) from PUBLIC,anon;
revoke all on function public.finance_create_petty_cash_voucher_v2(uuid,date,text,text,text,text,numeric,text,text,text) from PUBLIC,anon;

grant execute on function public.finance_create_petty_cash_account(text,text,text) to authenticated,service_role;
grant execute on function public.finance_create_petty_cash_fund_v2(uuid,text,uuid,text,uuid,text,numeric,text,text) to authenticated,service_role;
grant execute on function public.finance_update_petty_cash_fund_v2(uuid,text,uuid,text,numeric,text,text,text) to authenticated,service_role;
grant execute on function public.finance_create_petty_cash_voucher_v2(uuid,date,text,text,text,text,numeric,text,text,text) to authenticated,service_role;
