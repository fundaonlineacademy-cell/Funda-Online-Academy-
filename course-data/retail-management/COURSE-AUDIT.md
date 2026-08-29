# Retail Management Course Audit

**Course:** Professional Certificate in Retail Management & Team Leadership  
**Audit date:** 29 August 2026  
**Scope:** repository source build, Modules 1–8  
**Status:** SOURCE BUILD COMPLETE — PRODUCTION RECONCILIATION PENDING

## Executive result

The Retail Management repository source has reached the planned 8-module × 8-lesson structure: **64 lesson files** plus **16 assessment-bank files**. No module, lesson slot or assessment-bank slot is missing from the source tree.

The lesson samples reviewed across all eight modules are substantive rather than placeholders. The lighter Module 7 and Module 8 lessons reviewed still contain learning outcomes, structured teaching, applied retail examples, practical activity, knowledge check and feedback, key takeaways and visual guidance. The course build plan explicitly allows narrower lessons to be shorter and prohibits padding solely to reach a word count.

## Audit gates

### 1. Source inventory — PASS
- Modules present: 8/8
- Lessons present: 64/64
- Formative assessment files present: 8/8
- Summative assessment files present: 8/8
- Total assessment-bank files: 16/16

Summative filenames are not fully standardised (`summative-assessment.md` and `summative-assessment-bank.md` are both used). They are intentionally left unchanged until deployment references are reconciled.

### 2. Lesson substance and pattern — PASS WITH MINOR NORMALISATION NOTE
Expected teaching components are present in the reviewed lessons: outcomes, relevance/context, teaching sections, applied example or operational context, activity, knowledge check, feedback, takeaways and visual guidance.

Modules 5–8 use a leaner presentation shell in sampled lessons and may omit an explicit estimated-study-time line. This is a consistency issue, not evidence of missing teaching. Do not inflate lessons simply to hit 700–1,000 words; the approved build plan allows approximately 500–700 words for narrow topics and 700–1,000+ where depth requires it.

### 3. Assessment architecture — PASS
All eight formative bank headers declare:
- 32-question bank
- 15 questions delivered per attempt
- 70% pass mark
- maximum 3 attempts

All eight summative bank headers declare:
- 52-question bank
- 25 questions delivered per attempt
- 70% pass mark
- maximum 3 attempts

Module 8 was checked end-to-end as a representative integrity sample: its formative bank runs through question 32 and its summative bank runs through question 52 with answer keys.

### 4. South African grounding — PASS AT SOURCE-AUDIT LEVEL
The reviewed content uses South African retail-management context and appropriately frames sensitive legal/HR/data-protection matters around approved organisational processes rather than unsupported legal conclusions. Exact legal or regulatory claims must continue to be rechecked when material is changed because legislation and codes can change.

### 5. Production reconciliation — NOT YET PASSED
Source completion does not prove that the live learner-facing course already contains the same 64 lessons and 16 banks. Before deployment or replacement of existing records, reconcile:
- course and module IDs;
- current live lesson count and ordering;
- assessment records and bank mappings;
- enrolment and learner-progress relationships;
- any code that depends on the two existing summative filename variants.

## Corrections made during this audit
1. Corrected the build-plan status so it no longer reads as though the 64-lesson source build is still unfinished.
2. Added this permanent audit record.
3. Added `scripts/audit-retail-management-course.py` so file presence, lesson structure, assessment configuration and question numbering can be checked repeatedly after future edits.
4. Preserved valid shorter lessons instead of padding them artificially.
5. Preserved current summative filenames pending production-reference reconciliation.

## Release decision
**Repository source:** approved to proceed to automated validation and production reconciliation.  
**Production deployment:** not approved solely by this source audit; reconcile live records first.
