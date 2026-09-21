-- Funda Online Academy — Ambassador Programme performance finalisation
-- 21 September 2026
--
-- Records the production controls introduced during the final Admin audit:
--   * Admin-only monthly performance leaderboard
--   * Admin-only detailed referral evidence
--   * Optional monthly challenge register (recognition only; no automatic payout)
--   * Realtime publication for authoritative Ambassador programme sources
--
-- Front-end presentation is implemented in:
--   admin-ambassador-programme-v2.js
--   admin-ambassador-performance.js
-- The existing Finance approval/payout controls remain authoritative.

begin;

create table if not exists public.ambassador_monthly_challenges(
  id uuid primary key default gen_random_uuid(),
  challenge_month date not null unique,
  title text not null,
  prize_description text null,
  rules_text text null,
  status text not null default 'draft'
    check (status in ('draft','active','closed')),
  winner_application_id uuid null
    references public.ambassador_programme_applications(id) on delete set null,
  winner_finalised_at timestamptz null,
  created_by uuid null references public.profiles(id) on delete set null,
  updated_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ambassador_challenge_month_start
    check (
      challenge_month =
      date_trunc('month',challenge_month)::date
    )
);

alter table public.ambassador_monthly_challenges
  enable row level security;

grant select,insert,update,delete
  on public.ambassador_monthly_challenges
  to authenticated;

drop policy if exists "Admins manage ambassador monthly challenges"
  on public.ambassador_monthly_challenges;

