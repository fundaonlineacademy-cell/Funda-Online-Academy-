-- Combined checkout: one receipt, exact course allocations, unchanged approval/credit gates.
create table if not exists public.course_checkouts (
 id uuid primary key default gen_random_uuid(), student_user_id uuid not null,
 request_fingerprint text not null, claim_ids jsonb not null default '{}'::jsonb,
 status text not null default 'draft' check(status in ('draft','submitted')),
 total_fee numeric(12,2) not null check(total_fee>0), course_count integer not null check(course_count between 1 and 100),
 installment_count integer not null check(installment_count between 1 and 3),
 payment_option text, amount_paid numeric(12,2),
 proof_path text unique, created_at timestamptz not null default now(), submitted_at timestamptz
);
create index if not exists course_checkouts_student_request_idx on public.course_checkouts(student_user_id,request_fingerprint,status);
create table if not exists public.course_checkout_items (
 checkout_id uuid not null references public.course_checkouts(id) on delete cascade,
 course_id uuid not null,
 course_title text not null, course_duration text, original_fee numeric(12,2) not null,
 fee numeric(12,2) not null check(fee>0), discount_percent numeric not null default 0 check(discount_percent between 0 and 100),
 legacy_claim_id uuid references public.legacy_verification_claims(id) on delete set null,
 student_category text not null, installment_amounts numeric[] not null default '{}',
 enrolment_id uuid unique references public.enrollments(id) on delete set null,
 primary key(checkout_id,course_id)
);
create index if not exists course_checkout_items_course_idx on public.course_checkout_items(course_id);
create index if not exists course_checkout_items_claim_idx on public.course_checkout_items(legacy_claim_id) where legacy_claim_id is not null;
alter table public.payments add column if not exists checkout_id uuid references public.course_checkouts(id) on delete restrict;
create index if not exists payments_checkout_idx on public.payments(checkout_id) where checkout_id is not null;
alter table public.course_checkouts enable row level security;
alter table public.course_checkout_items enable row level security;
revoke all on public.course_checkouts,public.course_checkout_items from public,anon,authenticated;
grant select on public.course_checkouts,public.course_checkout_items to authenticated;
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='course_checkouts' and policyname='checkout_read') then
  create policy checkout_read on public.course_checkouts for select to authenticated
   using(student_user_id=(select auth.uid()) or public.is_admin() or public.has_department_access('Finance & Accounting','read'));
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='course_checkout_items' and policyname='checkout_item_read') then
  create policy checkout_item_read on public.course_checkout_items for select to authenticated
   using(exists(select 1 from public.course_checkouts c where c.id=checkout_id));
 end if;
end $$;
create schema if not exists course_checkout_private;
revoke all on schema course_checkout_private from public,anon;
grant usage on schema course_checkout_private to authenticated;

create or replace function course_checkout_private.student_uid() returns uuid
language plpgsql stable security definer set search_path='' as $$
declare v_uid uuid:=auth.uid();
begin
 if v_uid is null or not exists(select 1 from public.profiles p join auth.users u on u.id=p.id where p.id=v_uid and p.role='student' and u.deleted_at is null)
 or exists(select 1 from public.ceo_account_control_state c where c.user_id=v_uid and c.status='deleted') then
  raise exception 'Please sign in with your student account.' using errcode='42501';
 end if;
 return v_uid;
end $$;

