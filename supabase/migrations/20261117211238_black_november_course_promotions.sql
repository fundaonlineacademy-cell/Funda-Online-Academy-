-- Campaign-only promotions; catalogue prices and Ambassador membership remain intact.
create schema if not exists course_promotion_private;
revoke all on schema course_promotion_private from public;
grant usage on schema course_promotion_private to anon,authenticated;
create table if not exists course_promotion_private.campaigns (
 id uuid primary key default gen_random_uuid(),slug text not null unique,name text not null,
 discount_percent numeric not null check(discount_percent>0 and discount_percent<100),
 starts_at timestamptz not null,ends_at timestamptz not null check(ends_at>starts_at),
 status text not null default 'draft' check(status in ('draft','active','paused','finished')),
 created_at timestamptz not null default now()
);
create table if not exists course_promotion_private.promoters (
 id uuid primary key default gen_random_uuid(),full_name text not null,
 email text not null unique check(email=lower(btrim(email)) and email like '%@%'),
 commission_rate numeric not null check(commission_rate>0 and commission_rate<1),
 status text not null default 'approved' check(status in ('approved','inactive')),
 created_at timestamptz not null default now()
);
create table if not exists course_promotion_private.codes (
 code text primary key check(code=upper(btrim(code)) and code ~ '^[A-Z0-9]{4,32}$'),
 campaign_id uuid not null references course_promotion_private.campaigns(id),
 promoter_id uuid references course_promotion_private.promoters(id),enabled boolean not null default false
);
create table if not exists course_promotion_private.payouts (
 id uuid primary key default gen_random_uuid(),promoter_id uuid not null references course_promotion_private.promoters(id),
 amount numeric(12,2) not null check(amount>0),payment_reference text not null unique,
 payment_date date not null,recorded_by uuid not null references public.profiles(id),created_at timestamptz not null default now()
);
create index if not exists promotion_codes_campaign_idx on course_promotion_private.codes(campaign_id);
create index if not exists promotion_codes_promoter_idx on course_promotion_private.codes(promoter_id) where promoter_id is not null;
create index if not exists promotion_payouts_promoter_idx on course_promotion_private.payouts(promoter_id);
create index if not exists promotion_payouts_actor_idx on course_promotion_private.payouts(recorded_by);
alter table course_promotion_private.campaigns enable row level security;
alter table course_promotion_private.promoters enable row level security;
alter table course_promotion_private.codes enable row level security;
alter table course_promotion_private.payouts enable row level security;
revoke all on all tables in schema course_promotion_private from public,anon,authenticated;
alter table public.course_checkouts
 add column if not exists promotion_code text references course_promotion_private.codes(code),add column if not exists promotion_name text,
 add column if not exists promotion_discount_percent numeric check(promotion_discount_percent between 0 and 100),
 add column if not exists promotion_expires_at timestamptz,
 add column if not exists promotion_promoter_id uuid references course_promotion_private.promoters(id),
 add column if not exists promotion_commission_rate numeric not null default 0 check(promotion_commission_rate between 0 and 1);
create index if not exists course_checkouts_promotion_promoter_idx on public.course_checkouts(promotion_promoter_id) where promotion_promoter_id is not null;
create index if not exists course_checkouts_promotion_code_idx on public.course_checkouts(promotion_code) where promotion_code is not null;
alter table public.students add column if not exists heard_about_promotion_promoter_id uuid references course_promotion_private.promoters(id);
create index if not exists students_promotion_promoter_idx on public.students(heard_about_promotion_promoter_id) where heard_about_promotion_promoter_id is not null;

create or replace function course_promotion_private.offer(p_code text default null) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('name',c.name,'code',pc.code,'discount_percent',c.discount_percent,
  'starts_at',c.starts_at,'ends_at',c.ends_at,'promoter_name',p.full_name)
 from course_promotion_private.codes pc join course_promotion_private.campaigns c on c.id=pc.campaign_id
 left join course_promotion_private.promoters p on p.id=pc.promoter_id
 where pc.enabled and c.status='active' and now()>=c.starts_at and now()<c.ends_at
  and (pc.promoter_id is null or p.status='approved')
  and case when nullif(btrim(p_code),'') is null then pc.promoter_id is null else pc.code=upper(btrim(p_code)) end
 order by c.ends_at,pc.code limit 1;
