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

Course-specific task instructions, evidence requirements and rubrics are intentionally not populated in the initial structure. Those will be designed during the formal assessment-development phase and activated only after academic approval.

## Course Evaluation status

Every current course is configured to require a Course Evaluation at completion. The evaluation form is intentionally marked `pending_design` until the owner's existing evaluation form is reviewed and approved for the online workflow. No evaluation questions have been invented or activated in this structural phase.

## Data model

### `course_end_requirements`
Controls the final module, assessment pathway, PCA applicability/mode, PCA standard settings, and evaluation-form activation state.

### `pca_submissions`
Reserved for learner PCA evidence and assessor outcomes. RLS protects learner-owned records. Learner creation remains unavailable while a course PCA is only `structure_only`.

### `course_evaluation_submissions`
Reserved for the final learner evaluation response. Submission remains unavailable until an approved evaluation form version is activated.

### `get_course_end_structure(course_id)`
Authenticated read model for the student course-end workspace. It reports final Summative status, PCA requirements/status, evaluation status and course-completion readiness without altering the existing MCQ assessment tables.

## Protection / scope

The structure deliberately does not alter:

- lesson content;
- Knowledge Checks;
- existing Formative/Summative question banks;
- assessment attempts or pass rules;
- module unlocking before the course-end sequence;
- results templates;
- certificate issuance;
- payments or enrolment;
- unrelated Student Portal tabs or workflows.

The new Student-facing shells remain isolated on the feature branch until the Course Evaluation form and final course-end navigation are completed and physically reviewed by the owner.
