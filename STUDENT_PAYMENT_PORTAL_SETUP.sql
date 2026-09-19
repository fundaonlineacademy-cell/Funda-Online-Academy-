-- Funda Online Academy student payment portal
-- Creates one canonical balance calculation, protected student submissions,
-- and an atomic Admin payment-review action.

begin;

alter table public.payments
  add column if not exists payment_reference text,
  add column if not exists payment_option text,
  add column if not exists installment_number integer,
  add column if not exists installment_count integer,
  add column if not exists submission_source text;

alter table public.payments
  drop constraint if exists payments_payment_method_check,
  drop constraint if exists payments_payment_reference_check,
  drop constraint if exists payments_payment_option_check,
  drop constraint if exists payments_installment_number_check,
  drop constraint if exists payments_installment_count_check,
  drop constraint if exists payments_submission_source_check;

alter table public.payments
  add constraint payments_payment_method_check
    check (payment_method in ('EFT / Bank Transfer', 'Bank Deposit', 'Cash Deposit', 'Other')),
  add constraint payments_payment_reference_check
    check (payment_reference is null or char_length(btrim(payment_reference)) between 2 and 80),
  add constraint payments_payment_option_check
    check (payment_option is null or payment_option in ('next_instalment', 'full_balance')),
  add constraint payments_installment_number_check
    check (installment_number is null or installment_number between 1 and 3),
  add constraint payments_installment_count_check
    check (installment_count is null or installment_count between 1 and 3),
  add constraint payments_submission_source_check
    check (submission_source is null or submission_source in ('registration', 'student_portal'));

create unique index if not exists payments_one_open_submission_per_enrolment_idx
  on public.payments (enrolment_id)
  where enrolment_id is not null and status in ('pending', 'submitted');

create or replace function public.funda_payment_installment_count(
  p_fee numeric,
  p_duration text
)
returns integer
language sql
immutable
set search_path = ''
as $function$
  with duration_parts as (
    select max(m[1]::numeric) as units
    from pg_catalog.regexp_matches(
      coalesce(p_duration, ''),
      '([0-9]+(?:[.][0-9]+)?)',
      'g'
    ) as m
  ), duration_weeks as (
    select coalesce(units, 0) *
      case when pg_catalog.lower(coalesce(p_duration, '')) like '%month%'
        then 4.345
        else 1
      end as weeks
    from duration_parts
  )
  select case
    when greatest(coalesce(p_fee, 0), 0) <= 1300 then 1
    when (select weeks from duration_weeks) < 4 then 1
    when greatest(coalesce(p_fee, 0), 0) >= 2000
      and (select weeks from duration_weeks) >= 8 then 3
    else 2
  end;
$function$;

revoke all on function public.funda_payment_installment_count(numeric, text) from public, anon;
grant execute on function public.funda_payment_installment_count(numeric, text) to authenticated, service_role;

-- An enrolled learner must retain access to the title, duration and agreed
-- payment account even if the course is later removed from the public catalogue.
drop policy if exists "Students can view own enrolled courses" on public.courses;
create policy "Students can view own enrolled courses"
on public.courses
for select
to authenticated
using (
  exists (
    select 1
    from public.enrollments e
    where e.course_id = courses.id
      and e.student_id = (select auth.uid())
  )
);