create policy "Admins manage ambassador monthly challenges"
on public.ambassador_monthly_challenges
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create or replace function public.get_admin_ambassador_performance(
  p_month date default current_date
)
returns table(
  performance_position bigint,
  application_id uuid,
  full_name text,
  account_status text,
  referral_code text,
  valid_referrals_month bigint,
  valid_referrals_lifetime bigint,
  approved_students_month bigint,
  verified_revenue_month numeric,
  confirmed_commission_month numeric,
  monthly_performance_payment numeric,
  lifetime_verified_revenue numeric,
  lifetime_confirmed_commission numeric,
  paid_out numeric,
  current_rank text,
  disqualified_referrals bigint
)
language plpgsql
security invoker
set search_path to 'public','pg_temp'
as $function$
declare
  v_month date :=
    date_trunc('month',coalesce(p_month,current_date))::date;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Administrator access is required.';
  end if;

  return query
  with active_apps as (
    select a.id,a.full_name,a.account_status,a.referral_code
    from public.ambassador_programme_applications a
    where a.status='approved'
      and a.account_status in ('introductory','active')
  ),
  referral_stats as (
    select
      a.id application_id,
      count(r.id) filter (
        where r.eligibility_status='recorded'
          and r.claimed_at >= v_month
          and r.claimed_at < v_month + interval '1 month'
      )::bigint valid_referrals_month,
      count(r.id) filter (
        where r.eligibility_status='recorded'
      )::bigint valid_referrals_lifetime,
      count(r.id) filter (
        where r.eligibility_status<>'recorded'
      )::bigint disqualified_referrals
    from active_apps a
    left join public.ambassador_v2_referrals r
      on r.application_id=a.id
    group by a.id
  ),
  admin_earn as (
    select *
    from public.get_admin_ambassador_earnings()
  ),
  verified as (
    select
      l.application_id,
      l.enrolment_id,
      e.student_id,
      l.earning_month,
      l.qualifying_revenue,
      l.commission_amount
    from admin_earn l
    join public.enrollments e
      on e.id=l.enrolment_id
    where l.earning_type='commission'
      and l.earning_status in ('approved','paid')
      and l.verified_eligible=true
  ),
  earning_stats as (
    select
      a.id application_id,
      count(distinct v.student_id)
        filter (where v.earning_month=v_month)::bigint
        approved_students_month,
      coalesce(sum(v.qualifying_revenue)
        filter (where v.earning_month=v_month),0)::numeric
        verified_revenue_month,
      coalesce(sum(v.commission_amount)
        filter (where v.earning_month=v_month),0)::numeric
        confirmed_commission_month,
      coalesce(sum(v.qualifying_revenue),0)::numeric
        lifetime_verified_revenue,
      coalesce(sum(v.commission_amount),0)::numeric
        lifetime_confirmed_commission
    from active_apps a
    left join verified v on v.application_id=a.id
    group by a.id
  ),
  monthly_perf as (
    select
      a.id application_id,
      coalesce(sum(l.commission_amount) filter (
        where l.earning_type='monthly_performance'
          and l.earning_status in ('approved','paid')
          and l.earning_month=v_month
      ),0)::numeric monthly_performance_payment
    from active_apps a
    left join admin_earn l on l.application_id=a.id
    group by a.id
  ),
  payout_stats as (
    select
      a.id application_id,
      coalesce(sum(p.amount) filter (where p.status='paid'),0)::numeric
        paid_out
    from active_apps a
    left join public.ambassador_payouts p
      on p.application_id=a.id
    group by a.id
  ),
  scored as (
    select
      a.id application_id,
      a.full_name,
      a.account_status,
      a.referral_code,
      coalesce(r.valid_referrals_month,0) valid_referrals_month,
      coalesce(r.valid_referrals_lifetime,0) valid_referrals_lifetime,
      coalesce(e.approved_students_month,0) approved_students_month,
      coalesce(e.verified_revenue_month,0) verified_revenue_month,
      coalesce(e.confirmed_commission_month,0) confirmed_commission_month,
      coalesce(mp.monthly_performance_payment,0)
        monthly_performance_payment,
      coalesce(e.lifetime_verified_revenue,0)
        lifetime_verified_revenue,
      coalesce(e.lifetime_confirmed_commission,0)
        lifetime_confirmed_commission,
      coalesce(po.paid_out,0) paid_out,
      case
        when coalesce(e.lifetime_verified_revenue,0)>=1000000
          then 'Elite'
        when coalesce(e.lifetime_verified_revenue,0)>=500000
          then 'Executive'
        when coalesce(e.lifetime_verified_revenue,0)>=250000
          then 'Diamond'
        when coalesce(e.lifetime_verified_revenue,0)>=100000
          then 'Platinum'
        when coalesce(e.lifetime_verified_revenue,0)>=50000
          then 'Gold'
        when coalesce(e.lifetime_verified_revenue,0)>=25000
          then 'Silver'
        when coalesce(e.lifetime_verified_revenue,0)>=10000
          then 'Bronze'
        else 'Ambassador'
      end current_rank,
      coalesce(r.disqualified_referrals,0)
        disqualified_referrals
    from active_apps a
    left join referral_stats r on r.application_id=a.id
    left join earning_stats e on e.application_id=a.id
    left join monthly_perf mp on mp.application_id=a.id
    left join payout_stats po on po.application_id=a.id
  )
  select
    row_number() over (
      order by
        s.verified_revenue_month desc,
        s.approved_students_month desc,
        s.valid_referrals_month desc,
        lower(s.full_name)
    )::bigint performance_position,
    s.*
  from scored s
  order by performance_position;
end;
$function$;