$$;
create or replace function course_promotion_private.check_promoter(p_code text) returns void
language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=course_checkout_private.student_uid();v_email text;v_promoter uuid;
begin
 select p.id,p.email into v_promoter,v_email from course_promotion_private.codes c
 join course_promotion_private.promoters p on p.id=c.promoter_id where c.code=p_code;
 if v_promoter is null then return;end if;
 if exists(select 1 from auth.users u where u.id=v_uid and lower(u.email)=v_email) then
  raise exception 'You cannot use your own influencer code. Use BLACKNOV30 for the general promotion.';
 end if;
 if exists(select 1 from public.ambassador_v2_referrals r join public.ambassador_programme_applications a on a.id=r.application_id
  where r.student_user_id=v_uid and lower(a.email) is distinct from v_email) then
  raise exception 'Your account is already linked to another ambassador. Use BLACKNOV30 for the same student discount.';
 end if;
end $$;
create or replace function course_promotion_private.validate_checkout(p_checkout_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=course_checkout_private.student_uid();v_group public.course_checkouts%rowtype;v_offer jsonb;
begin
 select * into v_group from public.course_checkouts where id=p_checkout_id and student_user_id=v_uid;
 if v_group.id is null then raise exception 'This checkout does not belong to your account.' using errcode='42501';end if;
 if v_group.promotion_code is null then return;end if;
 if exists(select 1 from public.course_checkout_items i join public.legacy_verification_claims l
  on l.course_id=i.course_id and l.user_id=v_uid where i.checkout_id=v_group.id
  and l.verification_status in ('pending','approved') and l.discount_percent>0) then
  raise exception 'A previous-study benefit is already selected. Promotions cannot be combined with it.';
 end if;
 v_offer:=course_promotion_private.offer(v_group.promotion_code);
 if v_offer is null then raise exception 'This promotion has expired or is unavailable. Remove the code and confirm the normal course fees before paying.';end if;
 if (v_offer->>'discount_percent')::numeric<>v_group.promotion_discount_percent then
  raise exception 'This promotion changed. Please remove and apply the code again.';
 end if;
 if exists(select 1 from public.course_checkout_items i where i.checkout_id=v_group.id
  and (i.legacy_claim_id is not null or i.discount_percent<>v_group.promotion_discount_percent
   or i.fee<>round(i.original_fee*(1-v_group.promotion_discount_percent/100),2))) then
  raise exception 'The promotion must be applied once to the normal course fees. Previous-study benefits cannot be combined with it.';
 end if;
 perform course_promotion_private.check_promoter(v_group.promotion_code);
end $$;

create or replace function course_promotion_private.prepare(p_course_ids uuid[],p_code text,p_existing_checkout_id uuid,p_additional boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=course_checkout_private.student_uid();v_ids uuid[];v_fingerprint text;v_offer jsonb;
 v_code text:=upper(btrim(p_code));v_group public.course_checkouts%rowtype;v_course record;v_old public.enrollments%rowtype;
 v_fee numeric;v_total numeric:=0;v_items jsonb:='[]';v_count integer;v_n integer;v_item record;
 v_promoter uuid;v_rate numeric:=0;v_balances bigint[];v_allocations bigint[];v_due bigint;v_remaining bigint;
 v_total_cents bigint;v_index integer;v_period integer;v_left integer;v_course_ids uuid[];
begin
 if coalesce(cardinality(p_course_ids),0) not between 1 and 100 or coalesce(array_ndims(p_course_ids),0)<>1 or array_position(p_course_ids,null) is not null then
  raise exception 'Please select valid courses before applying a promo code.';
 end if;
 if v_code is null or v_code !~ '^[A-Z0-9]{4,32}$' then raise exception 'Enter a valid promo code.';end if;
 v_offer:=course_promotion_private.offer(v_code);
 if v_offer is null then raise exception 'This promo code is invalid, expired or unavailable.';end if;
 perform course_promotion_private.check_promoter(v_code);
 if p_additional and not exists(select 1 from public.enrollments e where e.student_id=v_uid
  and (e.submitted_at is not null or lower(coalesce(e.enrollment_status,e.status,'')) in ('approved','active','enrolled','completed'))) then
  raise exception 'Submit your first course application before applying for additional courses.' using errcode='42501';
 end if;
 select array_agg(distinct id order by id) into v_ids from unnest(p_course_ids) id;
 select pc.promoter_id,coalesce(p.commission_rate,0) into v_promoter,v_rate from course_promotion_private.codes pc
 left join course_promotion_private.promoters p on p.id=pc.promoter_id where pc.code=v_code;
 v_fingerprint:=md5(jsonb_build_object('courses',v_ids,'promotion',v_code,'additional',p_additional,
  'percent',v_offer->'discount_percent','commission',v_rate)::text);
 perform pg_advisory_xact_lock(hashtextextended('course-checkout:'||v_uid::text,0));
 if p_existing_checkout_id is not null then select * into v_group from public.course_checkouts
  where id=p_existing_checkout_id and student_user_id=v_uid and request_fingerprint=v_fingerprint;end if;
 if v_group.id is null then select * into v_group from public.course_checkouts
  where student_user_id=v_uid and request_fingerprint=v_fingerprint and status='draft' order by created_at desc limit 1;end if;
 if v_group.id is not null then
  if v_group.status='draft' then perform course_promotion_private.validate_checkout(v_group.id);end if;
  return course_checkout_private.receipt(v_group.id);
 end if;
 select count(*) into v_count from public.courses c where c.id=any(v_ids) and c.active;
 if v_count<>array_length(v_ids,1) then raise exception 'One of the selected courses is no longer available.';end if;
 for v_course in select * from public.courses c where c.id=any(v_ids) order by c.id loop
  if exists(select 1 from public.legacy_verification_claims l where l.user_id=v_uid and l.course_id=v_course.id
   and l.verification_status in ('pending','approved') and l.discount_percent>0) then
   raise exception 'A previous-study benefit is already selected for %. Promotions cannot be combined with it.',v_course.title;
  end if;
  v_fee:=round(v_course.price*(1-(v_offer->>'discount_percent')::numeric/100),2);
  if v_fee is null or v_fee<=0 or v_fee::text in ('NaN','Infinity','-Infinity') then raise exception 'This course fee could not be confirmed.';end if;
  select * into v_old from public.enrollments where student_id=v_uid and course_id=v_course.id;
  if v_old.id is not null and (v_old.submitted_at is not null or coalesce(v_old.enrollment_status,v_old.status,'pending')<>'pending'
   or (v_old.amount is not null and v_old.amount<>v_fee)) then
   raise exception 'An application already exists for %. Please contact Admissions before applying this promotion.',v_course.title;
  end if;
  v_total:=v_total+v_fee;
  v_items:=v_items||jsonb_build_array(jsonb_build_object('course_id',v_course.id,'title',v_course.title,
   'duration',v_course.duration,'original_fee',v_course.price,'fee',v_fee));
 end loop;
 select max(public.funda_payment_installment_count(v_total,x->>'duration')) into v_n from jsonb_array_elements(v_items)x;
 insert into public.course_checkouts(student_user_id,request_fingerprint,claim_ids,total_fee,course_count,installment_count,
  promotion_code,promotion_name,promotion_discount_percent,promotion_expires_at,promotion_promoter_id,promotion_commission_rate)
 values(v_uid,v_fingerprint,'{}',v_total,v_count,v_n,v_code,v_offer->>'name',(v_offer->>'discount_percent')::numeric,(v_offer->>'ends_at')::timestamptz,v_promoter,v_rate)
 returning * into v_group;
 for v_item in select * from jsonb_to_recordset(v_items) as x(course_id uuid,title text,duration text,original_fee numeric,fee numeric) loop
  insert into public.course_checkout_items(checkout_id,course_id,course_title,course_duration,original_fee,fee,discount_percent,student_category)
  values(v_group.id,v_item.course_id,v_item.title,v_item.duration,v_item.original_fee,v_item.fee,
   v_group.promotion_discount_percent,case when p_additional then 'continuing_student' else 'first_time' end);
 end loop;
 select array_agg(round(fee*100)::bigint order by course_id),array_agg(course_id order by course_id)
 into v_balances,v_course_ids from public.course_checkout_items where checkout_id=v_group.id;
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
   update public.course_checkout_items set installment_amounts=array_append(installment_amounts,v_allocations[v_index]::numeric/100)
    where checkout_id=v_group.id and course_id=v_course_ids[v_index];
   v_balances[v_index]:=v_balances[v_index]-v_allocations[v_index];
  end loop;
  v_remaining:=v_remaining-v_due;
 end loop;
 return course_checkout_private.receipt(v_group.id);
end $$;

-- Earn only on current approved enrolments and canonical verified receipts, including later instalments.
create or replace view course_promotion_private.verified_commissions with (security_invoker=true) as
with eligible as (
 select pay.id as payment_id,pay.enrolment_id,pay.amount,e.amount as course_fee,pay.verified_at,
  s.user_id,c.promotion_promoter_id as promoter_id,c.promotion_code as code,c.promotion_commission_rate as rate,i.course_title,
  sum(pay.amount) over(partition by pay.enrolment_id order by pay.verified_at,pay.id) as running_paid
 from public.payments pay join public.students s on s.id=pay.student_id
 join public.enrollments e on e.id=pay.enrolment_id and e.student_id=s.user_id
 join public.course_checkout_items i on i.enrolment_id=e.id
 join public.course_checkouts c on c.id=i.checkout_id and c.status='submitted' and c.student_user_id=s.user_id
 join public.profiles pr on pr.id=pay.verified_by and pr.role='admin'
 join public.profiles er on er.id=e.reviewed_by and er.role='admin'
 where c.promotion_promoter_id is not null and c.promotion_commission_rate>0
  and public.ambassador_v2_student_account_is_active(s.user_id)
  and lower(coalesce(pay.status,''))='verified' and pay.verified_at is not null and pay.amount>0
  and lower(coalesce(e.enrollment_status,e.status,''))='approved' and e.reviewed_at is not null
)
select payment_id,enrolment_id,user_id,promoter_id,code,course_title,verified_at,rate,
 least(course_fee,running_paid)-least(course_fee,running_paid-amount) as qualifying_revenue,
 round(least(course_fee,running_paid)*rate,2)-round(least(course_fee,running_paid-amount)*rate,2) as commission_amount
from eligible;
revoke all on course_promotion_private.verified_commissions from public,anon,authenticated;

create or replace function course_promotion_private.admin_report() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not (public.is_admin() or public.has_department_access('Finance & Accounting','read')) then
  raise exception 'Finance access is required.' using errcode='42501';end if;
 return jsonb_build_object(
  'campaigns',(select coalesce(jsonb_agg(to_jsonb(c)),'[]') from course_promotion_private.campaigns c),
  'promoters',(select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.full_name,'email',p.email,'rate',p.commission_rate,
   'codes',(select coalesce(jsonb_agg(pc.code),'[]') from course_promotion_private.codes pc where pc.promoter_id=p.id),
   'students',(select count(distinct c.student_user_id) from public.course_checkouts c where c.promotion_promoter_id=p.id and c.status='submitted'),
   'verified_revenue',(select coalesce(sum(v.qualifying_revenue),0) from course_promotion_private.verified_commissions v where v.promoter_id=p.id),
   'commission',(select coalesce(sum(v.commission_amount),0) from course_promotion_private.verified_commissions v where v.promoter_id=p.id),
   'paid',(select coalesce(sum(x.amount),0) from course_promotion_private.payouts x where x.promoter_id=p.id)
  )),'[]') from course_promotion_private.promoters p),
  'payments',(select coalesce(jsonb_agg(to_jsonb(v)),'[]') from (select * from course_promotion_private.verified_commissions order by verified_at desc limit 500)v),
  'payouts',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from (select * from course_promotion_private.payouts order by created_at desc limit 200)x),
  'can_record_payout',public.is_admin());