create or replace view public.student_payment_accounts
with (security_invoker = true)
as
with account_base as (
  select
    e.id as enrolment_id,
    e.student_id as student_auth_id,
    s.id as student_record_id,
    e.course_id,
    c.title as course_title,
    c.duration as course_duration,
    case
      when pg_catalog.lower(coalesce(e.enrollment_status, '')) = 'completed'
        or pg_catalog.lower(coalesce(e.status, '')) = 'completed'
      then 'completed'
      else coalesce(e.enrollment_status, e.status, 'pending')
    end as enrollment_status,
    greatest(coalesce(e.amount, c.price, 0), 0)::numeric(12,2) as course_fee,
    public.funda_payment_installment_count(
      greatest(coalesce(e.amount, c.price, 0), 0),
      c.duration
    ) as installment_count
  from public.enrollments e
  join public.students s on s.user_id = e.student_id
  join public.courses c on c.id = e.course_id
), payment_totals as (
  select
    p.enrolment_id,
    coalesce(sum(p.amount) filter (where p.status = 'verified'), 0)::numeric(12,2) as verified_paid,
    coalesce(sum(p.amount) filter (where p.status in ('pending', 'submitted')), 0)::numeric(12,2) as submitted_amount,
    coalesce(sum(p.amount) filter (where p.status = 'rejected'), 0)::numeric(12,2) as rejected_amount,
    count(*) filter (where p.status in ('pending', 'submitted')) > 0 as has_payment_under_review,
    max(coalesce(p.submitted_at, p.created_at)) as last_payment_at
  from public.payments p
  where p.enrolment_id is not null
  group by p.enrolment_id
), money_cents as (
  select
    b.*,
    coalesce(t.verified_paid, 0)::numeric(12,2) as verified_paid,
    coalesce(t.submitted_amount, 0)::numeric(12,2) as submitted_amount,
    coalesce(t.rejected_amount, 0)::numeric(12,2) as rejected_amount,
    coalesce(t.has_payment_under_review, false) as has_payment_under_review,
    t.last_payment_at,
    pg_catalog.round(b.course_fee * 100)::bigint as fee_cents,
    least(
      pg_catalog.round(b.course_fee * 100)::bigint,
      greatest(pg_catalog.round(coalesce(t.verified_paid, 0) * 100)::bigint, 0)
    ) as paid_cents,
    greatest(
      1,
      pg_catalog.ceil(
        pg_catalog.round(b.course_fee * 100)::numeric / greatest(b.installment_count, 1)
      )::bigint
    ) as base_installment_cents
  from account_base b
  left join payment_totals t on t.enrolment_id = b.enrolment_id
), schedule as (
  select
    m.*,
    greatest(m.fee_cents - m.paid_cents, 0) as outstanding_cents,
    case
      when m.fee_cents <= m.paid_cents then m.installment_count
      else least(
        m.installment_count,
        (m.paid_cents / m.base_installment_cents + 1)::integer
      )
    end as next_installment_number
  from money_cents m
)
select
  enrolment_id,
  student_auth_id,
  student_record_id,
  course_id,
  course_title,
  course_duration,
  enrollment_status,
  course_fee,
  installment_count,
  verified_paid,
  submitted_amount,
  rejected_amount,
  (outstanding_cents::numeric / 100)::numeric(12,2) as outstanding_amount,
  case
    when outstanding_cents = 0 then 0::numeric(12,2)
    else (
      least(
        outstanding_cents,
        greatest(
          least(fee_cents, next_installment_number::bigint * base_installment_cents) - paid_cents,
          0
        )
      )::numeric / 100
    )::numeric(12,2)
  end as next_required_amount,
  next_installment_number,
  has_payment_under_review,
  last_payment_at
from schedule;

revoke all on public.student_payment_accounts from public, anon;
grant select on public.student_payment_accounts to authenticated, service_role;

drop policy if exists "Students can submit own payment" on public.payments;
create policy "Students can submit own payment through protected workflow"
on public.payments
for insert
to authenticated
with check (
  (select pg_catalog.current_setting('funda.student_payment_rpc', true)) = 'on'
  and status = 'submitted'
  and exists (
    select 1
    from public.students s
    join public.enrollments e on e.id = payments.enrolment_id
    where s.id = payments.student_id
      and s.user_id = (select auth.uid())
      and e.student_id = (select auth.uid())
      and e.id = payments.enrolment_id
  )
);

drop policy if exists "Students can upload own payment proofs" on storage.objects;
drop policy if exists "Students can upload payment proofs" on storage.objects;
create policy "Students can upload own payment proofs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.enrollments e
    where e.student_id = (select auth.uid())
      and pg_catalog.strpos(storage.filename(name), e.id::text || '-') = 1
  )
);

drop policy if exists "Students can remove unsubmitted payment proofs" on storage.objects;
create policy "Students can remove unsubmitted payment proofs"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.enrollments e
    where e.student_id = (select auth.uid())
      and pg_catalog.strpos(storage.filename(name), e.id::text || '-') = 1
  )
  and not exists (
    select 1
    from public.payments p
    where p.proof_url = storage.objects.name
  )
);

update storage.buckets
set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png']::text[]
where id = 'payment-proofs';