create or replace function course_checkout_private.claim_discount(p_course_id uuid,p_claim_id uuid) returns numeric
language plpgsql security definer set search_path='' as $$
declare v_claim public.legacy_verification_claims%rowtype; v_check jsonb; v_percent numeric;
begin
 if p_claim_id is null then return 0; end if;
 select * into v_claim from public.legacy_verification_claims l where l.id=p_claim_id and l.user_id=auth.uid() and l.course_id=p_course_id;
 if v_claim.id is null or coalesce(v_claim.verification_status,'') not in ('approved','pending') then
  raise exception 'A previous-study benefit is not available for one of the selected courses. Please verify it again.';
 end if;
 if v_claim.verification_status='approved' then
  if v_claim.reviewed_at is null or not exists(select 1 from public.profiles p where p.id=v_claim.reviewed_by and p.role='admin') then
   raise exception 'The previous-study benefit needs Admissions approval or fresh verification.';
  end if;
  v_percent:=v_claim.discount_percent;
 else
  if v_claim.evidence_path is null or not exists(select 1 from storage.objects o where o.bucket_id='legacy-verification' and o.name=v_claim.evidence_path and split_part(o.name,'/',1)=auth.uid()::text) then
   raise exception 'Previous-study evidence must belong to your account. Please upload it again.';
  end if;
  if v_claim.claim_type='legacy_completed' then
   v_check:=public.evaluate_legacy_certificate_text(p_course_id,v_claim.id_number,v_claim.extracted_text);
   if not coalesce((v_check->>'verified')::boolean,false) then raise exception 'The certificate must be verified for its selected course.'; end if;
  else
   v_check:=public.check_legacy_entitlement(p_course_id,v_claim.claim_type,v_claim.id_number);
   if not coalesce((v_check->>'matched')::boolean,false) then raise exception 'The previous-study benefit must be verified for its selected course.'; end if;
   if nullif(v_check->>'approved_claim_id','') is not null and not exists(select 1 from public.legacy_verification_claims l join public.profiles p on p.id=l.reviewed_by and p.role='admin'
    where l.id=(v_check->>'approved_claim_id')::uuid and l.user_id=auth.uid() and l.course_id=p_course_id and l.verification_status='approved' and l.reviewed_at is not null) then
    raise exception 'The previous-study benefit needs Admissions approval or fresh verification.';
   end if;
  end if;
  v_percent:=(v_check->>'discount_percent')::numeric;
 end if;
 if v_percent is null or v_percent<0 or v_percent>=100 then raise exception 'The previous-study benefit amount is invalid.'; end if;
 return v_percent;
end $$;

create or replace function course_checkout_private.receipt(p_checkout_id uuid) returns jsonb
language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('id',c.id,'status',c.status,'total_fee',c.total_fee,'course_count',c.course_count,
 'installment_count',c.installment_count,'amount_paid',c.amount_paid,
 'items',(select jsonb_agg(jsonb_build_object('course_id',i.course_id,'title',i.course_title,'duration',i.course_duration,
 'fee',i.fee,'original_fee',i.original_fee,'discount_percent',i.discount_percent,'claim_id',i.legacy_claim_id,
 'installment_amounts',i.installment_amounts,'enrolment_id',i.enrolment_id) order by i.course_id) from public.course_checkout_items i where i.checkout_id=c.id),
 'enrolment_ids',(select jsonb_agg(i.enrolment_id order by i.course_id) from public.course_checkout_items i where i.checkout_id=c.id and i.enrolment_id is not null))
 from public.course_checkouts c where c.id=p_checkout_id and c.student_user_id=auth.uid();
$$;

