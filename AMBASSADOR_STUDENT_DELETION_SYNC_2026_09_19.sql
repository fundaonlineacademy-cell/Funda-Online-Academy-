-- Funda Online Academy
-- Ambassador sync when a referred Student account is permanently deleted
-- 19 September 2026
--
-- Owner-approved rule:
-- * a permanently deleted Student must not remain in Ambassador referral totals;
-- * direct commission from that Student must no longer appear as confirmed earnings;
-- * deleted-Student revenue must not count toward Ambassador rank/quota progress;
-- * the underlying referral/ledger history remains available to Admin as an audit record.

begin;

create or replace function public.ambassador_v2_student_account_is_active(p_student_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
      from public.profiles p
      join auth.users u on u.id = p.id
     where p.id = p_student_user_id
       and pg_catalog.lower(coalesce(p.role,'')) = 'student'
       and u.deleted_at is null
       and not exists (
         select 1
           from public.ceo_account_control_state s
          where s.user_id = p_student_user_id
            and s.status = 'deleted'
       )
  );
$function$;

revoke all on function public.ambassador_v2_student_account_is_active(uuid) from public, anon, authenticated;
grant execute on function public.ambassador_v2_student_account_is_active(uuid) to service_role;

create or replace function public.ambassador_v2_payment_is_eligible(p_payment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
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
       and public.ambassador_v2_student_account_is_active(s.user_id)
       and pg_catalog.lower(coalesce(pay.status,'')) = 'verified'
       and pay.verified_at is not null
       and pay.verified_by is not null
       and pg_catalog.lower(coalesce(e.enrollment_status,e.status,'')) = 'approved'
       and e.reviewed_at is not null
       and e.reviewed_by is not null
       and coalesce(pay.amount,0) > 0
       and a.auth_user_id is distinct from s.user_id
       and pg_catalog.lower(coalesce(a.email,'')) <> pg_catalog.lower(coalesce(s.email,''))
  );
$function$;

revoke all on function public.ambassador_v2_payment_is_eligible(uuid) from public, anon, authenticated;
grant execute on function public.ambassador_v2_payment_is_eligible(uuid) to service_role;

create or replace function public.get_own_ambassador_earnings()
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
  updated_at timestamptz
)
language sql
security definer
set search_path = ''
as $function$
  with mine as (
    select a.id application_id
      from public.ambassador_programme_applications a
     where a.auth_user_id = auth.uid()
       and a.status = 'approved'
       and a.account_status in ('introductory','active')
     limit 1
  )
  select
    l.id,l.application_id,l.enrolment_id,l.payment_id,l.qualifying_revenue,
    l.commission_rate,l.commission_amount,l.earning_type,l.earning_status,
    l.earning_month,l.notes,l.created_at,l.updated_at
  from public.ambassador_earnings_ledger l
  join mine m on m.application_id = l.application_id
  where l.earning_status in ('approved','paid')
    and (
      l.earning_type <> 'commission'
      or (
        l.payment_id is not null
        and public.ambassador_v2_payment_is_eligible(l.payment_id)
      )
    )
  order by l.created_at desc;
$function$;

