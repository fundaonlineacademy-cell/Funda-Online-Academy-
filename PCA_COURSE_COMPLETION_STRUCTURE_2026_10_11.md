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

Course-specific task briefs and rubrics have now been drafted for all 21 PCA courses. They remain in `draft` status and are not learner-visible or open for submission until they are separately audited and activated.

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

Structural QA confirms all 21 drafts have five criteria totalling 100% and at least one critical criterion. The approved overall competence rule remains 60% plus successful completion of every designated critical criterion, with one structured resubmission.

Examples of deliberate access/safety controls in the drafts include:

- Carpentry and Construction use drawing/structured simulation rather than compulsory hazardous cutting or live-site work.
- Digital Device Repair uses an authorised fictional diagnostic/job-card case rather than compulsory repair of a real customer device.
- Poultry does not require live birds.
- Landscaping does not require power tools, pesticide application or specialist tree work.
- Print & Branding does not require ownership of specialist production machinery.
- Food & Beverage uses a controlled mock service and does not require alcohol service.
- Nails may use a practice hand/tips rather than a live model.
- Urban Farming permits an equivalent structured simulation where reasonable growing access is unavailable.
- Baking uses one small affordable approved product and includes food-safety controls plus a business/costing component.

The drafts deliberately remain inactive while lesson alignment, wording, evidence sufficiency and course-specific academic validity are checked.

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

The Student-facing course-end work remains isolated on the feature branch pending PCA draft audit/approval, evidence-submission workflow finalisation, cache/version finalisation, authenticated end-to-end UI testing and the owner's physical review before merge to live `main`.
