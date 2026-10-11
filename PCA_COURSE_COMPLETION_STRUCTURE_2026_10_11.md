# Funda Online Academy — PCA & Course Completion Structure

Date: 11 October 2026  
Owner authority: Aziwe Futhe — Business Owner & CEO  
Assessment governance source: FOA-ASS-STD-001 v1.0  
Lesson governance source: FOA-ACA-STD-001 v1.1

## Owner-approved structure

The Practical Competence Assessment (PCA) is a formal course-end requirement only for courses classified for PCA under FOA-ASS-STD-001.

- A PCA appears once per course only.
- It appears in the final module only.
- It follows the final Summative Assessment.
- It never replaces the approved Formative or Summative pathway.
- It is not repeated in every module.
- A PCA may contain one or more compulsory components within one PCA.
- Alternative learner-choice routes are used only where equivalent evidence is justified by safety, affordability or reasonable access.
- PCA outcome: Competent / Not Yet Competent.
- Minimum rubric score: 60%.
- All designated critical criteria must be satisfied.
- One structured resubmission is permitted.

## Approved end-of-course flows

1. Summative only: Final Summative → Course Completion → Course Evaluation.
2. Summative + PCA: Final Summative → PCA → Course Completion → Course Evaluation.
3. Formative + Summative: Final Formative → Final Summative → Course Completion → Course Evaluation.
4. Formative + Summative + PCA: Final Formative → Final Summative → PCA → Course Completion → Course Evaluation.

Course Completion is not an academic assessment. It is the final course-quality/completion workflow. The Course Evaluation sits inside Course Completion. Completion of the evaluation is required where configured, but the learner's feedback must never change their academic competence result.

## Current catalogue classification

The live configuration records 35 active courses:

- 22 Formative + Summative.
- 13 Summative only.
- 21 PCA courses.
- 14 non-PCA courses.

The course/PCA classification is stored in `course_end_requirements` and is intended to remain aligned with the controlled course table in FOA-ASS-STD-001.

## PCA evidence modes

The configured structural modes are:

- Hands-on Practical.
- Applied Work Product.
- Business / Project Plan.
- Structured Simulation.
- Portfolio.
- Drawing / Applied Drawing where appropriate.

## Course-specific PCA draft status

Course-specific task briefs and rubrics have been drafted for all 21 PCA courses. They remain in `draft` status and are not learner-visible or open for submission until separately audited and activated.

Each draft contains:

- task purpose and learner instructions;
- one or more course-appropriate compulsory components;
- materials/access requirements;
- explicit safety and reasonable-access controls;
- evidence requirements;
- five weighted assessment criteria totalling 100%;
- at least one designated critical criterion;
- learner-declaration requirement;
- an indicative completion-time guide.

## Post-audit rubric and evidence controls

Following the read-only PCA audit, all 21 drafts were strengthened without activating learner submission.

Each PCA now uses the same controlled five-level criterion scale:

- Level 4 — Fully Competent — 100% of the criterion weight.
- Level 3 — Competent — 75% of the criterion weight.
- Level 2 — Partially Competent — 50% of the criterion weight.
- Level 1 — Limited Evidence — 25% of the criterion weight.
- Level 0 — Not Demonstrated / Unsafe — 0% of the criterion weight.

The weighted criterion scores are added to produce the overall PCA percentage. The overall competence threshold remains 60%.

A criterion marked Critical must achieve at least Level 3. A critical criterion is Not Met if it scores Level 0, 1 or 2, if mandatory evidence for that criterion is missing, or if an unsafe/prohibited action occurs. A learner cannot be declared Competent overall while any critical criterion is Not Met, even when the total percentage is 60% or higher.

Evidence verification is also standardised across all 21 drafts:

- learner declaration is mandatory;
- process evidence is required where the process itself is material to competence;
- final photographs or a final output alone are not sufficient where the process is essential;
- editable/source files are required where relevant to verifying authorship and competence;
- the assessor may request brief clarification, additional evidence or a limited demonstration where authenticity or competence is unclear;
- suspected copied, fabricated or misleading evidence is referred for academic review rather than treated as an ordinary resubmission.

All 21 tasks remain activation-blocked until final QA is satisfied.

## Lesson-alignment gate

PCA activation also requires confirmation that the task assesses only content actually taught in the approved course lessons.

Current governance state:

- Bookkeeping, Carpentry and E-Commerce: alignment recorded against currently approved course content.
- Remaining 18 PCA courses: alignment remains pending until those lessons are audited/approved under FOA-ACA-STD-001 v1.1.

The pending alignment state is deliberate and does not reopen or rewrite those lessons as part of the PCA work.

## Course-specific access and clarity corrections

The audit corrections also made hidden access expectations and vague evidence requirements explicit:

- Fashion Design and Sewing: safe access to a domestic sewing machine or approved supervised equivalent is required for the hands-on component, but purchase is not required.
- Gel & Acrylic Nails: basic gel/acrylic practice products and a compatible curing lamp where required must be accessible; a professional salon kit is not required.
- Urban Farming: the monitoring period is now a minimum of 14 calendar days with at least five dated monitoring entries, or equivalent dated evidence in the approved simulation route.
- Professional Baking: product-quality judgement is tied to hygiene, process, bake completion, product-appropriate texture/structure and stated quality checks rather than appearance alone.
- Graphic Design: production readiness is tied to the supplied output brief, including dimensions, image quality, bleed/safe area where required, asset/font handling and appropriate export settings.
- Print & Branding: the production specification must state dimensions, placement, material/substrate, intended process, file requirements and quality checks; the learner is not expected to invent machine settings or own specialist equipment.

## Course Evaluation — approved online version

Every current course is configured to require the approved Course Evaluation after academic requirements are satisfied.

Form version: `FOA-EVAL-001 v1.0`.

The online form is based on the Academy's existing Evaluation Form and retains its core evaluation areas while updating the language from event/workshop wording to course wording:

- overall course rating (1–5);
- most useful learning/topics;
- whether the stated course objectives were achieved;
- required explanation where the learner answers No to achievement of objectives;
- whether the knowledge/information gained met expectations;
- expected work/career/business applicability;
- suggestions for improving course effectiveness;
- organisation/presentation rating (1–5);
- comments, suggestions and optional further comments.

Core rating/choice questions are required. Written comments remain optional except for the required explanation when the learner says the course objectives were not achieved. Learner feedback does not alter the academic result or competence decision.

## Final-module navigation behaviour

The Student learning workspace reads the configured course-end structure without changing existing lesson or assessment rules.

- PCA is shown only in the final module and only for courses classified for PCA.
- PCA remains locked until the final Summative is passed and the course-specific PCA task is active.
- Course Completion is shown only at the end of the final module.
- For non-PCA courses, Course Completion unlocks after the final Summative is passed.
- For PCA courses, Course Completion unlocks after the final Summative is passed and the PCA has been assessed Competent at or above the approved 60% rubric threshold with all critical criteria met.
- After a learner passes the final Summative, the primary next action routes to PCA where required; otherwise it routes directly to Course Completion.
- Course Evaluation becomes available only after the configured academic requirements are satisfied.

## Data model

### `course_end_requirements`
Controls the final module, assessment pathway, PCA applicability/mode, PCA standard settings, draft/active task state and evaluation-form activation state.

### `pca_submissions`
Reserved for learner PCA evidence and assessor outcomes. RLS protects learner-owned records. Learner creation remains unavailable while a course PCA is not active.

### `course_evaluation_submissions`
Stores the final learner evaluation response for the active form version. Submission is limited to the authenticated learner after the final Summative and any required PCA have been completed.

### `get_course_end_structure(course_id)`
Authenticated read model for the Student course-end workspace. It reports final Summative status, PCA requirements/status, evaluation status and course-completion readiness without altering the existing MCQ assessment tables. Draft PCA configuration is not disclosed to learners until the task status is active.

### `submit_course_evaluation(course_id, responses)`
Authenticated submission route for the final Course Evaluation. The server validates eligibility and the required response structure before recording one submission for the active form version.

## Protection / scope

The structure deliberately does not alter:

- lesson content;
- Knowledge Checks;
- existing Formative/Summative question banks;
- assessment scoring, attempts or pass rules;
- module unlocking before the course-end sequence;
- results templates;
- certificate issuance;
- payments or enrolment;
- unrelated Student Portal tabs or workflows.

The Student-facing course-end work remains isolated on the feature branch pending final PCA academic QA/approval, evidence-submission workflow finalisation, cache/version finalisation, authenticated end-to-end UI testing and the owner's physical review before merge to live `main`.
