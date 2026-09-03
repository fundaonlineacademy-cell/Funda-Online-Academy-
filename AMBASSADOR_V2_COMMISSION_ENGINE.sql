-- Funda Online Academy — Ambassador V2 verified-payment commission engine
-- Run AFTER AMBASSADOR_PROGRAMME_V2_SETUP.sql, then run AMBASSADOR_V2_REWARDS_ENGINE.sql.

create table if not exists public.ambassador_v2_referrals (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.ambassador_programme_applications(id) on delete cascade,
  student_user_id uuid not null, referral_code text not null, source_page text, claimed_at timestamptz not null default now(), unique(student_user_id)
);
create index if not exists ambassador_v2_referrals_application_idx on public.ambassador_v2_referrals(application_id, claimed_at desc);
alter table public.ambassador_v2_referrals enable row level security;

create or replace function public.claim_ambassador_v2_referral(p_code text,p_source_page text default null)
returns boolean language plpgsql security definer set search_path=public as $$ declare v_app uuid;v_uid uuid:=auth.uid(); begin
 if v_uid is null then return false;end if;
 select id into v_app from public.ambassador_programme_applications where upper(referral_code)=upper(trim(p_code)) and account_status in('introductory','active') limit 1;
 if v_app is null then return false;end if;
 insert into public.ambassador_v2_referrals(application_id,student_user_id,referral_code,source_page) values(v_app,v_uid,upper(trim(p_code)),p_source_page) on conflict(student_user_id) do nothing;
 return found;end $$;
revoke all on function public.claim_ambassador_v2_referral(text,text) from public;grant execute on function public.claim_ambassador_v2_referral(text,text) to authenticated;

create unique index if not exists ambassador_earnings_unique_payment_commission on public.ambassador_earnings_ledger(payment_id) where earning_type='commission' and payment_id is not null;

create or replace function public.credit_ambassador_v2_verified_payment(p_payment_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_pay record;v_student_user uuid;v_app uuid;v_amount numeric(12,2);v_enrol uuid;v_added boolean:=false;
begin
 select id,student_id,enrolment_id,amount,status into v_pay from public.payments where id=p_payment_id;
 if v_pay.id is null or lower(coalesce(v_pay.status,''))<>'verified' then return false;end if;
 v_amount:=greatest(coalesce(v_pay.amount,0),0);v_enrol:=v_pay.enrolment_id;if v_amount<=0 then return false;end if;
 begin execute 'select coalesce(user_id,auth_user_id) from public.students where id=$1' into v_student_user using v_pay.student_id;
 exception when undefined_column then begin execute 'select user_id from public.students where id=$1' into v_student_user using v_pay.student_id;exception when undefined_column then return false;end;end;
 if v_student_user is null then return false;end if;
 select application_id into v_app from public.ambassador_v2_referrals where student_user_id=v_student_user limit 1;if v_app is null then return false;end if;
 insert into public.ambassador_earnings_ledger(application_id,enrolment_id,payment_id,qualifying_revenue,commission_rate,commission_amount,earning_type,earning_status,earning_month,notes)
 values(v_app,v_enrol,p_payment_id,v_amount,0.20,round(v_amount*0.20,2),'commission','approved',date_trunc('month',current_date)::date,'Automatically credited from verified student payment.') on conflict do nothing;
 v_added:=found;
 if v_added then begin perform public.refresh_ambassador_v2_rewards(v_app,date_trunc('month',current_date)::date);exception when undefined_function then null;end;end if;
 return v_added;
end $$;
revoke all on function public.credit_ambassador_v2_verified_payment(uuid) from public;grant execute on function public.credit_ambassador_v2_verified_payment(uuid) to authenticated;
comment on function public.credit_ambassador_v2_verified_payment(uuid) is 'Credits one 20% Ambassador V2 commission for an attributed verified payment and refreshes rank rewards.';
