# Bookkeeping Academic Remediation and QA Hold — 2026-10-14

**Owner request:** Read the assessment and lesson standard, audit Bookkeeping, and fix the identified defects.  
**Course:** Bookkeeping & Financial Administration — Professional Short Course  
**Course ID:** `fcbe0c39-c31f-4a39-833f-7b89d553bef2`  
**Academic standard:** FOA-ACA-STD-001 v1.1  
**Review disposition:** **REQUIRES ACTION — NOT RE-LOCKED**

## Executive decision

The scoped corrective release is suitable to retain: it fixes the public title and duplicate-section defect, removes exact formal-question reuse, balances answer positions, improves high-risk questions, diversifies lesson Knowledge Checks, records official-source evidence, and hardens PCA function grants. Source and production now reconcile exactly for all 840 formal questions.

Final academic approval is withheld. A separate read-only audit found that the correct option is uniquely longest in **712 of 840 formal questions (84.8%)**. This is a material answer cue even though answer letters are balanced. The course-end PCA remains in `draft` with `blocked_until_final_qa`; no clean lock is issued.

## Implemented remediation

- Corrected the learner-facing title to **Bookkeeping & Financial Administration — Professional Short Course** and removed unsupported “Advanced” / certificate-positioning copy while retaining the legacy technical slug for route stability.
- Corrected duplicate public Learning Outcomes and Modules rendering by resolving the intended `.section` containers.
- Preserved 20 published assessment identities and all runtime rules while updating their 840 normalized question rows.
- Balanced every formative bank to A/B/C/D = 8/8/8/8 and every summative bank to A/B/C/D = 13/13/13/13, with a maximum same-key run of two.
- Applied a targeted high-value question pass for scenarios, calculations, VAT invoice boundaries, VAT arithmetic, record retention and provisional-tax terminology.
- Removed exact prompt duplication across modules and between formative and summative banks.
- Rebuilt the 400 informal lesson checks as 80 MCQs, 240 true/false items and 80 matching activities while retaining exactly five checks per lesson.
- Balanced Knowledge Check MCQ keys to 20 in each position and true/false answers to 120/120; 20 of 80 MCQs have a uniquely longest correct option.
- Added a restricted official-source verification register with 106 entries covering 41 affected lessons and four authorities.
- Removed public and anonymous execute grants from the PCA draft/read functions; authenticated and service roles retain intended access.

## Independent production audit

| Control | Verified result | Disposition |
|---|---:|---|
| Published formal banks | 20 | Pass |
| Formal questions | 840: 320 formative, 520 summative | Pass |
| Source/live canonical checksum | `5512c54420c504cca4eb3e826055707f` | Exact match |
| Invalid keys / non-unit marks / repeated options | 0 / 0 / 0 | Pass |
| Exact duplicate prompt groups | 0 | Pass |
| Unbalanced answer-key banks | 0 | Pass |
| Runtime/configuration exceptions | 0 | Pass |
| Legacy credential wording in assessment descriptions | 0 | Pass |
| Correct option uniquely longest | 712 / 840 (84.8%) | **Fail — action required** |
| Lessons / informal checks | 80 / 400 | Pass |
| Knowledge Check type mix | 80 MCQ / 240 true-false / 80 matching | Pass |
| Lessons not containing five checks | 0 | Pass |
| Invalid matching activities | 0 | Pass |
| Formal prompts embedded in Knowledge Checks | 0 | Pass |
| Historical assessment attempts | 1 attempt, passed; 0 answer rows | Preserved |
| PCA submissions | 0 | Confirmed |
| PCA state | `draft`; activation blocked | Correct hold |

## Behaviour preserved

- Formative banks remain 32 questions with 15 randomly delivered per attempt.
- Summative banks remain 52 questions with 25 randomly delivered per attempt.
- The pass standard remains 70%, maximum attempts remain three, and formative-before-summative gating remains intact.
- Assessment, question, module and lesson identities were not replaced.
- The existing passed Module 1 formative attempt remains recorded; no learner answer rows existed when answer positions were changed.
- Lesson completion and learner progression records were outside the update scope and were not rewritten.
- The course remains positioned as a non-NQF professional short course; no professional-certificate or advanced-course claim was introduced.

## Evidence and rollback

- Pre-change restricted snapshot: `6a522298-09b1-4723-a604-bda6dfc35cad`
- Snapshot scope: `bookkeeping_pre_fix_full_academic_snapshot_2026_10_14`
- Official-source register: 106 restricted verification rows; access revoked from `public`, `anon` and `authenticated`.
- Verified authorities: South African Revenue Service, IFRS Foundation, Companies and Intellectual Property Commission, and the Department of Employment and Labour.

## Database-advisor review

- The source-register lesson foreign key is covered by `academic_source_verifications_lesson_idx`; the initial unindexed-foreign-key notice is resolved.
- The two restricted `private` tables intentionally have RLS enabled with no policies and all `public`, `anon` and `authenticated` grants revoked. The remaining informational notice is documented at [RLS enabled with no policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
- `get_course_end_structure` and `save_pca_draft` remain intentionally executable by authenticated users because they are learner workflows; both perform internal identity/ownership checks, while public and anonymous execute grants are revoked. The advisor category is documented at [authenticated SECURITY DEFINER function executable](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
- Newly created private indexes may appear as unused until normal operational queries use them; this informational category is documented at [unused index](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).
- Unrelated pre-existing project advisor findings were not changed under this course-only scope.

## Required action before re-lock

1. An accounting SME must rewrite the formal distractors so answer length does not systematically reveal the correct response, without padding options with generic rationales.
2. Re-run structural, duplication, answer-cue, factual, source-to-production and learner-history checks.
3. Record a new independent QA result only after the formal bank passes.
4. Activate the PCA only after that clean result; then update the lock record.

Until those actions are complete, the authoritative status is **REQUIRES ACTION** and the prior clean assessment conclusion must not be used as current approval.
