-- Funda Online Academy
-- Ambassador Programme end-to-end audit corrections
-- Production migration applied 2026-09-16.
-- This file documents the database controls that accompany the frontend fixes.

create or replace function public.get_own_ambassador_login_status()
returns table(
  application_id uuid,
  full_name text,
  status text,
  agreement_status text,
  account_status text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then return; end if;
  perform public.bind_own_ambassador_account();
  return query
  select a.id,a.full_name,a.status,a.agreement_status,a.account_status
    from public.ambassador_programme_applications a
   where a.auth_user_id=auth.uid()
   limit 1;
end;
$$;
revoke all on function public.get_own_ambassador_login_status() from public;
grant execute on function public.get_own_ambassador_login_status() to authenticated;

create or replace function public.admin_award_ambassador_monthly_performance(
  p_application_id uuid,
  p_month date,
  p_amount numeric,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_month date := date_trunc('month',coalesce(p_month,current_date))::date;
  v_amount numeric(12,2) := round(coalesce(p_amount,0)::numeric,2);
  v_lifetime numeric(12,2) := 0;
  v_monthly_revenue numeric(12,2) := 0;
  v_cap numeric(12,2) := 0;
  v_rank text := 'Ambassador';
  v_existing uuid;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if not exists(
    select 1 from public.ambassador_programme_applications a
     where a.id=p_application_id and a.status='approved'
       and a.account_status in ('introductory','active')
  ) then
    raise exception 'Monthly performance can only be recorded for an approved active Ambassador account.';
  end if;

  select coalesce(sum(l.qualifying_revenue),0) into v_lifetime
    from public.ambassador_earnings_ledger l
   where l.application_id=p_application_id
     and l.earning_type='commission'
     and l.earning_status in ('approved','paid')
     and l.payment_id is not null
     and public.ambassador_v2_payment_is_eligible(l.payment_id);

  select coalesce(sum(l.qualifying_revenue),0) into v_monthly_revenue
    from public.ambassador_earnings_ledger l
   where l.application_id=p_application_id
     and l.earning_type='commission'
     and l.earning_status in ('approved','paid')
     and l.earning_month=v_month
     and l.payment_id is not null
     and public.ambassador_v2_payment_is_eligible(l.payment_id);

  if v_lifetime>=1000000 then v_rank:='Elite'; v_cap:=25000;
  elsif v_lifetime>=500000 then v_rank:='Executive'; v_cap:=18000;
  elsif v_lifetime>=250000 then v_rank:='Diamond'; v_cap:=12000;
  elsif v_lifetime>=100000 then v_rank:='Platinum'; v_cap:=8000;
  elsif v_lifetime>=50000 then v_rank:='Gold'; v_cap:=5000;
  elsif v_lifetime>=25000 then v_rank:='Silver';
  elsif v_lifetime>=10000 then v_rank:='Bronze';
  end if;

  if v_cap<=0 then raise exception 'Monthly performance payments begin at Gold / Level 4.'; end if;
  if v_monthly_revenue<=0 then raise exception 'No verified direct qualifying revenue exists for this Ambassador in the selected month.'; end if;
  if v_amount<=0 then raise exception 'Enter a monthly performance amount greater than zero.'; end if;
  if v_amount>v_cap then raise exception 'The approved monthly performance amount exceeds the % rank cap of R%.',v_rank,v_cap; end if;

  select l.id into v_existing
    from public.ambassador_earnings_ledger l
   where l.application_id=p_application_id
     and l.earning_type='monthly_performance'
     and l.earning_month=v_month
     and l.earning_status<>'reversed'
   limit 1 for update;

  if v_existing is null then
    insert into public.ambassador_earnings_ledger(
      application_id,qualifying_revenue,commission_rate,commission_amount,
      earning_type,earning_status,earning_month,notes
    ) values(
      p_application_id,v_monthly_revenue,0,v_amount,'monthly_performance','approved',v_month,
      coalesce(nullif(trim(p_notes),''),'Monthly performance payment verified and approved by Funda Online Academy for '||to_char(v_month,'YYYY-MM')||'.')
    );
  else
    update public.ambassador_earnings_ledger
       set qualifying_revenue=v_monthly_revenue,
           commission_rate=0,
           commission_amount=v_amount,
           earning_status='approved',
           notes=coalesce(nullif(trim(p_notes),''),'Monthly performance payment verified and approved by Funda Online Academy for '||to_char(v_month,'YYYY-MM')||'.'),
           updated_at=now()
     where id=v_existing;
  end if;

  return jsonb_build_object(
    'ok',true,'rank',v_rank,'month',v_month,
    'monthly_qualifying_revenue',v_monthly_revenue,
    'monthly_payment_cap',v_cap,'monthly_payment',v_amount
  );
end;
$$;
revoke all on function public.admin_award_ambassador_monthly_performance(uuid,date,numeric,text) from public;
grant execute on function public.admin_award_ambassador_monthly_performance(uuid,date,numeric,text) to authenticated;

create or replace function public.refresh_ambassador_v2_rewards(
  p_application_id uuid,
  p_month date default date_trunc('month',current_date)::date
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  life numeric:=0;
  mon numeric:=0;
  rank_name text:='Ambassador';
  bonus_value numeric:=0;
  previous_bonus numeric:=0;
  monthly_cap numeric:=0;
  monthly_paid numeric:=0;
  bonus_delta numeric:=0;
  month_start date:=date_trunc('month',p_month)::date;
begin
  select coalesce(sum(l.qualifying_revenue),0) into life
    from public.ambassador_earnings_ledger l
   where l.application_id=p_application_id
     and l.earning_type='commission'
     and l.earning_status in ('approved','paid')
     and l.payment_id is not null
     and public.ambassador_v2_payment_is_eligible(l.payment_id);

  select coalesce(sum(l.qualifying_revenue),0) into mon
    from public.ambassador_earnings_ledger l
   where l.application_id=p_application_id
     and l.earning_type='commission'
     and l.earning_status in ('approved','paid')
     and l.earning_month=month_start
     and l.payment_id is not null
     and public.ambassador_v2_payment_is_eligible(l.payment_id);

  if life>=1000000 then rank_name:='Elite'; bonus_value:=45000; monthly_cap:=25000;
  elsif life>=500000 then rank_name:='Executive'; bonus_value:=20000; monthly_cap:=18000;
  elsif life>=250000 then rank_name:='Diamond'; bonus_value:=10000; monthly_cap:=12000;
  elsif life>=100000 then rank_name:='Platinum'; bonus_value:=5000; monthly_cap:=8000;
  elsif life>=50000 then rank_name:='Gold'; bonus_value:=2500; monthly_cap:=5000;
  elsif life>=25000 then rank_name:='Silver'; bonus_value:=1000;
  elsif life>=10000 then rank_name:='Bronze'; bonus_value:=500;
  end if;

  insert into public.ambassador_v2_reward_state(application_id,highest_bonus_value,highest_rank)
  values(p_application_id,0,'Ambassador')
  on conflict(application_id) do nothing;

  select highest_bonus_value into previous_bonus
    from public.ambassador_v2_reward_state
   where application_id=p_application_id for update;

  bonus_delta:=greatest(bonus_value-previous_bonus,0);
  if bonus_delta>0 then
    insert into public.ambassador_earnings_ledger(
      application_id,qualifying_revenue,commission_rate,commission_amount,
      earning_type,earning_status,earning_month,notes
    ) values(
      p_application_id,0,0,bonus_delta,'achievement_bonus','approved',month_start,
      'One-time achievement bonus unlocked from confirmed direct qualifying revenue at '||rank_name||' rank.'
    );
    update public.ambassador_v2_reward_state
       set highest_bonus_value=bonus_value,highest_rank=rank_name,updated_at=now()
     where application_id=p_application_id;
  end if;

  select coalesce(sum(l.commission_amount),0) into monthly_paid
    from public.ambassador_earnings_ledger l
   where l.application_id=p_application_id
     and l.earning_type='monthly_performance'
     and l.earning_month=month_start
     and l.earning_status in ('approved','paid');

  return jsonb_build_object(
    'rank',rank_name,'lifetime_revenue',life,'monthly_revenue',mon,
    'achievement_bonus_added',bonus_delta,'monthly_payment_cap',monthly_cap,
    'monthly_payment',monthly_paid
  );
end;
$$;
revoke all on function public.refresh_ambassador_v2_rewards(uuid,date) from public;
grant execute on function public.refresh_ambassador_v2_rewards(uuid,date) to service_role;

create or replace function public.guard_ambassador_payout()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_confirmed numeric(12,2):=0;
  v_committed numeric(12,2):=0;
  v_bank_verified boolean:=false;
  v_active boolean:=false;
begin
  if new.amount is null or new.amount<=0 then raise exception 'Payout amount must be greater than zero.'; end if;
  if new.status not in ('scheduled','processing','paid','failed','cancelled') then raise exception 'Invalid Ambassador payout status.'; end if;

  if new.status in ('scheduled','processing','paid') then
    select exists(select 1 from public.ambassador_programme_applications a where a.id=new.application_id and a.status='approved' and a.account_status in ('introductory','active')) into v_active;
    if not v_active then raise exception 'Payouts can only be processed for an approved active Ambassador account.'; end if;

    select exists(select 1 from public.ambassador_payout_details d where d.application_id=new.application_id and d.verification_status='verified' and d.verified_at is not null) into v_bank_verified;
    if not v_bank_verified then raise exception 'Verify the Ambassador banking details before scheduling or paying a payout.'; end if;

    select coalesce(sum(l.commission_amount),0) into v_confirmed
      from public.ambassador_earnings_ledger l
     where l.application_id=new.application_id
       and l.earning_status in ('approved','paid')
       and (l.earning_type<>'commission' or (l.payment_id is not null and public.ambassador_v2_payment_is_eligible(l.payment_id)));

    select coalesce(sum(p.amount),0) into v_committed
      from public.ambassador_payouts p
     where p.application_id=new.application_id
       and p.status in ('scheduled','processing','paid')
       and (tg_op='INSERT' or p.id<>new.id);

    if v_committed+new.amount>v_confirmed then
      raise exception 'Payout exceeds the unpaid confirmed Ambassador earnings. Confirmed: R%, already scheduled/paid: R%, requested: R%.',v_confirmed,v_committed,new.amount;
    end if;

    if new.status='paid' then
      if nullif(trim(coalesce(new.payment_reference,'')),'') is null then raise exception 'A payment reference is required before marking an Ambassador payout as paid.'; end if;
      if new.payment_date is null then raise exception 'A payment date is required before marking an Ambassador payout as paid.'; end if;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.guard_ambassador_payout() from public;
grant execute on function public.guard_ambassador_payout() to service_role;
drop trigger if exists trg_guard_ambassador_payout on public.ambassador_payouts;
create trigger trg_guard_ambassador_payout before insert or update on public.ambassador_payouts for each row execute function public.guard_ambassador_payout();

create or replace function public.guard_ambassador_application_approval()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status='approved' then
    if coalesce(new.profiles_verified,false) is not true then raise exception 'Verify the applicant creator profile(s) before approving this Ambassador application.'; end if;
    if new.agreement_status<>'accepted' then raise exception 'The current Ambassador Programme Agreement must be accepted before approval.'; end if;
  end if;
  return new;
end;
$$;
revoke all on function public.guard_ambassador_application_approval() from public;
grant execute on function public.guard_ambassador_application_approval() to service_role;
drop trigger if exists trg_guard_ambassador_application_approval on public.ambassador_programme_applications;
create trigger trg_guard_ambassador_application_approval before insert or update on public.ambassador_programme_applications for each row execute function public.guard_ambassador_application_approval();