create or replace function public.submit_student_payment(
  p_enrolment_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_payment_reference text,
  p_proof_path text,
  p_payment_option text,
  p_submission_source text default 'student_portal'
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_account public.student_payment_accounts%rowtype;
  v_payment_id uuid;
  v_amount_cents bigint;
  v_allowed_cents bigint;
  v_reference text := pg_catalog.btrim(coalesce(p_payment_reference, ''));
  v_option text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_payment_option, '')));
  v_source text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_submission_source, 'student_portal')));
  v_required_prefix text;
begin
  if auth.uid() is null then
    raise exception 'Your secure student session is required.' using errcode = '42501';
  end if;

  if p_enrolment_id is null then
    raise exception 'Please select a course payment account.' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_enrolment_id::text, 0));

  select a.*
  into v_account
  from public.student_payment_accounts a
  where a.enrolment_id = p_enrolment_id
    and a.student_auth_id = auth.uid();

  if not found then
    raise exception 'This course payment account does not belong to your student profile.' using errcode = '42501';
  end if;

  if v_account.outstanding_amount <= 0 then
    raise exception 'This course balance is already settled.' using errcode = '22023';
  end if;

  if v_account.has_payment_under_review then
    raise exception 'A proof of payment for this course is already awaiting review.' using errcode = '23505';
  end if;

  if p_payment_method not in ('EFT / Bank Transfer', 'Bank Deposit') then
    raise exception 'Select EFT / Bank Transfer or Bank Deposit.' using errcode = '22023';
  end if;

  if char_length(v_reference) < 2 or char_length(v_reference) > 80 then
    raise exception 'Enter the payment reference used at the bank.' using errcode = '22023';
  end if;

  if v_option not in ('next_instalment', 'full_balance') then
    raise exception 'Select the next required instalment or the full outstanding balance.' using errcode = '22023';
  end if;

  if v_source not in ('registration', 'student_portal') then
    raise exception 'The payment submission source is invalid.' using errcode = '22023';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'The payment amount must be greater than zero.' using errcode = '22023';
  end if;

  v_amount_cents := pg_catalog.round(p_amount * 100)::bigint;
  v_allowed_cents := pg_catalog.round(
    case
      when v_option = 'full_balance' then v_account.outstanding_amount
      else v_account.next_required_amount
    end * 100
  )::bigint;

  if v_amount_cents <> v_allowed_cents then
    if v_option = 'full_balance' then
      raise exception 'The full payment must equal the current outstanding balance of R%.',
        pg_catalog.to_char(v_account.outstanding_amount, 'FM999999990.00') using errcode = '22023';
    else
      raise exception 'The next required instalment is R%. Payments below or between the available options are not accepted.',
        pg_catalog.to_char(v_account.next_required_amount, 'FM999999990.00') using errcode = '22023';
    end if;
  end if;

  v_required_prefix := auth.uid()::text || '/' || p_enrolment_id::text || '-';
  if p_proof_path is null
     or pg_catalog.strpos(p_proof_path, v_required_prefix) <> 1
     or pg_catalog.lower(p_proof_path) !~ '[.](pdf|png|jpe?g)$' then
    raise exception 'Upload a PDF, JPG or PNG proof for this course from your own account.' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from storage.objects o
    where o.bucket_id = 'payment-proofs'
      and o.name = p_proof_path
      and (storage.foldername(o.name))[1] = auth.uid()::text
  ) then
    raise exception 'The uploaded proof of payment could not be verified.' using errcode = '22023';
  end if;

  if exists (select 1 from public.payments p where p.proof_url = p_proof_path) then
    raise exception 'This proof of payment has already been submitted.' using errcode = '23505';
  end if;

  perform pg_catalog.set_config('funda.student_payment_rpc', 'on', true);

  insert into public.payments (
    student_id,
    enrolment_id,
    amount,
    payment_method,
    status,
    proof_url,
    notes,
    submitted_at,
    original_amount,
    discount_percent,
    student_category,
    legacy_claim_id,
    payment_reference,
    payment_option,
    installment_number,
    installment_count,
    submission_source
  )
  select
    v_account.student_record_id,
    e.id,
    (v_amount_cents::numeric / 100)::numeric(12,2),
    p_payment_method,
    'submitted',
    p_proof_path,
    pg_catalog.format(
      'Payment reference: %s; Option: %s; Instalment %s of %s; Amount submitted: R%s',
      v_reference,
      case when v_option = 'full_balance' then 'Full outstanding balance' else 'Next required instalment' end,
      v_account.next_installment_number,
      v_account.installment_count,
      pg_catalog.to_char((v_amount_cents::numeric / 100), 'FM999999990.00')
    ),
    pg_catalog.now(),
    e.original_amount,
    e.discount_percent,
    e.student_category,
    e.legacy_claim_id,
    v_reference,
    v_option,
    v_account.next_installment_number,
    v_account.installment_count,
    v_source
  from public.enrollments e
  where e.id = p_enrolment_id
    and e.student_id = auth.uid()
  returning id into v_payment_id;

  if v_payment_id is null then
    raise exception 'The payment record could not be linked to your enrolment.' using errcode = '42501';
  end if;

  return pg_catalog.jsonb_build_object(
    'payment_id', v_payment_id,
    'status', 'submitted',
    'amount', (v_amount_cents::numeric / 100)::numeric(12,2),
    'payment_option', v_option,
    'installment_number', v_account.next_installment_number,
    'installment_count', v_account.installment_count,
    'outstanding_before_review', v_account.outstanding_amount
  );