end $$;
create or replace function course_promotion_private.record_payout(p_promoter_id uuid,p_amount numeric,p_reference text,p_payment_date date)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_earned numeric;v_paid numeric;v_id uuid;
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Administrator payout authority is required.' using errcode='42501';end if;
 if p_amount is null or p_amount<=0 or p_amount<>round(p_amount,2) or p_amount::text in ('NaN','Infinity','-Infinity')
  or length(btrim(coalesce(p_reference,''))) not between 5 and 100 or p_payment_date is null
  or p_payment_date>(now() at time zone 'Africa/Johannesburg')::date then raise exception 'Enter a valid completed EFT amount, date and unique payment reference.';end if;
 perform pg_advisory_xact_lock(hashtextextended('promotion-payout:'||p_promoter_id::text,0));
 if not exists(select 1 from course_promotion_private.promoters where id=p_promoter_id) then raise exception 'Unknown promoter.';end if;
 select coalesce(sum(commission_amount),0) into v_earned from course_promotion_private.verified_commissions where promoter_id=p_promoter_id;
 select coalesce(sum(amount),0) into v_paid from course_promotion_private.payouts where promoter_id=p_promoter_id;
 if p_amount>v_earned-v_paid then raise exception 'The payout exceeds the current verified unpaid commission. Review refunds and earlier payouts.';end if;
 insert into course_promotion_private.payouts(promoter_id,amount,payment_reference,payment_date,recorded_by)
 values(p_promoter_id,p_amount,btrim(p_reference),p_payment_date,auth.uid()) returning id into v_id;
 return v_id;