create or replace function course_checkout_private.prepare(p_course_ids uuid[],p_claim_ids jsonb,p_existing_checkout_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=course_checkout_private.student_uid(); v_ids uuid[]; v_claims jsonb; v_fingerprint text;
 v_group public.course_checkouts%rowtype; v_course record; v_old public.enrollments%rowtype; v_claim uuid;
 v_discount numeric; v_fee numeric; v_total numeric:=0; v_items jsonb:='[]'; v_item record; v_count integer; v_n integer:=1;
 v_balances bigint[]; v_allocations bigint[]; v_due bigint; v_remaining bigint; v_total_cents bigint;
 v_index integer; v_period integer; v_left integer; v_course_ids uuid[];
begin
 if coalesce(array_length(p_course_ids,1),0) not between 1 and 100 or array_position(p_course_ids,null) is not null then raise exception 'Please select valid courses before payment.'; end if;
 if jsonb_typeof(coalesce(p_claim_ids,'{}'))<>'object' then raise exception 'Please verify your selected course benefits again.'; end if;
 select array_agg(distinct id order by id) into v_ids from unnest(p_course_ids) id;
 select jsonb_object_agg(id::text,coalesce(p_claim_ids->id::text,'null'::jsonb)) into v_claims from unnest(v_ids) id;
 v_fingerprint:=md5(jsonb_build_object('courses',v_ids,'claims',v_claims)::text);
 perform pg_advisory_xact_lock(hashtextextended('course-checkout:'||v_uid::text,0));
 if p_existing_checkout_id is not null then
  select * into v_group from public.course_checkouts where id=p_existing_checkout_id and student_user_id=v_uid and request_fingerprint=v_fingerprint;
 end if;
 if v_group.id is null then
  select * into v_group from public.course_checkouts where student_user_id=v_uid and request_fingerprint=v_fingerprint and status='draft' order by created_at desc limit 1;
 end if;
 if v_group.status='submitted' then return course_checkout_private.receipt(v_group.id)||jsonb_build_object('already_submitted',true); end if;
 select count(*) into v_count from public.courses c where c.id=any(v_ids) and c.is_active;
 if v_count<>array_length(v_ids,1) then raise exception 'One of the selected courses is no longer available. Please review your course selection.'; end if;
 for v_course in select c.* from public.courses c where c.id=any(v_ids) order by c.id loop
  select * into v_old from public.enrollments e where e.student_id=v_uid and e.course_id=v_course.id;
  if v_old.id is not null and (v_old.submitted_at is not null or coalesce(v_old.enrollment_status,v_old.status,'pending')<>'pending') then
   raise exception 'You already have an application for %. Please remove it from this selection.',v_course.title;
  end if;
  v_claim:=nullif(v_claims->>v_course.id::text,'')::uuid;
  v_discount:=course_checkout_private.claim_discount(v_course.id,v_claim);
  if v_group.id is not null then
   if not exists(select 1 from public.course_checkout_items i where i.checkout_id=v_group.id and i.course_id=v_course.id and i.discount_percent=v_discount) then
    raise exception 'A verified course benefit has changed. Please review your selected courses and benefits.';
   end if;
  else
   v_fee:=round(v_course.price*(1-v_discount/100),2);
   if v_fee is null or v_fee<=0 or v_fee::text in ('NaN','Infinity','-Infinity') then raise exception 'The fee for % could not be confirmed.',v_course.title; end if;
   if v_old.amount is not null then
    if v_old.amount<>v_fee then raise exception 'The saved fee for % needs Admissions review before a combined payment.',v_course.title; end if;
    v_fee:=v_old.amount;
   end if;
   v_total:=v_total+v_fee;
   v_items:=v_items||jsonb_build_array(jsonb_build_object('course_id',v_course.id,'title',v_course.title,'duration',v_course.duration,
    'original_fee',coalesce(v_old.original_amount,v_course.price),'fee',v_fee,'discount',v_discount,'claim_id',v_claim,
    'category',case when v_claim is null then 'first_time' else (select claim_type from public.legacy_verification_claims where id=v_claim) end));
  end if;
 end loop;
 if v_group.id is not null then return course_checkout_private.receipt(v_group.id); end if;
 select max(public.funda_payment_installment_count(v_total,x->>'duration')) into v_n from jsonb_array_elements(v_items)x;
 insert into public.course_checkouts(student_user_id,request_fingerprint,claim_ids,total_fee,course_count,installment_count)
 values(v_uid,v_fingerprint,v_claims,v_total,v_count,v_n) returning * into v_group;
 for v_item in select * from jsonb_to_recordset(v_items) as x(course_id uuid,title text,duration text,original_fee numeric,fee numeric,discount numeric,claim_id uuid,category text) loop
  insert into public.course_checkout_items(checkout_id,course_id,course_title,course_duration,original_fee,fee,discount_percent,legacy_claim_id,student_category)
  values(v_group.id,v_item.course_id,v_item.title,v_item.duration,v_item.original_fee,v_item.fee,v_item.discount,v_item.claim_id,v_item.category);
 end loop;
 select array_agg(round(fee*100)::bigint order by course_id),array_agg(course_id order by course_id) into v_balances,v_course_ids from public.course_checkout_items where checkout_id=v_group.id;
 v_total_cents:=round(v_total*100)::bigint;v_remaining:=v_total_cents;
 for v_period in 1..v_n loop
  v_due:=case when v_period=v_n then v_remaining else least(ceil(v_total_cents::numeric/v_n)::bigint,v_remaining) end;
  v_allocations:='{}';
  for v_index in 1..v_count loop v_allocations:=array_append(v_allocations,floor(v_balances[v_index]::numeric*v_due/v_remaining)::bigint);end loop;
  select (v_due-sum(a))::integer into v_left from unnest(v_allocations)a;
  for v_index in select k from generate_subscripts(v_balances,1)k order by mod(v_balances[k]::numeric*v_due,v_remaining) desc,k limit v_left loop
   v_allocations[v_index]:=v_allocations[v_index]+1;
  end loop;
  for v_index in 1..v_count loop
   update public.course_checkout_items set installment_amounts=array_append(installment_amounts,v_allocations[v_index]::numeric/100) where checkout_id=v_group.id and course_id=v_course_ids[v_index];
   v_balances[v_index]:=v_balances[v_index]-v_allocations[v_index];
  end loop;
  v_remaining:=v_remaining-v_due;
 end loop;
 return course_checkout_private.receipt(v_group.id);
end $$;

create or replace function course_checkout_private.submit(p_checkout_id uuid,p_amount numeric,p_payment_method text,p_payment_reference text,p_proof_path text,p_payment_option text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=course_checkout_private.student_uid();v_group public.course_checkouts%rowtype;
 v_student uuid;v_item public.course_checkout_items%rowtype;v_enrol public.enrollments%rowtype;v_due numeric;v_allocation numeric;v_reference text:=btrim(coalesce(p_payment_reference,''));
begin
 perform pg_advisory_xact_lock(hashtextextended('course-checkout:'||v_uid::text,0));
 select * into v_group from public.course_checkouts where id=p_checkout_id and student_user_id=v_uid for update;
 if v_group.id is null then raise exception 'This checkout does not belong to your account.' using errcode='42501'; end if;
 if v_group.status='submitted' then return course_checkout_private.receipt(v_group.id)||jsonb_build_object('already_submitted',true); end if;
 select id into v_student from public.students where user_id=v_uid;
 if v_student is null then raise exception 'Your student details must be saved before payment.'; end if;
 if p_payment_method is null or p_payment_method not in ('EFT / Bank Transfer','Bank Deposit') or length(v_reference) not between 2 and 80 then raise exception 'Please provide an approved payment method and valid bank reference.';end if;
 if p_payment_option is null or p_payment_option not in ('full_balance','next_instalment') then raise exception 'Please select full payment or the required instalment.';end if;
 if (select count(*) from public.course_checkout_items where checkout_id=v_group.id)<>v_group.course_count
 or (select sum(fee) from public.course_checkout_items where checkout_id=v_group.id)<>v_group.total_fee then
  raise exception 'The selected course fees could not be confirmed. Please contact Admissions before paying.';
 end if;
 select sum(case when p_payment_option='full_balance' then fee else installment_amounts[1] end) into v_due from public.course_checkout_items where checkout_id=v_group.id;
 if p_amount is null or p_amount<=0 or p_amount<>v_due then raise exception 'The combined payment must be exactly R%.',to_char(v_due,'FM999999990.00');end if;
 if p_proof_path is null or strpos(p_proof_path,v_uid::text||'/'||v_group.id::text||'-')<>1 or lower(p_proof_path)!~'[.](pdf|png|jpe?g)$' then raise exception 'Upload a PDF, JPG or PNG proof for this checkout from your own account.';end if;
 if not exists(select 1 from storage.objects o where o.bucket_id='payment-proofs' and o.name=p_proof_path and split_part(o.name,'/',1)=v_uid::text
  and case when coalesce(o.metadata->>'size','')~'^[0-9]+$' then (o.metadata->>'size')::numeric between 1 and 5242880 else false end) then
  raise exception 'The uploaded proof could not be verified or exceeds 5 MB. Please upload it again.';
 end if;
 if exists(select 1 from public.payments where proof_url=p_proof_path) then raise exception 'This proof of payment has already been submitted.';end if;
 for v_item in select * from public.course_checkout_items where checkout_id=v_group.id order by course_id loop
  if not exists(select 1 from public.courses c where c.id=v_item.course_id and c.is_active) then raise exception 'A selected course is no longer available. Please contact Admissions before paying.';end if;
  if course_checkout_private.claim_discount(v_item.course_id,v_item.legacy_claim_id)<>v_item.discount_percent then raise exception 'A course benefit changed. Please review your selected courses.';end if;
  select * into v_enrol from public.enrollments where student_id=v_uid and course_id=v_item.course_id for update;
  if v_enrol.id is not null and (v_enrol.submitted_at is not null or coalesce(v_enrol.enrollment_status,v_enrol.status,'pending')<>'pending' or (v_enrol.amount is not null and v_enrol.amount<>v_item.fee)) then raise exception 'The saved application for % must be reviewed before this combined payment.',v_item.course_title;end if;
  if v_enrol.id is null then
   insert into public.enrollments(student_id,course_id,amount,original_amount,discount_percent,student_category,legacy_claim_id,enrollment_status,status,approval_department,proof_url,submitted_at)
   values(v_uid,v_item.course_id,v_item.fee,v_item.original_fee,v_item.discount_percent,v_item.student_category,v_item.legacy_claim_id,'pending','pending','Admissions & Finance',p_proof_path,now()) returning * into v_enrol;
  else
   update public.enrollments set amount=v_item.fee,original_amount=v_item.original_fee,discount_percent=v_item.discount_percent,student_category=v_item.student_category,legacy_claim_id=v_item.legacy_claim_id,
   enrollment_status='pending',status='pending',approval_department='Admissions & Finance',proof_url=p_proof_path,submitted_at=now() where id=v_enrol.id returning * into v_enrol;
  end if;
  update public.course_checkout_items set enrolment_id=v_enrol.id where checkout_id=v_group.id and course_id=v_item.course_id;
  if v_item.legacy_claim_id is not null then
   update public.legacy_verification_claims set enrollment_id=v_enrol.id where id=v_item.legacy_claim_id and user_id=v_uid and course_id=v_item.course_id and (enrollment_id is null or enrollment_id=v_enrol.id);
   if not found then raise exception 'A previous-study claim is already linked to another application.';end if;
  end if;
 end loop;
 update public.course_checkouts set status='submitted',amount_paid=v_due,payment_option=p_payment_option,proof_path=p_proof_path,submitted_at=now() where id=v_group.id;
 perform set_config('funda.student_payment_rpc','on',true);
 for v_item in select * from public.course_checkout_items where checkout_id=v_group.id order by course_id loop
  v_allocation:=case when p_payment_option='full_balance' then v_item.fee else v_item.installment_amounts[1] end;
  if v_allocation>0 then
   insert into public.payments(student_id,enrolment_id,amount,payment_method,status,proof_url,notes,submitted_at,original_amount,discount_percent,student_category,legacy_claim_id,payment_reference,payment_option,installment_number,installment_count,submission_source,checkout_id)
   values(v_student,v_item.enrolment_id,v_allocation,p_payment_method,'submitted',p_proof_path,
    format('Combined payment %s: R%s for %s courses. This course allocation: R%s. Combined course fees: R%s. Payment option: %s.',left(v_group.id::text,8),to_char(v_due,'FM999999990.00'),v_group.course_count,to_char(v_allocation,'FM999999990.00'),to_char(v_group.total_fee,'FM999999990.00'),p_payment_option),
    now(),v_item.original_fee,v_item.discount_percent,v_item.student_category,v_item.legacy_claim_id,v_reference,p_payment_option,1,v_group.installment_count,'registration',v_group.id);
  end if;
 end loop;
 return course_checkout_private.receipt(v_group.id)||jsonb_build_object('already_submitted',false);
end $$;

revoke all on all functions in schema course_checkout_private from public,anon,authenticated;
grant execute on function course_checkout_private.prepare(uuid[],jsonb,uuid) to authenticated;
grant execute on function course_checkout_private.submit(uuid,numeric,text,text,text,text) to authenticated;
create or replace function public.prepare_course_checkout(p_course_ids uuid[],p_claim_ids jsonb default '{}',p_existing_checkout_id uuid default null)
 returns jsonb language sql security invoker set search_path='' as $$select course_checkout_private.prepare(p_course_ids,p_claim_ids,p_existing_checkout_id);$$;
create or replace function public.submit_course_checkout(p_checkout_id uuid,p_amount numeric,p_payment_method text,p_payment_reference text,p_proof_path text,p_payment_option text)
 returns jsonb language sql security invoker set search_path='' as $$select course_checkout_private.submit(p_checkout_id,p_amount,p_payment_method,p_payment_reference,p_proof_path,p_payment_option);$$;
revoke all on function public.prepare_course_checkout(uuid[],jsonb,uuid) from public,anon;
revoke all on function public.submit_course_checkout(uuid,numeric,text,text,text,text) from public,anon;
grant execute on function public.prepare_course_checkout(uuid[],jsonb,uuid) to authenticated;
grant execute on function public.submit_course_checkout(uuid,numeric,text,text,text,text) to authenticated;

-- A Student may supply evidence, but cannot supply their own approval metadata.
create or replace function public.protect_legacy_claim_review() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if current_user in ('postgres','service_role','supabase_admin') or public.is_admin() then return new;end if;
 if tg_op='INSERT' then
  if coalesce(new.verification_status,'pending')<>'pending' or new.reviewed_at is not null or new.reviewed_by is not null then
   raise exception 'Only Admissions may approve or decline previous-study evidence.' using errcode='42501';
  end if;
 elsif new.verification_status is distinct from old.verification_status or new.reviewed_at is distinct from old.reviewed_at or new.reviewed_by is distinct from old.reviewed_by then
  raise exception 'Only Admissions may approve or decline previous-study evidence.' using errcode='42501';
 end if;
 return new;
end $$;
do $$ begin
 if not exists(select 1 from pg_trigger where tgrelid='public.legacy_verification_claims'::regclass and tgname='protect_legacy_claim_review') then
  create trigger protect_legacy_claim_review before insert or update on public.legacy_verification_claims for each row execute function public.protect_legacy_claim_review();
 end if;
end $$;

-- Existing individual accounts remain byte-equivalent in values; only submitted checkout schedules override the plan.
create or replace view public.student_payment_accounts with (security_invoker=true) as
with individual_accounts as (WITH account_base AS (
         SELECT e.id AS enrolment_id,
            e.student_id AS student_auth_id,
            s.id AS student_record_id,
            e.course_id,
            c.title AS course_title,
            c.duration AS course_duration,
                CASE
                    WHEN lower(COALESCE(e.enrollment_status, ''::text)) = 'completed'::text OR lower(COALESCE(e.status, ''::text)) = 'completed'::text THEN 'completed'::text
                    ELSE COALESCE(e.enrollment_status, e.status, 'pending'::text)
                END AS enrollment_status,
            GREATEST(COALESCE(e.amount, c.price, 0::numeric), 0::numeric)::numeric(12,2) AS course_fee,
            funda_payment_installment_count(GREATEST(COALESCE(e.amount, c.price, 0::numeric), 0::numeric), c.duration) AS installment_count
           FROM enrollments e
             JOIN students s ON s.user_id = e.student_id
             JOIN courses c ON c.id = e.course_id
        ), payment_totals AS (
         SELECT p.enrolment_id,
            COALESCE(sum(p.amount) FILTER (WHERE p.status = 'verified'::text), 0::numeric)::numeric(12,2) AS verified_paid,
            COALESCE(sum(p.amount) FILTER (WHERE p.status = ANY (ARRAY['pending'::text, 'submitted'::text])), 0::numeric)::numeric(12,2) AS submitted_amount,
            COALESCE(sum(p.amount) FILTER (WHERE p.status = 'rejected'::text), 0::numeric)::numeric(12,2) AS rejected_amount,
            count(*) FILTER (WHERE p.status = ANY (ARRAY['pending'::text, 'submitted'::text])) > 0 AS has_payment_under_review,
            max(COALESCE(p.submitted_at, p.created_at)) AS last_payment_at
           FROM payments p
          WHERE p.enrolment_id IS NOT NULL
          GROUP BY p.enrolment_id
        ), money_cents AS (
         SELECT b.enrolment_id,
            b.student_auth_id,
            b.student_record_id,
            b.course_id,
            b.course_title,
            b.course_duration,
            b.enrollment_status,
            b.course_fee,
            b.installment_count,
            COALESCE(t.verified_paid, 0::numeric)::numeric(12,2) AS verified_paid,
            COALESCE(t.submitted_amount, 0::numeric)::numeric(12,2) AS submitted_amount,
            COALESCE(t.rejected_amount, 0::numeric)::numeric(12,2) AS rejected_amount,
            COALESCE(t.has_payment_under_review, false) AS has_payment_under_review,
            t.last_payment_at,
            round(b.course_fee * 100::numeric)::bigint AS fee_cents,
            LEAST(round(b.course_fee * 100::numeric)::bigint, GREATEST(round(COALESCE(t.verified_paid, 0::numeric) * 100::numeric)::bigint, 0::bigint)) AS paid_cents,
            GREATEST(1::bigint, ceil(round(b.course_fee * 100::numeric) / GREATEST(b.installment_count, 1)::numeric)::bigint) AS base_installment_cents
           FROM account_base b
             LEFT JOIN payment_totals t ON t.enrolment_id = b.enrolment_id
        ), schedule AS (
         SELECT m.enrolment_id,
            m.student_auth_id,
            m.student_record_id,
            m.course_id,
            m.course_title,
            m.course_duration,
            m.enrollment_status,
            m.course_fee,
            m.installment_count,
            m.verified_paid,
            m.submitted_amount,
            m.rejected_amount,
            m.has_payment_under_review,
            m.last_payment_at,
            m.fee_cents,
            m.paid_cents,
            m.base_installment_cents,
            GREATEST(m.fee_cents - m.paid_cents, 0::bigint) AS outstanding_cents,
                CASE
                    WHEN m.fee_cents <= m.paid_cents THEN m.installment_count
                    ELSE LEAST(m.installment_count, (m.paid_cents / m.base_installment_cents + 1)::integer)
                END AS next_installment_number
           FROM money_cents m
        )
 SELECT enrolment_id,
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
    (outstanding_cents::numeric / 100::numeric)::numeric(12,2) AS outstanding_amount,
        CASE
            WHEN outstanding_cents = 0 THEN 0::numeric(12,2)
            ELSE (LEAST(outstanding_cents, GREATEST(LEAST(fee_cents, next_installment_number::bigint * base_installment_cents) - paid_cents, 0::bigint))::numeric / 100::numeric)::numeric(12,2)
        END AS next_required_amount,
    next_installment_number,
    has_payment_under_review,
    last_payment_at
   FROM schedule)
select b.enrolment_id,b.student_auth_id,b.student_record_id,b.course_id,b.course_title,b.course_duration,b.enrollment_status,b.course_fee,
 coalesce(c.installment_count,b.installment_count) as installment_count,b.verified_paid,b.submitted_amount,b.rejected_amount,b.outstanding_amount,
 case when c.id is null then b.next_required_amount when b.outstanding_amount<=0 then 0::numeric(12,2)
 else least(b.outstanding_amount,greatest(coalesce(n.target,i.fee)-b.verified_paid,0))::numeric(12,2) end as next_required_amount,
 case when c.id is null then b.next_installment_number else coalesce(n.k,c.installment_count) end as next_installment_number,
 b.has_payment_under_review,b.last_payment_at
from individual_accounts b
left join public.course_checkout_items i on i.enrolment_id=b.enrolment_id
left join public.course_checkouts c on c.id=i.checkout_id and c.status='submitted'
left join lateral (select x.k,t.target from generate_subscripts(i.installment_amounts,1) x(k)
 cross join lateral(select sum(v) as target from unnest(i.installment_amounts[1:x.k])v)t
 where t.target>b.verified_paid order by x.k limit 1)n on c.id is not null;

-- The new receipt link is a protected payment source detail, like its amount and proof.
CREATE OR REPLACE FUNCTION public.guard_finance_payment_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
     or new.submission_source is distinct from old.submission_source
     or new.checkout_id is distinct from old.checkout_id then
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
$function$
;
notify pgrst, 'reload schema';