revoke all on function public.get_own_ambassador_earnings() from public, anon;
grant execute on function public.get_own_ambassador_earnings() to authenticated;

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
as $function$
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
           when array_length(regexp_split_to_array(pg_catalog.btrim(p.full_name),'\s+'),1) = 1
             then split_part(pg_catalog.btrim(p.full_name),' ',1)
           else split_part(pg_catalog.btrim(p.full_name),' ',1)||' '||
             left((regexp_split_to_array(pg_catalog.btrim(p.full_name),'\s+'))[
               array_length(regexp_split_to_array(pg_catalog.btrim(p.full_name),'\s+'),1)
             ],1)||'.'
         end as student_display,
         coalesce(latest_enrolment.course_title,'Course not yet selected') as course_title,
         r.claimed_at,
         case
           when latest_enrolment.enrolment_id is null then 'registered'
           when latest_enrolment.is_approved then 'student_approved'
           else 'enrolment_pending'
         end as referral_status,
         case
           when coalesce(confirmed.amount,0) > 0 then 'confirmed'
           else 'not_yet_earned'
         end as earning_status,
         coalesce(confirmed.amount,0)::numeric as earning_amount
    from public.ambassador_v2_referrals r
    join mine m on m.application_id = r.application_id
    join public.profiles p on p.id = r.student_user_id
    left join lateral (
      select e.id enrolment_id,
             c.title course_title,
             (
               pg_catalog.lower(coalesce(e.enrollment_status,e.status,'')) = 'approved'
               and e.reviewed_at is not null
               and exists(
                 select 1 from public.profiles er
                  where er.id = e.reviewed_by and er.role = 'admin'
               )
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
        join public.enrollments e
          on e.id = l.enrolment_id
         and e.student_id = r.student_user_id
       where l.application_id = r.application_id
         and l.earning_type = 'commission'
         and l.earning_status in ('approved','paid')
         and public.ambassador_v2_payment_is_eligible(l.payment_id)
    ) confirmed on true
   where r.eligibility_status = 'recorded'
     and public.ambassador_v2_student_account_is_active(r.student_user_id)
   order by r.claimed_at desc;
$function$;

revoke all on function public.get_own_ambassador_referrals() from public, anon;
grant execute on function public.get_own_ambassador_referrals() to authenticated;

create or replace function public.ambassador_v2_disqualify_deleted_student(
  p_student_user_id uuid,
  p_reason text default null,
  p_actor uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_application_id uuid;
  v_referrals integer := 0;
  v_reversed integer := 0;
  v_life numeric := 0;
  v_entitled_bonus numeric := 0;
  v_previous_bonus numeric := 0;
  v_paid_bonus numeric := 0;
  v_rank text := 'Ambassador';
  v_reason text := 'Student account was permanently deleted from the Academy.';
begin
  if nullif(pg_catalog.btrim(coalesce(p_reason,'')),'') is not null then
    v_reason := 'Student account was permanently deleted from the Academy. CEO reason: ' ||
                pg_catalog.btrim(p_reason);
  end if;

  select r.application_id
    into v_application_id
    from public.ambassador_v2_referrals r
   where r.student_user_id = p_student_user_id
   limit 1;

  if v_application_id is null then
    return pg_catalog.jsonb_build_object(
      'student_user_id',p_student_user_id,
      'referrals_disqualified',0,
      'commission_rows_reversed',0
    );
  end if;

  update public.ambassador_v2_referrals
     set eligibility_status = 'disqualified',
         disqualification_reason = v_reason,
         reviewed_at = pg_catalog.now(),
         reviewed_by = p_actor
   where student_user_id = p_student_user_id
     and eligibility_status <> 'disqualified';
  get diagnostics v_referrals = row_count;

  update public.ambassador_earnings_ledger l
     set earning_status = 'reversed',
         notes = 'Reversed because the referred Student account was permanently deleted. The historical record is retained for audit only.',
         updated_at = pg_catalog.now()
   where l.application_id = v_application_id
     and l.earning_type = 'commission'
     and l.earning_status <> 'reversed'
     and (
       exists (
         select 1
           from public.enrollments e
          where e.id = l.enrolment_id
            and e.student_id = p_student_user_id
       )
       or exists (
         select 1
           from public.payments pay
           join public.students s on s.id = pay.student_id
          where pay.id = l.payment_id
            and s.user_id = p_student_user_id
       )
     );
  get diagnostics v_reversed = row_count;

  select coalesce(sum(l.qualifying_revenue),0)
    into v_life
    from public.ambassador_earnings_ledger l
   where l.application_id = v_application_id
     and l.earning_type = 'commission'
     and l.earning_status in ('approved','paid')
     and l.payment_id is not null
     and public.ambassador_v2_payment_is_eligible(l.payment_id);

  if v_life >= 1000000 then v_rank := 'Elite'; v_entitled_bonus := 45000;
  elsif v_life >= 500000 then v_rank := 'Executive'; v_entitled_bonus := 20000;
  elsif v_life >= 250000 then v_rank := 'Diamond'; v_entitled_bonus := 10000;
  elsif v_life >= 100000 then v_rank := 'Platinum'; v_entitled_bonus := 5000;
  elsif v_life >= 50000 then v_rank := 'Gold'; v_entitled_bonus := 2500;
  elsif v_life >= 25000 then v_rank := 'Silver'; v_entitled_bonus := 1000;
  elsif v_life >= 10000 then v_rank := 'Bronze'; v_entitled_bonus := 500;
  end if;

  select coalesce(rs.highest_bonus_value,0)
    into v_previous_bonus
    from public.ambassador_v2_reward_state rs
   where rs.application_id = v_application_id;

  if coalesce(v_previous_bonus,0) > v_entitled_bonus then
    select coalesce(sum(l.commission_amount),0)
      into v_paid_bonus
      from public.ambassador_earnings_ledger l
     where l.application_id = v_application_id
       and l.earning_type = 'achievement_bonus'
       and l.earning_status = 'paid';

    update public.ambassador_earnings_ledger
       set earning_status = 'reversed',
           notes = 'Reversed after deletion of a referred Student reduced valid qualifying revenue. Historical payout records, if any, remain in Payment History.',
           updated_at = pg_catalog.now()
     where application_id = v_application_id
       and earning_type = 'achievement_bonus'
       and earning_status in ('approved','paid');

    insert into public.ambassador_v2_reward_state(
      application_id,highest_bonus_value,highest_rank,updated_at
    ) values (
      v_application_id,v_paid_bonus,
      case
        when v_paid_bonus >= 45000 then 'Elite'
        when v_paid_bonus >= 20000 then 'Executive'
        when v_paid_bonus >= 10000 then 'Diamond'
        when v_paid_bonus >= 5000 then 'Platinum'
        when v_paid_bonus >= 2500 then 'Gold'
        when v_paid_bonus >= 1000 then 'Silver'
        when v_paid_bonus >= 500 then 'Bronze'
        else 'Ambassador'
      end,
      pg_catalog.now()
    )
    on conflict(application_id) do update
      set highest_bonus_value = excluded.highest_bonus_value,
          highest_rank = excluded.highest_rank,
          updated_at = excluded.updated_at;
  end if;

  perform public.refresh_ambassador_v2_rewards(
    v_application_id,
    pg_catalog.date_trunc('month',current_date)::date
  );

  return pg_catalog.jsonb_build_object(
    'student_user_id',p_student_user_id,
    'application_id',v_application_id,
    'referrals_disqualified',v_referrals,
    'commission_rows_reversed',v_reversed,
    'valid_lifetime_revenue',v_life,
    'current_rank',v_rank
  );
end;
$function$;

revoke all on function public.ambassador_v2_disqualify_deleted_student(uuid,text,uuid)
  from public, anon, authenticated;
grant execute on function public.ambassador_v2_disqualify_deleted_student(uuid,text,uuid)
  to service_role;

create or replace function public.ambassador_v2_ceo_account_deletion_sync()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.status = 'deleted'
     and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    perform public.ambassador_v2_disqualify_deleted_student(
      new.user_id,
      new.reason,
      new.changed_by
    );
  end if;
  return new;
end;
$function$;

revoke all on function public.ambassador_v2_ceo_account_deletion_sync()
  from public, anon, authenticated, service_role;

drop trigger if exists trg_ambassador_v2_ceo_account_deletion_sync
  on public.ceo_account_control_state;
create trigger trg_ambassador_v2_ceo_account_deletion_sync
after insert or update of status on public.ceo_account_control_state
for each row
execute function public.ambassador_v2_ceo_account_deletion_sync();

-- Backfill historical Student accounts that were permanently removed before the
-- CEO account-control synchronisation existed.
update public.ambassador_v2_referrals r
   set eligibility_status = 'disqualified',
       disqualification_reason = coalesce(
         r.disqualification_reason,
         'Student account no longer exists in the Academy active account records.'
       ),
       reviewed_at = coalesce(r.reviewed_at,pg_catalog.now())
 where r.eligibility_status = 'recorded'
   and not public.ambassador_v2_student_account_is_active(r.student_user_id);

-- Any commission whose payment/enrolment can no longer prove eligibility must
-- not remain confirmed. This also clears legacy test-account earnings.
update public.ambassador_earnings_ledger l
   set earning_status = 'reversed',
       notes = 'Reversed after account/referral integrity reconciliation: the linked Student payment or enrolment no longer qualifies.',
       updated_at = pg_catalog.now()
 where l.earning_type = 'commission'
   and l.earning_status in ('approved','paid','pending','held')
   and (
     l.payment_id is null
     or not public.ambassador_v2_payment_is_eligible(l.payment_id)
   );

do $block$
declare
  v_app record;
begin
  for v_app in
    select distinct r.application_id
      from public.ambassador_v2_referrals r
  loop
    perform public.refresh_ambassador_v2_rewards(
      v_app.application_id,
      pg_catalog.date_trunc('month',current_date)::date
    );
  end loop;
end;
$block$;

commit;