end $$;
create or replace function course_promotion_private.save_promoter_choice(p_promoter_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=course_checkout_private.student_uid();v_code text;
begin
 select pc.code into v_code from course_promotion_private.codes pc where pc.promoter_id=p_promoter_id
  and course_promotion_private.offer(pc.code) is not null order by pc.code limit 1;
 if v_code is null then raise exception 'This influencer promotion is no longer available. Please refresh the list.';end if;
 perform course_promotion_private.check_promoter(v_code);
 update public.students set heard_about_promotion_promoter_id=p_promoter_id,heard_about_ambassador_id=null,
  where_heard_about_us='Influencer / Brand Ambassador',updated_at=now() where user_id=v_uid;
 if not found then raise exception 'Please save your student details before choosing this influencer.';end if;
 return jsonb_build_object('selected_id',p_promoter_id,'linked_id',null,'promo_code',v_code);
end $$;

create or replace function public.get_course_promotion_offer(p_code text default null) returns jsonb
language sql stable security invoker set search_path='' as $$select course_promotion_private.offer(p_code);$$;
create or replace function public.prepare_promotion_course_checkout(p_course_ids uuid[],p_promo_code text,p_existing_checkout_id uuid default null,p_additional boolean default false)
returns jsonb language sql security invoker set search_path='' as $$select course_promotion_private.prepare(p_course_ids,p_promo_code,p_existing_checkout_id,p_additional);$$;
create or replace function public.get_course_promotion_report() returns jsonb
language sql stable security invoker set search_path='' as $$select course_promotion_private.admin_report();$$;
create or replace function public.record_course_promotion_payout(p_promoter_id uuid,p_amount numeric,p_reference text,p_payment_date date) returns uuid
language sql security invoker set search_path='' as $$select course_promotion_private.record_payout(p_promoter_id,p_amount,p_reference,p_payment_date);$$;
revoke all on all functions in schema course_promotion_private from public,anon,authenticated;
grant execute on function course_promotion_private.offer(text) to anon,authenticated;
grant execute on function course_promotion_private.prepare(uuid[],text,uuid,boolean),course_promotion_private.admin_report(),
 course_promotion_private.record_payout(uuid,numeric,text,date) to authenticated;
revoke all on function public.get_course_promotion_offer(text),public.prepare_promotion_course_checkout(uuid[],text,uuid,boolean),
 public.get_course_promotion_report(),public.record_course_promotion_payout(uuid,numeric,text,date) from public,anon,authenticated;
grant execute on function public.get_course_promotion_offer(text) to anon,authenticated;
grant execute on function public.prepare_promotion_course_checkout(uuid[],text,uuid,boolean),public.get_course_promotion_report(),
 public.record_course_promotion_payout(uuid,numeric,text,date) to authenticated;
notify pgrst,'reload schema';

-- Narrow integrations with the inspected production functions.
CREATE OR REPLACE FUNCTION course_checkout_private.receipt(p_checkout_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 select jsonb_build_object('id',c.id,'status',c.status,'total_fee',c.total_fee,'course_count',c.course_count,
 'installment_count',c.installment_count,'amount_paid',c.amount_paid,
 'promotion',case when c.promotion_code is null then null else jsonb_build_object('code',c.promotion_code,'name',c.promotion_name,'discount_percent',c.promotion_discount_percent,'ends_at',c.promotion_expires_at) end,
 'items',(select jsonb_agg(jsonb_build_object('course_id',i.course_id,'title',i.course_title,'duration',i.course_duration,
 'fee',i.fee,'original_fee',i.original_fee,'discount_percent',i.discount_percent,'claim_id',i.legacy_claim_id,
 'installment_amounts',i.installment_amounts,'enrolment_id',i.enrolment_id) order by i.course_id) from public.course_checkout_items i where i.checkout_id=c.id),
 'enrolment_ids',(select jsonb_agg(i.enrolment_id order by i.course_id) from public.course_checkout_items i where i.checkout_id=c.id and i.enrolment_id is not null))
 from public.course_checkouts c where c.id=p_checkout_id and c.student_user_id=auth.uid();
$function$;

CREATE OR REPLACE FUNCTION course_checkout_private.submit(p_checkout_id uuid, p_amount numeric, p_payment_method text, p_payment_reference text, p_proof_path text, p_payment_option text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_uid uuid:=course_checkout_private.student_uid();v_group public.course_checkouts%rowtype;
 v_student uuid;v_item public.course_checkout_items%rowtype;v_enrol public.enrollments%rowtype;v_due numeric;v_allocation numeric;v_reference text:=btrim(coalesce(p_payment_reference,''));
begin
 perform pg_advisory_xact_lock(hashtextextended('course-checkout:'||v_uid::text,0));
 select * into v_group from public.course_checkouts where id=p_checkout_id and student_user_id=v_uid for update;
 if v_group.id is null then raise exception 'This checkout does not belong to your account.' using errcode='42501'; end if;
 if v_group.status='submitted' then return course_checkout_private.receipt(v_group.id)||jsonb_build_object('already_submitted',true); end if;
 if v_group.promotion_code is not null then perform course_promotion_private.validate_checkout(v_group.id);end if;
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
  if not exists(select 1 from public.courses c where c.id=v_item.course_id and c.active) then raise exception 'A selected course is no longer available. Please contact Admissions before paying.';end if;
  if (case when v_group.promotion_code is not null then v_group.promotion_discount_percent else course_checkout_private.claim_discount(v_item.course_id,v_item.legacy_claim_id) end)<>v_item.discount_percent then raise exception 'A course benefit changed. Please review your selected courses.';end if;
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
end $function$;

CREATE OR REPLACE FUNCTION public.ambassador_v2_payment_is_eligible(p_payment_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
       and not exists(select 1 from public.course_checkout_items pci join public.course_checkouts pc on pc.id=pci.checkout_id where pci.enrolment_id=pay.enrolment_id and pc.promotion_promoter_id is not null)
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

CREATE OR REPLACE FUNCTION onboarding_referral_private.directory()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := auth.uid();
  v_directory jsonb;
  v_linked jsonb;
  v_selected uuid;
begin
  if v_uid is null or not public.ambassador_v2_student_account_is_active(v_uid) then
    raise exception 'Please sign in with your student account.' using errcode = '42501';
  end if;

  select jsonb_agg(jsonb_build_object(
    'id', a.id, 'name', left(a.full_name,160),
    'handles', coalesce((select jsonb_agg(jsonb_build_object(
      'platform',left(btrim(p.item->>'platform'),40),
      'handle',left(btrim(p.item->>'handle'),120)) order by p.ord)
      from jsonb_array_elements(case when jsonb_typeof(a.platforms)='array' then a.platforms else '[]'::jsonb end)
        with ordinality as p(item,ord)
      where nullif(btrim(p.item->>'handle'),'') is not null),'[]'::jsonb)
    ) order by lower(a.full_name),a.id) into v_directory
  from public.ambassador_programme_applications a
  where a.status='approved'
    and coalesce(a.account_status,'application') not in ('suspended','closed','deleted')
    and not exists(select 1 from public.ceo_account_control_state c where c.user_id=a.auth_user_id and c.status='deleted')
    and not exists(select 1 from auth.users u where u.id=a.auth_user_id and u.deleted_at is not null);

  -- Only this caller's permanent attribution may appear outside the approved directory.
  select jsonb_build_object('id',a.id,'name',left(a.full_name,160),
    'handles',coalesce((select jsonb_agg(jsonb_build_object(
      'platform',left(btrim(p.item->>'platform'),40),'handle',left(btrim(p.item->>'handle'),120)) order by p.ord)
      from jsonb_array_elements(case when jsonb_typeof(a.platforms)='array' then a.platforms else '[]'::jsonb end)
        with ordinality as p(item,ord)
      where nullif(btrim(p.item->>'handle'),'') is not null),'[]'::jsonb)) into v_linked
  from public.ambassador_v2_referrals r
  join public.ambassador_programme_applications a on a.id=r.application_id
  where r.student_user_id=v_uid;

  select coalesce(s.heard_about_promotion_promoter_id,s.heard_about_ambassador_id) into v_selected from public.students s where s.user_id=v_uid;
  v_directory:=coalesce(v_directory,'[]'::jsonb)||coalesce((
    select jsonb_agg(jsonb_build_object('id',p.id,'name',left(p.full_name,160),'kind','campaign','promo_code',pc.code,
      'handles',jsonb_build_array(jsonb_build_object('platform','Campaign','handle',pc.code))))
    from course_promotion_private.promoters p join course_promotion_private.codes pc on pc.promoter_id=p.id
    where p.status='approved' and course_promotion_private.offer(pc.code) is not null),'[]'::jsonb);
  return jsonb_build_object('ambassadors',coalesce(v_directory,'[]'::jsonb),'selected_id',v_selected,'linked',v_linked);
end;
$function$;

CREATE OR REPLACE FUNCTION onboarding_referral_private.save_choice(p_application_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := auth.uid();
  v_student_id uuid;
  v_existing uuid;
  v_app public.ambassador_programme_applications%rowtype;
  v_email text;
begin
  if exists(select 1 from course_promotion_private.promoters p where p.id=p_application_id) then
    return course_promotion_private.save_promoter_choice(p_application_id);
  end if;
  if v_uid is null or not public.ambassador_v2_student_account_is_active(v_uid) then
    raise exception 'Please sign in with your student account.' using errcode = '42501';
  end if;
  select s.id into v_student_id from public.students s where s.user_id=v_uid for update;
  if v_student_id is null then raise exception 'Your student record could not be found.'; end if;
  select r.application_id into v_existing from public.ambassador_v2_referrals r where r.student_user_id=v_uid;
  if v_existing is not null and p_application_id is distinct from v_existing then
    raise exception 'Your account is already linked to an ambassador. Please refresh the ambassador list.';
  end if;
  if p_application_id is null then raise exception 'Please select the ambassador / influencer who referred you.'; end if;

  select * into v_app from public.ambassador_programme_applications a where a.id=p_application_id for share;
  if v_app.id is null then raise exception 'Please select an approved ambassador / influencer from the list.'; end if;
  if v_existing is null and (v_app.status is distinct from 'approved'
    or coalesce(v_app.account_status,'application') in ('suspended','closed','deleted')
    or exists(select 1 from public.ceo_account_control_state c where c.user_id=v_app.auth_user_id and c.status='deleted')
    or exists(select 1 from auth.users u where u.id=v_app.auth_user_id and u.deleted_at is not null)) then
    raise exception 'This ambassador is no longer available. Please refresh the list and select again.';
  end if;
  select lower(u.email) into v_email from auth.users u where u.id=v_uid;
  if v_app.auth_user_id=v_uid or (nullif(lower(btrim(v_app.email)),'') is not null and lower(btrim(v_app.email))=v_email) then
    raise exception 'You cannot select yourself as your ambassador / influencer.';
  end if;

  -- No retroactive claiming of established learners or payments. No account-age extension
  -- is made to automatic/cached referral-link claims; this is an explicit first-application choice.
  if v_existing is null
    and not exists(select 1 from public.enrollments e where e.student_id=v_uid)
    and not exists(select 1 from public.payments p where p.student_id=v_student_id)
    and not exists(select 1 from public.legacy_verification_claims l where l.user_id=v_uid) then
    insert into public.ambassador_v2_referrals(application_id,student_user_id,referral_code,source_page,eligibility_status)
    values(v_app.id,v_uid,coalesce(v_app.referral_code,''),'onboarding-approved-ambassador-choice','recorded')
    on conflict(student_user_id) do nothing;
    select r.application_id into v_existing from public.ambassador_v2_referrals r where r.student_user_id=v_uid;
    if v_existing is distinct from p_application_id then
      raise exception 'Your account is already linked to an ambassador. Please refresh the ambassador list.';
    end if;
  end if;

  update public.students set heard_about_ambassador_id=p_application_id,
    where_heard_about_us='Influencer / Brand Ambassador' where id=v_student_id and user_id=v_uid;
  return jsonb_build_object('selected_id',p_application_id,'linked_id',v_existing,
    'status',case when v_existing is null then 'source_recorded' else 'referral_recorded' end);
end;
$function$;