end;
$function$;

revoke all on function public.submit_student_payment(uuid, numeric, text, text, text, text, text) from public, anon;
grant execute on function public.submit_student_payment(uuid, numeric, text, text, text, text, text) to authenticated;

create or replace function public.review_student_payment(
  p_payment_id uuid,
  p_decision text,
  p_reason text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_payment public.payments%rowtype;
  v_account public.student_payment_accounts%rowtype;
  v_decision text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_decision, '')));
  v_reason text := pg_catalog.btrim(coalesce(p_reason, ''));
  v_now timestamptz := pg_catalog.now();
  v_new_enrollment_status text;
  v_verified_after numeric(12,2);
  v_outstanding_after numeric(12,2);
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Administrator approval access is required.' using errcode = '42501';
  end if;

  if v_decision not in ('verified', 'rejected') then
    raise exception 'Choose Approve or Decline.' using errcode = '22023';
  end if;

  if v_decision = 'rejected' and char_length(v_reason) < 8 then
    raise exception 'Enter a clear decline reason of at least 8 characters.' using errcode = '22023';
  end if;

  select p.*
  into v_payment
  from public.payments p
  where p.id = p_payment_id
  for update;

  if not found then
    raise exception 'The payment record was not found.' using errcode = 'P0002';
  end if;

  if v_payment.status not in ('pending', 'submitted') then
    raise exception 'This payment has already been reviewed.' using errcode = '22023';
  end if;

  select a.*
  into v_account
  from public.student_payment_accounts a
  where a.enrolment_id = v_payment.enrolment_id;

  if not found then
    raise exception 'The linked enrolment payment account was not found.' using errcode = 'P0002';
  end if;

  if v_decision = 'verified' and v_payment.amount > v_account.outstanding_amount then
    raise exception 'This payment exceeds the remaining course balance of R%. Review it before approval.',
      pg_catalog.to_char(v_account.outstanding_amount, 'FM999999990.00') using errcode = '22023';
  end if;

  if v_decision = 'verified' then
    update public.payments
    set
      status = 'verified',
      verified_at = v_now,
      verified_by = auth.uid(),
      rejection_reason = null,
      updated_at = v_now
    where id = v_payment.id;

    update public.enrollments
    set
      status = case
        when pg_catalog.lower(coalesce(status, '')) = 'completed'
          or pg_catalog.lower(coalesce(enrollment_status, '')) = 'completed'
        then 'completed'
        else 'approved'
      end,
      enrollment_status = case
        when pg_catalog.lower(coalesce(status, '')) = 'completed'
          or pg_catalog.lower(coalesce(enrollment_status, '')) = 'completed'
        then 'completed'
        else 'approved'
      end,
      reviewed_at = v_now,
      reviewed_by = auth.uid(),
      review_notes = case
        when v_account.verified_paid > 0 then 'Additional payment verified by Admissions & Finance. Course access remains active.'
        else 'Payment proof verified by Admissions & Finance. Enrolment approved and course access granted.'
      end,
      rejection_reason = null
    where id = v_payment.enrolment_id;

    v_verified_after := (v_account.verified_paid + v_payment.amount)::numeric(12,2);
    v_outstanding_after := greatest(v_account.course_fee - v_verified_after, 0)::numeric(12,2);
    v_new_enrollment_status := case when pg_catalog.lower(v_account.enrollment_status) = 'completed' then 'completed' else 'approved' end;
  else
    update public.payments
    set
      status = 'rejected',
      rejection_reason = v_reason,
      verified_at = null,
      verified_by = auth.uid(),
      updated_at = v_now
    where id = v_payment.id;

    if pg_catalog.lower(v_account.enrollment_status) in ('approved', 'active', 'enrolled', 'completed') then
      update public.enrollments
      set
        reviewed_at = v_now,
        reviewed_by = auth.uid(),
        review_notes = 'A later proof of payment was declined. Course access was not automatically removed; the learner must submit a corrected proof.'
      where id = v_payment.enrolment_id;
      v_new_enrollment_status := v_account.enrollment_status;
    else
      update public.enrollments
      set
        status = 'pending',
        enrollment_status = 'pending',
        reviewed_at = v_now,
        reviewed_by = auth.uid(),
        rejection_reason = v_reason,
        review_notes = 'Payment proof declined. The learner must submit a corrected proof.'
      where id = v_payment.enrolment_id;
      v_new_enrollment_status := 'pending';
    end if;

    v_verified_after := v_account.verified_paid;
    v_outstanding_after := v_account.outstanding_amount;
  end if;

  return pg_catalog.jsonb_build_object(
    'payment_id', v_payment.id,
    'decision', v_decision,
    'enrollment_status', v_new_enrollment_status,
    'verified_total', v_verified_after,
    'outstanding_balance', v_outstanding_after
  );