create or replace function public.get_admin_ambassador_referral_details(
  p_application_id uuid default null
)
returns table(
  application_id uuid,
  ambassador_name text,
  referral_id uuid,
  referral_code text,
  student_name text,
  student_email text,
  student_number text,
  source_page text,
  referral_date timestamptz,
  eligibility_status text,
  disqualification_reason text,
  enrolments jsonb,
  verified_qualifying_revenue numeric,
  confirmed_commission numeric
)
language plpgsql
security invoker
set search_path to 'public','pg_temp'
as $function$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Administrator access is required.';
  end if;

  return query
  with admin_earn as (
    select *
    from public.get_admin_ambassador_earnings()
  )
  select
    r.application_id,
    a.full_name ambassador_name,
    r.id referral_id,
    r.referral_code,
    coalesce(
      p.full_name,
      p.email,
      'Deleted / unavailable Student'
    ) student_name,
    p.email student_email,
    p.student_number,
    r.source_page,
    r.claimed_at referral_date,
    r.eligibility_status,
    r.disqualification_reason,
    coalesce(en.courses,'[]'::jsonb) enrolments,
    coalesce(v.verified_revenue,0)::numeric
      verified_qualifying_revenue,
    coalesce(v.confirmed_commission,0)::numeric
      confirmed_commission
  from public.ambassador_v2_referrals r
  join public.ambassador_programme_applications a
    on a.id=r.application_id
  left join public.profiles p
    on p.id=r.student_user_id
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'enrolment_id',e.id,
        'course_id',e.course_id,
        'course_title',c.title,
        'enrolled_at',e.enrolled_at,
        'enrollment_status',e.enrollment_status,
        'status',e.status,
        'reviewed_at',e.reviewed_at,
        'amount',e.amount
      )
      order by coalesce(
        e.reviewed_at,
        e.enrolled_at,
        e.created_at
      ) desc
    ) courses
    from public.enrollments e
    left join public.courses c on c.id=e.course_id
    where e.student_id=r.student_user_id
  ) en on true
  left join lateral (
    select
      coalesce(sum(l.qualifying_revenue),0)
        verified_revenue,
      coalesce(sum(l.commission_amount),0)
        confirmed_commission
    from admin_earn l
    join public.enrollments e
      on e.id=l.enrolment_id
    where l.application_id=r.application_id
      and e.student_id=r.student_user_id
      and l.earning_type='commission'
      and l.earning_status in ('approved','paid')
      and l.verified_eligible=true
  ) v on true
  where p_application_id is null
     or r.application_id=p_application_id
  order by r.claimed_at desc;
end;
$function$;

revoke execute
  on function public.get_admin_ambassador_performance(date)
  from public,anon;
revoke execute
  on function public.get_admin_ambassador_referral_details(uuid)
  from public,anon;

grant execute
  on function public.get_admin_ambassador_performance(date)
  to authenticated;
grant execute
  on function public.get_admin_ambassador_referral_details(uuid)
  to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'ambassador_programme_applications',
    'ambassador_v2_referrals',
    'ambassador_earnings_ledger',
    'ambassador_payouts',
    'ambassador_payout_details',
    'ambassador_v2_reward_state',
    'ambassador_monthly_challenges'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname='supabase_realtime'
        and schemaname='public'
        and tablename=t
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        t
      );
    end if;
  end loop;
end $$;

commit;


-- 21 September 2026 — Ambassador correspondence and final physical-review corrections
-- Physical review corrections:
--   * removed duplicate empty Ambassador shell KPI cards and duplicate workspace copy
--   * exposed Referral Register directly from the performance panel
--   * added confirmed Ambassador earnings and payouts-paid summaries
--   * added Admin-only Ambassador correspondence drafts / final letters
--   * added approval, high-value partnership, activation, recognition and follow-up templates
--   * correspondence history is included in the formal Ambassador report

create table if not exists public.ambassador_correspondence_drafts(
  id uuid primary key default gen_random_uuid(),
  application_id uuid null
    references public.ambassador_programme_applications(id) on delete set null,
  correspondence_kind text not null default 'email'
    check (correspondence_kind in ('email','letter')),
  template_key text not null,
  correspondence_date date not null default current_date,
  recipient_name text null,
  recipient_email text null,
  subject text not null,
  body_text text not null,
  status text not null default 'draft'
    check (status in ('draft','final')),
  created_by uuid null references public.profiles(id) on delete set null,
  updated_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ambassador_correspondence_drafts enable row level security;
grant select,insert,update,delete on public.ambassador_correspondence_drafts
  to authenticated;

drop policy if exists "Admins manage ambassador correspondence"
  on public.ambassador_correspondence_drafts;

create policy "Admins manage ambassador correspondence"
on public.ambassador_correspondence_drafts
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname='supabase_realtime'
      and schemaname='public'
      and tablename='ambassador_correspondence_drafts'
  ) then
    alter publication supabase_realtime
      add table public.ambassador_correspondence_drafts;
  end if;
end $$;
