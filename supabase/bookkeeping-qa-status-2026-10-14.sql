-- Record the post-remediation Bookkeeping QA hold.
-- This does not alter assessment content, learner history, progression, or PCA state.

begin;

with target_course as (
  select id
  from public.courses
  where slug = 'professional-certificate-in-bookkeeping'
    and title = 'Bookkeeping & Financial Administration — Professional Short Course'
  limit 1
)
insert into public.academic_course_qa_reviews (
  course_id,
  module_id,
  lesson_id,
  review_scope,
  review_status,
  qa_version,
  summary,
  strengths,
  findings,
  actions_required,
  evidence_notes,
  reviewer_id,
  reviewed_at,
  next_review_date
)
select
  target_course.id,
  null,
  null,
  'course',
  'requires_action',
  'FOA-ACA-STD-001 v1.1 / 2026-10-14 — REMEDIATION HOLD',
  'Scoped Bookkeeping remediation was deployed and reconciled, but final academic approval and re-locking are withheld because the formal assessment bank retains a material answer-length cue. The PCA remains draft and blocked until final QA.',
  'Twenty published banks retain the required 32/52 bank sizes and 15/25 delivery rules; all answer keys are balanced; exact prompt duplication is zero; 400 lesson Knowledge Checks retain five per lesson with a controlled type mix; official-source evidence and PCA function permissions are recorded.',
  'The correct option is uniquely longest in 712 of 840 formal questions (84.8%). This cue can reward test-wise guessing and fails the psychometric-quality control despite balanced answer positions.',
  'Rewrite formal distractors through an accounting-SME pass without generic padding; rerun independent structural, duplication, answer-cue, factual and regression audits; issue a new approved QA record and activate the PCA only after all controls pass.',
  'Source and production formal-bank checksum: 5512c54420c504cca4eb3e826055707f. Pre-change restricted snapshot: 6a522298-09b1-4723-a604-bda6dfc35cad. Existing history preserved: one passed attempt and zero answer rows. PCA submissions: zero.',
  null,
  now(),
  date '2026-10-21'
from target_course
where not exists (
  select 1
  from public.academic_course_qa_reviews existing
  where existing.course_id = target_course.id
    and existing.qa_version = 'FOA-ACA-STD-001 v1.1 / 2026-10-14 — REMEDIATION HOLD'
);

commit;
