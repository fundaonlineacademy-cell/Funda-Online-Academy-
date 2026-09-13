-- Funda Online Academy — Ambassador ownership and verified-earnings security
-- Supersedes the earlier email-only ownership and payment-only commission rules.
-- Safe to run after the Ambassador Programme V2 setup scripts.

begin;

-- Permanently bind each Ambassador record to one authenticated Supabase user.
alter table public.ambassador_programme_applications
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create unique index if not exists ambassador_programme_applications_auth_user_idx
  on public.ambassador_programme_applications(auth_user_id)
  where auth_user_id is not null;

update public.ambassador_programme_applications a
   set auth_user_id = u.id,
       updated_at = now()
  from auth.users u
 where a.auth_user_id is null
   and lower(u.email) = lower(a.email)
   and (select count(*) from auth.users u2 where lower(u2.email) = lower(a.email)) = 1;

-- Referral eligibility is retained as an audit record instead of deleting invalid claims.
alter table public.ambassador_v2_referrals
  add column if not exists eligibility_status text not null default 'recorded',
  add column if not exists disqualification_reason text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'ambassador_v2_referrals_eligibility_status_check'
       and conrelid = 'public.ambassador_v2_referrals'::regclass
  ) then
    alter table public.ambassador_v2_referrals
      add constraint ambassador_v2_referrals_eligibility_status_check
      check (eligibility_status in ('recorded','disqualified'));
  end if;
end $$;

alter table public.ambassador_earnings_ledger
  alter column commission_rate set default 0.15;

-- Existing self-referrals remain visible to administrators for audit, but never qualify.
update public.ambassador_v2_referrals r
   set eligibility_status = 'disqualified',
       disqualification_reason = coalesce(r.disqualification_reason,'Self-referrals are not eligible under the Ambassador Programme.'),
       reviewed_at = coalesce(r.reviewed_at,now())
  from public.ambassador_programme_applications a
 where a.id = r.application_id
   and r.eligibility_status <> 'disqualified'
   and (
     a.auth_user_id = r.student_user_id
     or exists(
       select 1 from public.profiles p
        where p.id = r.student_user_id
          and lower(coalesce(a.email,'')) = lower(coalesce(p.email,''))
     )
   );

create or replace function public.bind_own_ambassador_account()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_app uuid;
begin
  if v_uid is null then return null; end if;

  select a.id into v_app
    from public.ambassador_programme_applications a
   where a.auth_user_id = v_uid
   limit 1;
  if v_app is not null then return v_app; end if;

  select lower(u.email) into v_email
    from auth.users u
   where u.id = v_uid
     and u.email_confirmed_at is not null;
  if coalesce(v_email,'') = '' then return null; end if;

  update public.ambassador_programme_applications
     set auth_user_id = v_uid,
         updated_at = now()
   where auth_user_id is null
     and lower(email) = v_email
  returning id into v_app;

  return v_app;
end;
$$;

revoke all on function public.bind_own_ambassador_account() from public, anon;
grant execute on function public.bind_own_ambassador_account() to authenticated;

-- One canonical test for a commission-qualifying payment.
create or replace function public.ambassador_v2_payment_is_eligible(p_payment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.payments pay
      join public.students s on s.id = pay.student_id
      join public.enrollments e
        on e.id = pay.enrolment_id
       and e.student_id = s.user_id
      join public.profiles payment_reviewer
        on payment_reviewer.id = pay.verified_by
       and payment_reviewer.role = 'admin'
      join public.profiles enrolment_reviewer
        on enrolment_reviewer.id = e.reviewed_by
       and enrolment_reviewer.role = 'admin'
      join public.ambassador_v2_referrals r
        on r.student_user_id = s.user_id
       and r.eligibility_status = 'recorded'
      join public.ambassador_programme_applications a
        on a.id = r.application_id
       and a.status = 'approved'
       and a.account_status in ('introductory','active')
     where pay.id = p_payment_id
       and lower(coalesce(pay.status,'')) = 'verified'
       and pay.verified_at is not null
       and pay.verified_by is not null
       and lower(coalesce(e.enrollment_status,e.status,'')) = 'approved'
       and e.reviewed_at is not null
       and e.reviewed_by is not null
       and coalesce(pay.amount,0) > 0
       and a.auth_user_id is distinct from s.user_id
       and lower(coalesce(a.email,'')) <> lower(coalesce(s.email,''))
  );
$$;

revoke all on function public.ambassador_v2_payment_is_eligible(uuid) from public, anon, authenticated;
grant execute on function public.ambassador_v2_payment_is_eligible(uuid) to service_role;

