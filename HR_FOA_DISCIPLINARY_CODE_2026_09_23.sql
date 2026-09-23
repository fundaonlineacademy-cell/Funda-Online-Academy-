-- Funda Online Academy — Staff Disciplinary Code & Progressive Sanction Guide
-- 2026-09-23
-- Adds FOA's own written code inside the existing Staff Disciplinary & Conduct workspace.
-- The code is guidance, not an automatic tariff. Each case remains fact-specific and fair-process controlled.

create table if not exists public.hr_disciplinary_code_versions (
  id uuid primary key default gen_random_uuid(),
  code_reference text not null unique,
  version_label text not null,
  title text not null,
  effective_date date,
  status text not null default 'draft'
    check (status in ('draft','active','superseded')),
  purpose text not null,
  small_business_statement text not null,
  legal_basis text not null,
  employee_notice text not null,
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_disciplinary_sanction_guide (
  id uuid primary key default gen_random_uuid(),
  code_version_id uuid not null references public.hr_disciplinary_code_versions(id) on delete restrict,
  offence_code text not null,
  category text not null,
  misconduct_example text not null,
  first_occurrence_guidance text not null,
  repeated_occurrence_guidance text not null,
  serious_case_guidance text not null,
  important_note text,
  related_rule_code text,
  sort_order integer not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(code_version_id,offence_code)
);

create table if not exists public.hr_disciplinary_code_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  code_version_id uuid not null references public.hr_disciplinary_code_versions(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  issued_at timestamptz,
  issued_by uuid references auth.users(id) on delete set null,
  acknowledged_at timestamptz,
  acknowledgement_method text
    check (acknowledgement_method is null or acknowledgement_method in ('portal','signed_document','email_confirmation','in_person','other')),
  acknowledgement_note text,
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(code_version_id,profile_id),
  check (acknowledged_at is null or issued_at is not null)
);

alter table public.hr_disciplinary_code_versions enable row level security;
alter table public.hr_disciplinary_sanction_guide enable row level security;
alter table public.hr_disciplinary_code_acknowledgements enable row level security;

drop policy if exists hr_disciplinary_code_versions_read on public.hr_disciplinary_code_versions;
create policy hr_disciplinary_code_versions_read
on public.hr_disciplinary_code_versions for select to authenticated
using (
  public.is_admin()
  or public.has_department_access('Human Resources','read')
);

drop policy if exists hr_disciplinary_sanction_guide_read on public.hr_disciplinary_sanction_guide;
create policy hr_disciplinary_sanction_guide_read
on public.hr_disciplinary_sanction_guide for select to authenticated
using (
  public.is_admin()
  or public.has_department_access('Human Resources','read')
);

drop policy if exists hr_disciplinary_code_acknowledgements_read on public.hr_disciplinary_code_acknowledgements;
create policy hr_disciplinary_code_acknowledgements_read
on public.hr_disciplinary_code_acknowledgements for select to authenticated
using (
  public.is_admin()
  or public.has_department_access('Human Resources','read')
);

revoke all on public.hr_disciplinary_code_versions from PUBLIC,anon,authenticated;
revoke all on public.hr_disciplinary_sanction_guide from PUBLIC,anon,authenticated;
revoke all on public.hr_disciplinary_code_acknowledgements from PUBLIC,anon,authenticated;

grant select on public.hr_disciplinary_code_versions to authenticated;
grant select on public.hr_disciplinary_sanction_guide to authenticated;
grant select on public.hr_disciplinary_code_acknowledgements to authenticated;
grant all on public.hr_disciplinary_code_versions to service_role;
grant all on public.hr_disciplinary_sanction_guide to service_role;
grant all on public.hr_disciplinary_code_acknowledgements to service_role;

insert into public.hr_disciplinary_code_versions(
  code_reference,version_label,title,effective_date,status,purpose,
  small_business_statement,legal_basis,employee_notice
)
values(
  'FOA-HR-DISC-001',
  'v1.0',
  'Funda Online Academy Staff Disciplinary Code',
  null,
  'draft',
  'To explain the standards of conduct expected from Funda Online Academy staff, promote correction before punishment where appropriate, protect fair and consistent treatment, and provide a clear internal guide for responding to alleged misconduct.',
  'Funda Online Academy currently operates as a small and growing business. The Academy may therefore use a practical and less formal disciplinary process where appropriate. This flexibility does not remove the requirement for a fair reason, a genuine opportunity for the employee to respond, proportionality, consistency, and fair treatment.',
  'Labour Relations Act 66 of 1995 and the Code of Practice: Dismissal published in Government Gazette 53294 on 4 September 2025, together with other applicable South African employment law.',
  'This Code is a guide, not an automatic penalty tariff. Every matter must be considered on its own facts. The Academy may move to a more serious step for serious misconduct, or use a less serious corrective step where circumstances justify it. Poor performance, illness, injury or incapacity must be handled through the appropriate performance/incapacity process rather than being labelled misconduct merely because work was not completed.'
)
on conflict(code_reference) do update set
  version_label=excluded.version_label,
  title=excluded.title,
  purpose=excluded.purpose,
  small_business_statement=excluded.small_business_statement,
  legal_basis=excluded.legal_basis,
  employee_notice=excluded.employee_notice,
  updated_at=now();

with v as (
  select id from public.hr_disciplinary_code_versions where code_reference='FOA-HR-DISC-001'
)
insert into public.hr_disciplinary_sanction_guide(
  code_version_id,offence_code,category,misconduct_example,
  first_occurrence_guidance,repeated_occurrence_guidance,serious_case_guidance,
  important_note,related_rule_code,sort_order,active
)
select v.id,x.offence_code,x.category,x.misconduct_example,
       x.first_occurrence_guidance,x.repeated_occurrence_guidance,x.serious_case_guidance,
       x.important_note,x.related_rule_code,x.sort_order,true
from v
cross join (values
  ('FOA-ATT-01','Attendance & Timekeeping',
   'Late coming, leaving early, repeated failure to be available during agreed working hours, or missing a required work meeting without reasonable explanation.',
   'Normally start with an informal documented discussion / counselling and clarify the expected attendance or availability standard.',
   'A verbal warning, then written warning, then final written warning may be considered if similar misconduct continues after the employee knew the standard.',
   'A serious or persistent pattern after prior correction may justify a formal hearing and a stronger sanction, including possible dismissal only if continued employment has become intolerable.',
   'Check the reason first. Approved leave, illness, emergency or genuine incapacity is not automatically misconduct.',
   'ATT-001',10),

  ('FOA-ATT-02','Attendance & Absence Reporting',
   'Unauthorised absence, failure to report absence, or failure to follow the known absence-notification procedure.',
   'Establish why the employee was absent and whether notification was reasonably possible. Minor first breaches will normally be addressed through counselling or a verbal warning.',
   'Repeated unjustified absence/reporting breaches may progress to written and final written warnings.',
   'Prolonged or repeated unauthorised absence may justify formal discipline and, in an appropriate case, possible dismissal after fair process.',
   'Do not treat sick leave, protected leave or genuine incapacity as misconduct simply because the employee was absent.',
   'ATT-001',20),

  ('FOA-WRK-01','Work Duties & Task Completion',
   'Failure to complete an assigned task, repeated missed deadlines, or avoidable failure to perform a duty after the duty and deadline were clearly communicated.',
   'First determine whether the employee had the skill, resources, training, time and instructions required. If capable but careless/refusing, use coaching or an informal documented discussion for a minor first breach.',
   'Repeated misconduct after correction may progress to verbal, written and final written warnings depending on impact and circumstances.',
   'Deliberate refusal, serious neglect or repeated non-compliance after support may justify formal discipline and a stronger sanction.',
   'If the real issue is inability, lack of training or poor performance rather than misconduct, route it to performance/incapacity management.',
   'NEG-001',30),

  ('FOA-INS-01','Instructions & Authority',
   'Failure or refusal to follow a lawful and reasonable work instruction.',
   'Clarify the instruction and employee explanation. A minor misunderstanding may be corrected informally.',
   'Repeated unjustified refusal may progress through written and final written warnings.',
   'Serious deliberate insubordination may justify a formal process and a stronger sanction on a first occurrence, depending on circumstances.',
   'The instruction must be lawful, reasonable, work-related and sufficiently clear.',
   'INS-001',40),

  ('FOA-NEG-01','Care, Accuracy & Responsibility',
   'Negligence, avoidable errors, failure to exercise reasonable care, or repeated disregard of required checks.',
   'Minor first negligence will normally start with correction, coaching or a verbal warning depending on actual/potential harm.',
   'Repeated negligence may progress to written and final written warnings.',
   'Gross negligence causing or risking serious harm may justify formal discipline and a stronger sanction, including possible dismissal where the employment relationship is intolerable.',
   'Distinguish negligence from lack of ability, inadequate training or an unreasonable workload.',
   'NEG-001',50),

  ('FOA-DAT-01','Confidentiality, Privacy & Data Security',
   'Unauthorised disclosure of confidential information, sharing passwords, insecure handling of personal information, or breach of an Academy data-security rule.',
   'A low-risk first breach may justify corrective training or a warning depending on the information and risk involved.',
   'Repeated or material breaches may progress to written/final written warnings.',
   'Deliberate disclosure, serious privacy/security compromise or conduct causing major harm may justify formal discipline and possible dismissal after fair process.',
   'Consider POPIA/privacy obligations, actual or potential harm, intent, training and whether the rule was known.',
   'CON-001',60),

  ('FOA-SYS-01','Systems, Equipment & Academy Resources',
   'Unauthorised or improper use of Academy systems, accounts, software, equipment, data or other resources.',
   'Minor first misuse will normally be corrected through counselling or a warning.',
   'Repeated misuse may progress to written and final written warnings.',
   'Intentional damage, serious unauthorised access, fraud or conduct creating major operational/security risk may justify a formal process and possible dismissal.',
   'Ordinary reasonable personal use should not be labelled misconduct unless it breaches a clear Academy rule.',
   'AST-001',70),

  ('FOA-FIN-01','Money, Petty Cash & Financial Controls',
   'Unauthorised spending, misuse of Academy money or petty cash, false claims, failure to follow an approved financial control, or falsification of financial evidence.',
   'Administrative mistakes without dishonesty should be corrected and may justify a warning depending on impact.',
   'Repeated control breaches may progress to written/final written warnings.',
   'Theft, fraud, deliberate falsification or serious dishonest misuse of funds may justify formal discipline and possible dismissal after fair process.',
   'Distinguish an honest error from dishonesty. Financial loss alone does not prove misconduct.',
   'HON-001',80),

  ('FOA-HON-01','Honesty & Integrity',
   'Dishonesty, fraud, theft, falsification of records, deliberate deception or material misrepresentation connected to employment.',
   'Normally requires formal investigation because honesty allegations can be serious; the first sanction depends on the proven facts and impact.',
   'Repeated dishonesty normally aggravates seriousness.',
   'Serious dishonesty may justify dismissal on a first offence if the proven misconduct makes continued employment intolerable.',
   'No employee is automatically guilty because dishonesty is alleged. Evidence and the employee response must be considered.',
   'HON-001',90),

  ('FOA-RES-01','Respect, Harassment & Workplace Dignity',
   'Bullying, harassment, discrimination, abusive communication, intimidation or other conduct that undermines another person’s dignity at work.',
   'Minor inappropriate conduct may be corrected or warned where appropriate, but harassment/discrimination allegations should be handled sensitively and promptly.',
   'Repeated conduct may justify stronger warnings or formal discipline.',
   'Serious harassment, discrimination, threats or violence may justify a formal process and possible dismissal on a first proven offence.',
   'Protect affected persons, avoid retaliation and consider any separate statutory equality/harassment obligations.',
   'HAR-001',100),

  ('FOA-SAF-01','Safety, Threats & Violence',
   'Threatening conduct, violence, deliberate safety breaches or behaviour creating serious risk to another person.',
   'Ordinary minor safety mistakes may be corrected or warned depending on risk.',
   'Repeated disregard of safety requirements may progress to final warning or stronger action.',
   'Violence, credible threats or wilful serious endangerment may justify formal discipline and possible dismissal after fair process.',
   'Immediate precautionary safety measures are separate from the final disciplinary finding and must not predetermine guilt.',
   'SAF-001',110),

  ('FOA-COI-01','Conflict of Interest & Improper Benefits',
   'Failure to disclose a material conflict, accepting an unauthorised benefit, bribery, self-dealing or using the Academy position for improper personal gain.',
   'A minor inadvertent disclosure failure may be corrected or warned where appropriate.',
   'Repeated or knowing non-disclosure may justify stronger warnings.',
   'Bribery, serious undisclosed conflicts or deliberate improper benefit may justify formal discipline and possible dismissal.',
   'Consider whether the conflict was material, whether disclosure was required and whether there was actual/potential harm.',
   'COI-001',120),

  ('FOA-REC-01','Records, Time & Reporting Integrity',
   'Falsifying attendance, time, work-completion, expense, learner, assessment or other Academy records.',
   'An accidental recording error should be corrected and investigated before misconduct is alleged.',
   'Repeated negligent record failures may progress through warnings.',
   'Deliberate falsification may amount to serious dishonesty and may justify formal discipline and possible dismissal.',
   'Intent matters: do not treat a genuine mistake as deliberate falsification without evidence.',
   'HON-001',130),

  ('FOA-REM-01','Remote Work & Availability',
   'Repeated unexplained unavailability during agreed remote-working hours, failure to attend required online meetings, or misuse of remote-work arrangements.',
   'Clarify working hours, connectivity issues and the employee explanation. Minor first breaches normally receive counselling/correction.',
   'Repeated unjustified breaches may progress to verbal, written and final written warnings.',
   'Deliberate deception about work/time or persistent non-compliance after correction may justify formal discipline and stronger action.',
   'Load-shedding, connectivity failures, emergencies and approved flexible arrangements must be considered before alleging misconduct.',
   'ATT-001',140),

  ('FOA-REP-01','Reputation & External Conduct',
   'Work-related public or online conduct that materially breaches confidentiality, unlawfully harasses others, misrepresents the Academy, or causes demonstrable workplace harm.',
   'Minor work-related communication mistakes may be corrected through guidance or a warning.',
   'Repeated misconduct may progress through written/final written warnings.',
   'Serious deliberate conduct with a substantial workplace connection and serious harm may justify formal discipline and stronger sanction.',
   'FOA does not claim control over lawful private conduct merely because an employee uses social media. A sufficient connection to the workplace must exist.',
   'POL-001',150),

  ('FOA-POL-01','Policies & Other Workplace Rules',
   'Breach of another valid, reasonable and communicated Academy policy or workplace standard not listed above.',
   'Minor first breaches will normally start with advice/correction or a proportionate warning.',
   'Repeated breaches may progress through graded warnings.',
   'A serious breach may justify formal discipline and stronger action depending on the rule, harm, employee awareness and circumstances.',
   'The exact rule must be identified and should be valid, reasonable, relevant and consistently applied.',
   'POL-001',999)
) as x(
  offence_code,category,misconduct_example,first_occurrence_guidance,
  repeated_occurrence_guidance,serious_case_guidance,important_note,related_rule_code,sort_order
)
on conflict(code_version_id,offence_code) do update set
  category=excluded.category,
  misconduct_example=excluded.misconduct_example,
  first_occurrence_guidance=excluded.first_occurrence_guidance,
  repeated_occurrence_guidance=excluded.repeated_occurrence_guidance,
  serious_case_guidance=excluded.serious_case_guidance,
  important_note=excluded.important_note,
  related_rule_code=excluded.related_rule_code,
  sort_order=excluded.sort_order,
  active=true;

create or replace function public.hr_record_disciplinary_code_issue(
  p_profile_id uuid,
  p_code_version_id uuid
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_id uuid;
  v_role text;
begin
  if not (
    public.is_admin()
    or public.has_department_access('Human Resources','edit')
  ) then
    raise exception 'Human Resources edit access required' using errcode='42501';
  end if;

  select lower(role) into v_role from public.profiles where id=p_profile_id;
  if v_role is distinct from 'staff' then
    raise exception 'The disciplinary code may only be issued through this Staff acknowledgement register to Staff profiles' using errcode='22023';
  end if;

  if not exists(select 1 from public.hr_disciplinary_code_versions where id=p_code_version_id) then
    raise exception 'Disciplinary code version not found' using errcode='P0002';
  end if;

  insert into public.hr_disciplinary_code_acknowledgements(
    code_version_id,profile_id,issued_at,issued_by,recorded_by
  )
  values(p_code_version_id,p_profile_id,now(),auth.uid(),auth.uid())
  on conflict(code_version_id,profile_id) do update set
    issued_at=coalesce(public.hr_disciplinary_code_acknowledgements.issued_at,now()),
    issued_by=coalesce(public.hr_disciplinary_code_acknowledgements.issued_by,auth.uid()),
    updated_at=now(),
    recorded_by=auth.uid()
  returning id into v_id;

  insert into public.hr_audit_log(actor_id,action,entity_type,entity_id,subject_profile_id,details)
  values(auth.uid(),'disciplinary_code_issued','hr_disciplinary_code_acknowledgement',v_id::text,p_profile_id,
    jsonb_build_object('code_version_id',p_code_version_id));

  return v_id;
end;
$$;

create or replace function public.hr_record_disciplinary_code_acknowledgement(
  p_profile_id uuid,
  p_code_version_id uuid,
  p_method text,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_id uuid;
  v_role text;
begin
  if not (
    public.is_admin()
    or public.has_department_access('Human Resources','edit')
  ) then
    raise exception 'Human Resources edit access required' using errcode='42501';
  end if;

  select lower(role) into v_role from public.profiles where id=p_profile_id;
  if v_role is distinct from 'staff' then
    raise exception 'Acknowledgement may only be recorded for Staff profiles' using errcode='22023';
  end if;

  if p_method not in ('portal','signed_document','email_confirmation','in_person','other') then
    raise exception 'Choose a valid acknowledgement method' using errcode='22023';
  end if;

  insert into public.hr_disciplinary_code_acknowledgements(
    code_version_id,profile_id,issued_at,issued_by,acknowledged_at,
    acknowledgement_method,acknowledgement_note,recorded_by
  )
  values(
    p_code_version_id,p_profile_id,now(),auth.uid(),now(),
    p_method,nullif(btrim(coalesce(p_note,'')),''),auth.uid()
  )
  on conflict(code_version_id,profile_id) do update set
    issued_at=coalesce(public.hr_disciplinary_code_acknowledgements.issued_at,now()),
    issued_by=coalesce(public.hr_disciplinary_code_acknowledgements.issued_by,auth.uid()),
    acknowledged_at=now(),
    acknowledgement_method=p_method,
    acknowledgement_note=nullif(btrim(coalesce(p_note,'')),''),
    recorded_by=auth.uid(),
    updated_at=now()
  returning id into v_id;

  insert into public.hr_audit_log(actor_id,action,entity_type,entity_id,subject_profile_id,details)
  values(auth.uid(),'disciplinary_code_acknowledged','hr_disciplinary_code_acknowledgement',v_id::text,p_profile_id,
    jsonb_build_object('code_version_id',p_code_version_id,'method',p_method));

  return v_id;
end;
$$;

revoke all on function public.hr_record_disciplinary_code_issue(uuid,uuid) from PUBLIC,anon;
revoke all on function public.hr_record_disciplinary_code_acknowledgement(uuid,uuid,text,text) from PUBLIC,anon;
grant execute on function public.hr_record_disciplinary_code_issue(uuid,uuid) to authenticated,service_role;
grant execute on function public.hr_record_disciplinary_code_acknowledgement(uuid,uuid,text,text) to authenticated,service_role;
