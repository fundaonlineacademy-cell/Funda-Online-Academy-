-- Funda Online Academy
-- Owner-approved payment-plan alignment — 1 October 2026
--
-- Approved rule:
--   * Below R1,000: full payment only.
--   * R1,000 or more: 2 instalments.
--   * R2,000 or more AND at least 8 weeks: 3 instalments.
--   * Learners who qualify for instalments may still pay the full balance upfront.
--
-- The payable enrolment amount remains the fee basis so approved returning/legacy
-- discounts continue to work with the same payment-plan engine.

begin;

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
      case
        when pg_catalog.lower(coalesce(p_duration, '')) like '%month%' then 4.345
        else 1
      end as weeks
    from duration_parts
  )
  select case
    when greatest(coalesce(p_fee, 0), 0) < 1000 then 1
    when greatest(coalesce(p_fee, 0), 0) >= 2000
      and (select weeks from duration_weeks) >= 8 then 3
    else 2
  end;
$function$;

revoke all on function public.funda_payment_installment_count(numeric, text) from public, anon;
grant execute on function public.funda_payment_installment_count(numeric, text) to authenticated, service_role;

comment on function public.funda_payment_installment_count(numeric, text)
is 'FOA owner-approved payment plan policy 2026-10-01: below R1000 full payment; R1000+ two instalments; R2000+ and 8+ weeks three instalments.';

commit;