-- The ledger itself rejects attempts to approve a commission without both approvals.
create or replace function public.guard_ambassador_verified_commission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_application_id uuid;
  v_enrolment_id uuid;
  v_amount numeric(12,2);
  v_month date;
begin
  if new.earning_type = 'commission' and new.earning_status in ('approved','paid') then
    if new.payment_id is null or not public.ambassador_v2_payment_is_eligible(new.payment_id) then
      raise exception 'Commission cannot be confirmed until the student enrolment and payment are both approved by an administrator.';
    end if;

    select r.application_id,
           pay.enrolment_id,
           round(pay.amount::numeric,2),
           date_trunc('month',pay.verified_at)::date
      into v_application_id,v_enrolment_id,v_amount,v_month
      from public.payments pay
      join public.students s on s.id = pay.student_id
      join public.ambassador_v2_referrals r
        on r.student_user_id = s.user_id
       and r.eligibility_status = 'recorded'
     where pay.id = new.payment_id;

    new.application_id := v_application_id;
    new.enrolment_id := v_enrolment_id;
    new.qualifying_revenue := v_amount;
    new.commission_rate := 0.15;
    new.commission_amount := round(v_amount * 0.15,2);
    new.earning_month := v_month;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_guard_ambassador_verified_commission on public.ambassador_earnings_ledger;
create trigger trg_guard_ambassador_verified_commission
before insert or update on public.ambassador_earnings_ledger
for each row execute function public.guard_ambassador_verified_commission();

revoke all on function public.guard_ambassador_verified_commission() from public, anon, authenticated, service_role;

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
  life numeric := 0;
  mon numeric := 0;
  rank_name text := 'Ambassador';
  bonus_value numeric := 0;
  previous_bonus numeric := 0;
  monthly_pay numeric := 0;
  bonus_delta numeric := 0;
  month_start date := date_trunc('month',p_month)::date;
begin
  select coalesce(sum(l.qualifying_revenue),0)
    into life
    from public.ambassador_earnings_ledger l
   where l.application_id = p_application_id
     and l.earning_type = 'commission'
     and l.earning_status in ('approved','paid')
     and public.ambassador_v2_payment_is_eligible(l.payment_id);

  select coalesce(sum(l.qualifying_revenue),0)
    into mon
    from public.ambassador_earnings_ledger l
   where l.application_id = p_application_id
     and l.earning_type = 'commission'
     and l.earning_status in ('approved','paid')
     and l.earning_month = month_start
     and public.ambassador_v2_payment_is_eligible(l.payment_id);

  if life >= 1000000 then rank_name := 'Elite'; bonus_value := 45000; monthly_pay := 25000;
  elsif life >= 500000 then rank_name := 'Executive'; bonus_value := 20000; monthly_pay := 18000;
  elsif life >= 250000 then rank_name := 'Diamond'; bonus_value := 10000; monthly_pay := 12000;
  elsif life >= 100000 then rank_name := 'Platinum'; bonus_value := 5000; monthly_pay := 8000;
  elsif life >= 50000 then rank_name := 'Gold'; bonus_value := 2500; monthly_pay := 5000;
  elsif life >= 25000 then rank_name := 'Silver'; bonus_value := 1000;
  elsif life >= 10000 then rank_name := 'Bronze'; bonus_value := 500;
  end if;

  insert into public.ambassador_v2_reward_state(application_id,highest_bonus_value,highest_rank)
  values(p_application_id,0,'Ambassador')
  on conflict(application_id) do nothing;

  select highest_bonus_value into previous_bonus
    from public.ambassador_v2_reward_state
   where application_id = p_application_id
   for update;

  bonus_delta := greatest(bonus_value - previous_bonus,0);
  if bonus_delta > 0 then
    insert into public.ambassador_earnings_ledger(
      application_id,qualifying_revenue,commission_rate,commission_amount,
      earning_type,earning_status,earning_month,notes
    ) values (
      p_application_id,0,0,bonus_delta,
      'achievement_bonus','approved',month_start,
      'One-time achievement bonus unlocked from confirmed direct qualifying revenue at '||rank_name||' rank.'
    );

    update public.ambassador_v2_reward_state
       set highest_bonus_value = bonus_value,
           highest_rank = rank_name,
           updated_at = now()
     where application_id = p_application_id;
  end if;

  return jsonb_build_object(
    'rank',rank_name,
    'lifetime_revenue',life,
    'monthly_revenue',mon,
    'achievement_bonus_added',bonus_delta,
    'monthly_payment_cap',monthly_pay,
    'monthly_payment',0
  );
end;
$$;

