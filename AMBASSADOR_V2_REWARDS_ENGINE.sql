-- Funda Online Academy — Ambassador V2 rewards engine
-- Run after AMBASSADOR_PROGRAMME_V2_SETUP.sql and AMBASSADOR_V2_COMMISSION_ENGINE.sql.
-- Creates incremental achievement bonuses and monthly performance payments from verified commission ledger revenue.

create table if not exists public.ambassador_v2_reward_state (
 application_id uuid primary key references public.ambassador_programme_applications(id) on delete cascade,
 highest_bonus_value numeric(12,2) not null default 0,
 highest_rank text not null default 'Ambassador',
 updated_at timestamptz not null default now()
);
alter table public.ambassador_v2_reward_state enable row level security;

create unique index if not exists ambassador_v2_unique_monthly_performance
on public.ambassador_earnings_ledger(application_id,earning_month)
where earning_type='monthly_performance' and earning_status <> 'reversed';

create or replace function public.refresh_ambassador_v2_rewards(p_application_id uuid, p_month date default date_trunc('month',current_date)::date)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
 life numeric:=0; mon numeric:=0; rank_name text:='Ambassador'; bonus_value numeric:=0; previous_bonus numeric:=0;
 target numeric:=0; monthly_pay numeric:=0; bonus_delta numeric:=0; month_start date:=date_trunc('month',p_month)::date;
begin
 select coalesce(sum(qualifying_revenue),0) into life from public.ambassador_earnings_ledger
 where application_id=p_application_id and earning_type='commission' and earning_status in ('approved','paid','pending','held');
 select coalesce(sum(qualifying_revenue),0) into mon from public.ambassador_earnings_ledger
 where application_id=p_application_id and earning_type='commission' and earning_status in ('approved','paid','pending','held') and earning_month=month_start;

 if life>=500000 then rank_name:='Elite'; bonus_value:=45000; target:=125000; monthly_pay:=25000;
 elsif life>=275000 then rank_name:='Executive'; bonus_value:=25000; target:=90000; monthly_pay:=18000;
 elsif life>=175000 then rank_name:='Diamond'; bonus_value:=15000; target:=60000; monthly_pay:=12000;
 elsif life>=100000 then rank_name:='Platinum'; bonus_value:=7500; target:=40000; monthly_pay:=8000;
 elsif life>=50000 then rank_name:='Gold'; bonus_value:=3500; target:=25000; monthly_pay:=5000;
 elsif life>=25000 then rank_name:='Silver'; bonus_value:=1500;
 elsif life>=10000 then rank_name:='Bronze'; bonus_value:=500;
 end if;

 insert into public.ambassador_v2_reward_state(application_id,highest_bonus_value,highest_rank)
 values(p_application_id,0,'Ambassador') on conflict(application_id) do nothing;
 select highest_bonus_value into previous_bonus from public.ambassador_v2_reward_state where application_id=p_application_id for update;
 bonus_delta:=greatest(bonus_value-previous_bonus,0);
 if bonus_delta>0 then
   insert into public.ambassador_earnings_ledger(application_id,qualifying_revenue,commission_rate,commission_amount,earning_type,earning_status,earning_month,notes)
   values(p_application_id,0,0,bonus_delta,'achievement_bonus','approved',month_start,'Incremental achievement bonus unlocked at '||rank_name||' rank.');
   update public.ambassador_v2_reward_state set highest_bonus_value=bonus_value,highest_rank=rank_name,updated_at=now() where application_id=p_application_id;
 end if;

 if target>0 and mon>=target then
   insert into public.ambassador_earnings_ledger(application_id,qualifying_revenue,commission_rate,commission_amount,earning_type,earning_status,earning_month,notes)
   values(p_application_id,0,0,monthly_pay,'monthly_performance','approved',month_start,rank_name||' monthly performance payment: target '||target||' achieved.')
   on conflict do nothing;
 end if;
 return jsonb_build_object('rank',rank_name,'lifetime_revenue',life,'monthly_revenue',mon,'achievement_bonus_added',bonus_delta,'monthly_target',target,'monthly_payment',case when target>0 and mon>=target then monthly_pay else 0 end);
end $$;

revoke all on function public.refresh_ambassador_v2_rewards(uuid,date) from public;
grant execute on function public.refresh_ambassador_v2_rewards(uuid,date) to authenticated;

comment on function public.refresh_ambassador_v2_rewards(uuid,date) is 'Calculates lifetime rank, incremental achievement bonus, and qualifying monthly performance payment for Ambassador V2.';