end;
$function$;

revoke all on function public.review_student_payment(uuid, text, text) from public, anon;
grant execute on function public.review_student_payment(uuid, text, text) to authenticated;

create or replace function public.guard_finance_payment_update()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $function$
begin
  if public.is_admin() then return new; end if;
  if not public.has_department_access('Finance & Accounting','edit') then
    raise exception 'Finance edit access required';
  end if;
  if new.id is distinct from old.id
     or new.student_id is distinct from old.student_id
     or new.enrolment_id is distinct from old.enrolment_id
     or new.amount is distinct from old.amount
     or new.payment_method is distinct from old.payment_method
     or new.proof_url is distinct from old.proof_url
     or new.created_at is distinct from old.created_at
     or new.submitted_at is distinct from old.submitted_at
     or new.original_amount is distinct from old.original_amount
     or new.discount_percent is distinct from old.discount_percent
     or new.student_category is distinct from old.student_category
     or new.legacy_claim_id is distinct from old.legacy_claim_id
     or new.payment_reference is distinct from old.payment_reference
     or new.payment_option is distinct from old.payment_option
     or new.installment_number is distinct from old.installment_number
     or new.installment_count is distinct from old.installment_count
     or new.submission_source is distinct from old.submission_source then
    raise exception 'Finance staff cannot change payment source details';
  end if;
  if new.status is distinct from old.status then
    if not public.has_department_approval('Finance & Accounting') then
      raise exception 'Finance approval authority required';
    end if;
    if old.status not in ('pending','submitted') or new.status not in ('verified','rejected') then
      raise exception 'Invalid finance payment status transition';
    end if;
    new.verified_by := auth.uid();
    new.updated_at := now();
    if new.status='verified' then
      new.verified_at := now();
      new.rejection_reason := null;
    else
      if length(trim(coalesce(new.rejection_reason,''))) < 8 then
        raise exception 'A clear rejection reason of at least 8 characters is required';
      end if;
      new.verified_at := null;
    end if;
  else
    if new.verified_at is distinct from old.verified_at
       or new.verified_by is distinct from old.verified_by
       or new.rejection_reason is distinct from old.rejection_reason then
      raise exception 'Payment review fields may only change during approval or rejection';
    end if;
  end if;
  return new;
end;
$function$;

-- Trigger functions are internal database hooks, not public RPC endpoints.
revoke all on function public.guard_finance_payment_update() from public, anon, authenticated;

commit;