revoke all on function public.refresh_ambassador_v2_rewards(uuid,date) from public, anon, authenticated;
grant execute on function public.refresh_ambassador_v2_rewards(uuid,date) to service_role;

-- Synchronise a payment into the ledger only after the full verification chain passes.
create or replace function public.credit_ambassador_v2_verified_payment(p_payment_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_application_id uuid;
  v_previous_application_id uuid;
  v_enrolment_id uuid;
  v_amount numeric(12,2);
  v_month date;
  v_eligible boolean := false;
begin
  select l.application_id into v_previous_application_id
    from public.ambassador_earnings_ledger l
   where l.payment_id = p_payment_id
     and l.earning_type = 'commission'
   limit 1;

  if public.ambassador_v2_payment_is_eligible(p_payment_id) then
    select r.application_id,
           pay.enrolment_id,
           round(pay.amount::numeric,2),
           date_trunc('month',pay.verified_at)::date
      into v_application_id,v_enrolment_id,v_amount,v_month
      from public.payments pay
      join public.students s on s.id = pay.student_id
      join public.ambassador_v2_referrals r
        on r.student_user_id = s.user_id
       and r.eligibility_status = 'recorded'
     where pay.id = p_payment_id;

    insert into public.ambassador_earnings_ledger(
      application_id,enrolment_id,payment_id,qualifying_revenue,commission_rate,
      commission_amount,earning_type,earning_status,earning_month,notes
    ) values (
      v_application_id,v_enrolment_id,p_payment_id,v_amount,0.15,
      round(v_amount * 0.15,2),'commission','approved',v_month,
      'Confirmed after administrator approval of both the student enrolment and verified payment.'
    )
    on conflict (payment_id) where earning_type = 'commission' and payment_id is not null
    do update set
      application_id = excluded.application_id,
      enrolment_id = excluded.enrolment_id,
      qualifying_revenue = excluded.qualifying_revenue,
      commission_rate = 0.15,
      commission_amount = excluded.commission_amount,
      earning_status = case
        when public.ambassador_earnings_ledger.earning_status = 'paid' then 'paid'
        else 'approved'
      end,
      earning_month = excluded.earning_month,
      notes = excluded.notes,
      updated_at = now();

    v_eligible := true;
  elsif v_previous_application_id is not null then
    update public.ambassador_earnings_ledger
       set earning_status = case
             when exists(select 1 from public.payments p where p.id = p_payment_id) then 'reversed'
             else 'held'
           end,
           notes = case
             when exists(select 1 from public.payments p where p.id = p_payment_id)
               then 'Removed from confirmed earnings because the payment or enrolment no longer meets the verification rules.'
             else 'Held by the verification audit because the linked payment record could not be confirmed.'
           end,
           updated_at = now()
     where payment_id = p_payment_id
       and earning_type = 'commission'
       and earning_status <> 'reversed';
  end if;

  if coalesce(v_application_id,v_previous_application_id) is not null then
    perform public.refresh_ambassador_v2_rewards(
      coalesce(v_application_id,v_previous_application_id),
      coalesce(v_month,date_trunc('month',current_date)::date)
    );
  end if;

  return v_eligible;
end;
$$;

revoke all on function public.credit_ambassador_v2_verified_payment(uuid) from public, anon, authenticated;
grant execute on function public.credit_ambassador_v2_verified_payment(uuid) to service_role;

create or replace function public.ambassador_v2_payment_verified_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.credit_ambassador_v2_verified_payment(new.id);
  return new;
end;
$$;

create or replace function public.ambassador_v2_enrolment_sync_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment record;
begin
  for v_payment in select p.id from public.payments p where p.enrolment_id = new.id loop
    perform public.credit_ambassador_v2_verified_payment(v_payment.id);
  end loop;
  return new;
end;
$$;

create or replace function public.ambassador_v2_referral_sync_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment record;
begin
  for v_payment in
    select p.id
      from public.students s
      join public.payments p on p.student_id = s.id
     where s.user_id = new.student_user_id
  loop
    perform public.credit_ambassador_v2_verified_payment(v_payment.id);
  end loop;
  return new;
end;
$$;

revoke all on function public.ambassador_v2_payment_verified_trigger() from public, anon, authenticated, service_role;
revoke all on function public.ambassador_v2_enrolment_sync_trigger() from public, anon, authenticated, service_role;
revoke all on function public.ambassador_v2_referral_sync_trigger() from public, anon, authenticated, service_role;

drop trigger if exists trg_ambassador_v2_payment_verified on public.payments;
drop trigger if exists trg_ambassador_v2_payment_insert on public.payments;
drop trigger if exists trg_ambassador_v2_payment_update on public.payments;
create trigger trg_ambassador_v2_payment_insert
after insert on public.payments
for each row execute function public.ambassador_v2_payment_verified_trigger();
create trigger trg_ambassador_v2_payment_update
after update of status,verified_at,verified_by,amount,enrolment_id,student_id on public.payments
for each row execute function public.ambassador_v2_payment_verified_trigger();

drop trigger if exists trg_ambassador_v2_enrolment_insert on public.enrollments;
drop trigger if exists trg_ambassador_v2_enrolment_update on public.enrollments;
create trigger trg_ambassador_v2_enrolment_insert
after insert on public.enrollments
for each row execute function public.ambassador_v2_enrolment_sync_trigger();
create trigger trg_ambassador_v2_enrolment_update
after update of status,enrollment_status,reviewed_at,reviewed_by on public.enrollments
for each row execute function public.ambassador_v2_enrolment_sync_trigger();

drop trigger if exists trg_ambassador_v2_referral_sync on public.ambassador_v2_referrals;
create trigger trg_ambassador_v2_referral_sync
after insert or update on public.ambassador_v2_referrals
for each row execute function public.ambassador_v2_referral_sync_trigger();

-- Quarantine any historical commission that cannot prove the complete approval chain.
update public.ambassador_earnings_ledger l
   set earning_status = 'held',
       notes = 'Held by the September 2026 verification audit: no complete administrator-approved payment and enrolment chain was found.',
       updated_at = now()
 where l.earning_type = 'commission'
   and l.earning_status in ('approved','paid','pending')
   and (l.payment_id is null or not public.ambassador_v2_payment_is_eligible(l.payment_id));

-- Re-check all real payments after installing the strict rules.
do $$
declare
  v_payment record;
begin
  for v_payment in select p.id from public.payments p loop
    perform public.credit_ambassador_v2_verified_payment(v_payment.id);
  end loop;
end $$;

do $$
declare
  v_application record;
begin
  for v_application in select a.id from public.ambassador_programme_applications a loop
    perform public.refresh_ambassador_v2_rewards(v_application.id,date_trunc('month',current_date)::date);
  end loop;
end $$;

create or replace function public.claim_ambassador_v2_referral(
  p_code text,
  p_source_page text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app uuid;
  v_uid uuid := auth.uid();
  v_existing uuid;
  v_email text;
  v_payment record;
begin
  if v_uid is null then return false; end if;
  if not exists(select 1 from public.profiles p where p.id = v_uid and p.role = 'student') then return false; end if;

  select lower(u.email) into v_email from auth.users u where u.id = v_uid;
  select a.id into v_app
    from public.ambassador_programme_applications a
   where upper(a.referral_code) = upper(trim(p_code))
     and a.status = 'approved'
     and a.account_status in ('introductory','active')
     and a.auth_user_id is distinct from v_uid
     and lower(coalesce(a.email,'')) <> lower(coalesce(v_email,''))
   limit 1;
  if v_app is null then return false; end if;

  select r.application_id into v_existing
    from public.ambassador_v2_referrals r
   where r.student_user_id = v_uid;
  if v_existing is not null then return v_existing = v_app; end if;

  insert into public.ambassador_v2_referrals(
    application_id,student_user_id,referral_code,source_page,eligibility_status
  ) values (
    v_app,v_uid,upper(trim(p_code)),left(p_source_page,500),'recorded'
  );

  for v_payment in
    select p.id from public.students s join public.payments p on p.student_id = s.id where s.user_id = v_uid
  loop
    perform public.credit_ambassador_v2_verified_payment(v_payment.id);
  end loop;

  return true;
end;
$$;

revoke all on function public.claim_ambassador_v2_referral(text,text) from public, anon;
grant execute on function public.claim_ambassador_v2_referral(text,text) to authenticated;

create or replace function public.get_own_ambassador_referrals()
returns table(
  referral_id uuid,
  student_display text,
  course_title text,
  referral_date timestamptz,
  referral_status text,
  earning_status text,
  earning_amount numeric
)
language sql
security definer
set search_path = ''
as $$
  with mine as (
    select a.id application_id
      from public.ambassador_programme_applications a
     where a.auth_user_id = auth.uid()
       and a.status = 'approved'
     limit 1
  )
  select r.id,
         case
           when coalesce(p.full_name,'') = '' then 'Referred student'
           when array_length(regexp_split_to_array(trim(p.full_name),'\s+'),1) = 1
             then split_part(trim(p.full_name),' ',1)
           else split_part(trim(p.full_name),' ',1)||' '||
             left((regexp_split_to_array(trim(p.full_name),'\s+'))[
               array_length(regexp_split_to_array(trim(p.full_name),'\s+'),1)
             ],1)||'.'
         end as student_display,
         coalesce(latest_enrolment.course_title,'Course not yet selected') as course_title,
         r.claimed_at,
         case
           when r.eligibility_status = 'disqualified' then 'disqualified'
           when latest_enrolment.enrolment_id is null then 'referred'
           when latest_enrolment.is_approved then 'student_approved'
           else 'enrolment_pending'
         end as referral_status,
         case
           when r.eligibility_status = 'disqualified' then 'disqualified'
           when coalesce(confirmed.amount,0) > 0 then 'confirmed'
           else 'not_yet_earned'
         end as earning_status,
         coalesce(confirmed.amount,0)::numeric as earning_amount
    from public.ambassador_v2_referrals r
    join mine m on m.application_id = r.application_id
    left join public.profiles p on p.id = r.student_user_id
    left join lateral (
      select e.id enrolment_id,
             c.title course_title,
             (
               lower(coalesce(e.enrollment_status,e.status,'')) = 'approved'
               and e.reviewed_at is not null
               and exists(select 1 from public.profiles er where er.id=e.reviewed_by and er.role='admin')
             ) is_approved
        from public.enrollments e
        left join public.courses c on c.id = e.course_id
       where e.student_id = r.student_user_id
       order by coalesce(e.submitted_at,e.enrolled_at,e.created_at) desc nulls last
       limit 1
    ) latest_enrolment on true
    left join lateral (
      select coalesce(sum(l.commission_amount),0) amount
        from public.ambassador_earnings_ledger l
        join public.enrollments e on e.id = l.enrolment_id and e.student_id = r.student_user_id
       where l.application_id = r.application_id
         and l.earning_type = 'commission'
         and l.earning_status in ('approved','paid')
         and public.ambassador_v2_payment_is_eligible(l.payment_id)
    ) confirmed on true
   order by r.claimed_at desc;
$$;

revoke all on function public.get_own_ambassador_referrals() from public, anon;
grant execute on function public.get_own_ambassador_referrals() to authenticated;

create or replace function public.get_own_ambassador_payout_details()
returns table(
  account_holder text,
  bank_name text,
  account_last4 text,
  account_type text,
  branch_code text,
  verification_status text,
  verified_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select d.account_holder,
         d.bank_name,
         right(regexp_replace(d.account_number,'[^0-9]','','g'),4),
         d.account_type,
         d.branch_code,
         d.verification_status,
         d.verified_at,
         d.created_at,
         d.updated_at
    from public.ambassador_payout_details d
    join public.ambassador_programme_applications a on a.id = d.application_id
   where a.auth_user_id = auth.uid()
   limit 1;
$$;

revoke all on function public.get_own_ambassador_payout_details() from public, anon;
grant execute on function public.get_own_ambassador_payout_details() to authenticated;

create or replace function public.submit_own_ambassador_payout_details(
  p_account_holder text,
  p_bank_name text,
  p_account_number text,
  p_account_type text,
  p_branch_code text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app uuid;
  v_account_number text := regexp_replace(coalesce(p_account_number,''),'[^0-9]','','g');
  v_branch_code text := regexp_replace(coalesce(p_branch_code,''),'[^0-9]','','g');
begin
  if auth.uid() is null then return false; end if;
  select a.id into v_app
    from public.ambassador_programme_applications a
   where a.auth_user_id = auth.uid()
     and a.status = 'approved'
     and a.account_status in ('introductory','active')
   limit 1;
  if v_app is null then return false; end if;

  if char_length(trim(coalesce(p_account_holder,''))) < 2
     or char_length(trim(coalesce(p_bank_name,''))) < 2 then
    raise exception 'Account holder and bank name are required.';
  end if;
  if char_length(v_account_number) < 6 or char_length(v_account_number) > 20 then
    raise exception 'Enter a valid bank account number.';
  end if;
  if char_length(v_branch_code) <> 6 then
    raise exception 'Enter a valid 6-digit branch code.';
  end if;

  insert into public.ambassador_payout_details(
    application_id,account_holder,bank_name,account_number,account_type,
    branch_code,verification_status,verified_at,updated_at
  ) values (
    v_app,trim(p_account_holder),trim(p_bank_name),v_account_number,
    nullif(trim(p_account_type),''),v_branch_code,'pending',null,now()
  )
  on conflict(application_id) do update set
    account_holder = excluded.account_holder,
    bank_name = excluded.bank_name,
    account_number = excluded.account_number,
    account_type = excluded.account_type,
    branch_code = excluded.branch_code,
    verification_status = 'pending',
    verified_at = null,
    updated_at = now();

  return true;
end;
$$;

revoke all on function public.submit_own_ambassador_payout_details(text,text,text,text,text) from public, anon;
grant execute on function public.submit_own_ambassador_payout_details(text,text,text,text,text) to authenticated;

create or replace function public.update_own_ambassador_profile(
  p_phone text,
  p_province text,
  p_country text,
  p_best_platform text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then return false; end if;
  update public.ambassador_programme_applications
     set phone = nullif(trim(p_phone),''),
         province = nullif(trim(p_province),''),
         country = coalesce(nullif(trim(p_country),''),'South Africa'),
         best_platform = nullif(trim(p_best_platform),''),
         updated_at = now()
   where auth_user_id = auth.uid()
     and status = 'approved';
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

revoke all on function public.update_own_ambassador_profile(text,text,text,text) from public, anon;
grant execute on function public.update_own_ambassador_profile(text,text,text,text) to authenticated;

create or replace function public.accept_own_ambassador_agreement()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then return false; end if;
  update public.ambassador_programme_applications
     set agreement_status = 'accepted',
         agreement_accepted_at = now(),
         updated_at = now()
   where auth_user_id = auth.uid()
     and status = 'approved'
     and agreement_status in ('not_sent','sent');
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

revoke all on function public.accept_own_ambassador_agreement() from public, anon;
grant execute on function public.accept_own_ambassador_agreement() to authenticated;

create or replace function public.activate_own_ambassador_account()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app_id uuid;
  v_name text;
  v_status text;
  v_code text;
  v_active_count integer;
begin
  if auth.uid() is null then return false; end if;

  select a.id,a.full_name,a.account_status
    into v_app_id,v_name,v_status
    from public.ambassador_programme_applications a
   where a.auth_user_id = auth.uid()
     and a.status = 'approved'
     and a.agreement_status = 'accepted'
   limit 1;

  if v_app_id is null then return false; end if;
  if v_status in ('introductory','active') then return true; end if;
  if v_status <> 'application' then return false; end if;

  select count(*) into v_active_count
    from public.ambassador_programme_applications a
   where a.account_status in ('introductory','active');
  if v_active_count >= 25 then
    raise exception 'The founding Ambassador intake has reached the 25 active ambassador limit.';
  end if;

  loop
    v_code := 'FUNDA-'||upper(substr(regexp_replace(coalesce(v_name,'AMB'),'[^A-Za-z0-9]','','g'),1,8))||'-'||
              upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
    exit when not exists(
      select 1 from public.ambassador_programme_applications a where a.referral_code = v_code
    );
  end loop;

  update public.ambassador_programme_applications
     set account_status = 'introductory',
         referral_code = coalesce(referral_code,v_code),
         introductory_started_at = coalesce(introductory_started_at,now()),
         introductory_ends_at = coalesce(introductory_ends_at,now()+interval '90 days'),
         updated_at = now()
   where id = v_app_id;

  return true;
end;
$$;

revoke all on function public.activate_own_ambassador_account() from public, anon;
grant execute on function public.activate_own_ambassador_account() to authenticated;

create or replace function public.get_own_ambassador_announcements()
returns table(
  source_id uuid,
  title text,
  message text,
  category text,
  priority text,
  pinned boolean,
  created_at timestamptz,
  sender_name text,
  sender_department text,
  sender_title text,
  audience text,
  source_type text
)
language sql
security definer
set search_path = ''
as $$
  with mine as (
    select a.id application_id
      from public.ambassador_programme_applications a
     where a.auth_user_id = auth.uid()
       and a.status = 'approved'
     limit 1
  ),
  ambassador_only as (
    select n.id source_id,n.title,n.message,coalesce(n.category,'programme') category,
           'normal'::text priority,false pinned,n.created_at,
           coalesce(nullif(p.full_name,''),'Funda Online Academy') sender_name,
           coalesce(nullif(p.department,''),'Administration') sender_department,
           coalesce(nullif(p.job_title,''),case when lower(coalesce(p.role,''))='admin' then 'Administrator' else 'Staff Member' end) sender_title,
           case when n.application_id is null then 'all_ambassadors' else 'individual_ambassador' end audience,
           'ambassador_notification'::text source_type
      from public.ambassador_notifications n
      join mine m on n.application_id is null or n.application_id = m.application_id
      left join public.profiles p on p.id = n.created_by
     where n.status = 'active'
  ),
  academy_wide as (
    select c.id source_id,c.title,c.body message,coalesce(c.category,'Announcement') category,
           coalesce(c.priority,'normal') priority,coalesce(c.pinned,false) pinned,
           coalesce(c.published_at,c.created_at) created_at,
           coalesce(nullif(p.full_name,''),'Funda Online Academy') sender_name,
           coalesce(nullif(p.department,''),'Administration') sender_department,
           coalesce(nullif(p.job_title,''),case when lower(coalesce(p.role,''))='admin' then 'Administrator' else 'Staff Member' end) sender_title,
           c.audience,'academy_communication'::text source_type
      from public.communications c
      cross join mine m
      left join public.profiles p on p.id = c.created_by
     where c.published = true
       and c.audience in ('ambassadors','all_funda')
       and (c.scheduled_at is null or c.scheduled_at <= now())
  )
  select * from ambassador_only
  union all
  select * from academy_wide
  order by pinned desc,created_at desc;
$$;

revoke all on function public.get_own_ambassador_announcements() from public, anon;
grant execute on function public.get_own_ambassador_announcements() to authenticated;

create or replace function public.get_admin_ambassador_earnings()
returns table(
  id uuid,
  application_id uuid,
  enrolment_id uuid,
  payment_id uuid,
  qualifying_revenue numeric,
  commission_rate numeric,
  commission_amount numeric,
  earning_type text,
  earning_status text,
  earning_month date,
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  verified_eligible boolean,
  verification_state text
)
language sql
security definer
set search_path = ''
as $$
  with allowed as (select 1 where public.is_admin())
  select l.id,l.application_id,l.enrolment_id,l.payment_id,l.qualifying_revenue,
         l.commission_rate,l.commission_amount,l.earning_type,l.earning_status,
         l.earning_month,l.notes,l.created_at,l.updated_at,
         case
           when l.earning_type <> 'commission' then true
           else public.ambassador_v2_payment_is_eligible(l.payment_id)
         end verified_eligible,
         case
           when l.earning_type <> 'commission' then 'Manual programme earning — administrator confirmation required'
           when l.payment_id is null then 'No linked payment'
           when not exists(select 1 from public.payments p where p.id=l.payment_id) then 'Linked payment not found'
           when public.ambassador_v2_payment_is_eligible(l.payment_id) then 'Payment and student enrolment approved'
           else 'Awaiting a valid approved payment and student enrolment'
         end verification_state
    from public.ambassador_earnings_ledger l
    cross join allowed
   order by l.created_at desc;
$$;

revoke all on function public.get_admin_ambassador_earnings() from public, anon;
grant execute on function public.get_admin_ambassador_earnings() to authenticated;

create or replace function public.admin_set_ambassador_earning_status(
  p_earning_id uuid,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row record;
  v_status text := lower(trim(coalesce(p_status,'')));
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if v_status not in ('pending','approved','held','paid','reversed') then
    raise exception 'Invalid earning status.';
  end if;

  select * into v_row
    from public.ambassador_earnings_ledger l
   where l.id = p_earning_id
   for update;
  if v_row.id is null then return false; end if;

  if v_row.earning_type = 'commission' and v_status in ('approved','paid') then
    if v_row.payment_id is null or not public.ambassador_v2_payment_is_eligible(v_row.payment_id) then
      raise exception 'This commission cannot be confirmed: the student enrolment and payment are not both administrator-approved.';
    end if;
    perform public.credit_ambassador_v2_verified_payment(v_row.payment_id);
  end if;

  update public.ambassador_earnings_ledger
     set earning_status = v_status,
         updated_at = now()
   where id = p_earning_id;

  perform public.refresh_ambassador_v2_rewards(v_row.application_id,v_row.earning_month);
  return true;
end;
$$;

revoke all on function public.admin_set_ambassador_earning_status(uuid,text) from public, anon;
grant execute on function public.admin_set_ambassador_earning_status(uuid,text) to authenticated;

-- Replace email-based RLS with immutable authenticated-user ownership.
drop policy if exists "public submit ambassador applications" on public.ambassador_programme_applications;
drop policy if exists "ambassador read own account" on public.ambassador_programme_applications;
drop policy if exists "ambassador accept own agreement" on public.ambassador_programme_applications;
drop policy if exists "ambassador read bound account" on public.ambassador_programme_applications;
create policy "ambassador read bound account"
on public.ambassador_programme_applications for select to authenticated
using (auth_user_id = (select auth.uid()));

drop policy if exists "ambassador read own earnings" on public.ambassador_earnings_ledger;
drop policy if exists "ambassador read confirmed own earnings" on public.ambassador_earnings_ledger;
create policy "ambassador read confirmed own earnings"
on public.ambassador_earnings_ledger for select to authenticated
using (
  earning_status in ('approved','paid')
  and exists(
    select 1 from public.ambassador_programme_applications a
     where a.id = application_id
       and a.auth_user_id = (select auth.uid())
  )
);

drop policy if exists "ambassador read own payouts" on public.ambassador_payouts;
drop policy if exists "ambassador read bound payouts" on public.ambassador_payouts;
create policy "ambassador read bound payouts"
on public.ambassador_payouts for select to authenticated
using (exists(
  select 1 from public.ambassador_programme_applications a
   where a.id = application_id and a.auth_user_id = (select auth.uid())
));

drop policy if exists "ambassador read own payout details" on public.ambassador_payout_details;

drop policy if exists "ambassadors read active marketing resources" on public.ambassador_marketing_resources;
create policy "ambassadors read active marketing resources"
on public.ambassador_marketing_resources for select to authenticated
using (
  status = 'active'
  and exists(
    select 1 from public.ambassador_programme_applications a
     where a.auth_user_id = (select auth.uid()) and a.status = 'approved'
  )
);

drop policy if exists "ambassadors read own notifications" on public.ambassador_notifications;
create policy "ambassadors read own notifications"
on public.ambassador_notifications for select to authenticated
using (
  status = 'active'
  and exists(
    select 1 from public.ambassador_programme_applications a
     where a.auth_user_id = (select auth.uid())
       and a.status = 'approved'
       and (application_id is null or application_id = a.id)
  )
);

drop policy if exists "ambassadors manage own support tickets" on public.ambassador_support_tickets;
drop policy if exists "ambassadors read own support tickets" on public.ambassador_support_tickets;
drop policy if exists "ambassadors create own support tickets" on public.ambassador_support_tickets;
create policy "ambassadors read own support tickets"
on public.ambassador_support_tickets for select to authenticated
using (exists(
  select 1 from public.ambassador_programme_applications a
   where a.id = application_id and a.auth_user_id = (select auth.uid())
));
create policy "ambassadors create own support tickets"
on public.ambassador_support_tickets for insert to authenticated
with check (
  status = 'open'
  and exists(
    select 1 from public.ambassador_programme_applications a
     where a.id = application_id and a.auth_user_id = (select auth.uid())
  )
);

drop policy if exists "ambassadors manage own support messages" on public.ambassador_support_messages;
drop policy if exists "ambassadors read own support messages" on public.ambassador_support_messages;
drop policy if exists "ambassadors create own support messages" on public.ambassador_support_messages;
create policy "ambassadors read own support messages"
on public.ambassador_support_messages for select to authenticated
using (exists(
  select 1
    from public.ambassador_support_tickets t
    join public.ambassador_programme_applications a on a.id = t.application_id
   where t.id = ticket_id and a.auth_user_id = (select auth.uid())
));
create policy "ambassadors create own support messages"
on public.ambassador_support_messages for insert to authenticated
with check (
  author_id = (select auth.uid())
  and author_role = 'ambassador'
  and exists(
    select 1
      from public.ambassador_support_tickets t
      join public.ambassador_programme_applications a on a.id = t.application_id
     where t.id = ticket_id
       and a.auth_user_id = (select auth.uid())
       and t.status not in ('resolved','closed')
  )
);

-- Cover the portal's ownership and activity lookups as the programme grows.
create index if not exists ambassador_notifications_application_idx
  on public.ambassador_notifications(application_id);
create index if not exists ambassador_payouts_application_idx
  on public.ambassador_payouts(application_id,created_at desc);
create index if not exists ambassador_support_tickets_application_idx
  on public.ambassador_support_tickets(application_id,created_at desc);
create index if not exists ambassador_support_messages_ticket_idx
  on public.ambassador_support_messages(ticket_id,created_at);
create index if not exists ambassador_v2_referrals_reviewed_by_idx
  on public.ambassador_v2_referrals(reviewed_by)
  where reviewed_by is not null;

drop policy if exists "admins view ambassador reward state" on public.ambassador_v2_reward_state;
create policy "admins view ambassador reward state"
on public.ambassador_v2_reward_state for select to authenticated
using (public.is_admin());

alter function public.touch_ambassador_agreement_delivery_updated_at() set search_path = '';
revoke all on function public.touch_ambassador_agreement_delivery_updated_at() from public, anon, authenticated;

comment on column public.ambassador_programme_applications.auth_user_id is
  'Immutable Supabase Auth owner used for all Ambassador portal access decisions.';
comment on function public.ambassador_v2_payment_is_eligible(uuid) is
  'True only when a direct referral, administrator-approved enrolment and administrator-verified payment all match.';
comment on function public.credit_ambassador_v2_verified_payment(uuid) is
  'Synchronises the single 15% commission ledger entry for an eligible verified payment.';

commit;
