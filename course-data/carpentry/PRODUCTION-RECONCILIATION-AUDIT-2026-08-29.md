# Carpentry Production Reconciliation Audit — 2026-08-29

## Status
**Repository academic source:** populated and QA-reviewed  
**Public premium Course Overview:** added  
**Production academic reconciliation:** NOT YET COMPLETE

## Approved source architecture
The repository QA defines the intended learner architecture as:
- 10 modules;
- 8 teaching lessons per module;
- 1 formative assessment after the teaching lessons;
- 1 summative assessment after the formative stage;
- 80 teaching lessons + 20 assessment entries = 100 learner-facing units.

Repository inspection confirms Module 10 contains `lesson-01.md` through `lesson-08.md`, a populated formative bank and a populated summative bank.

## Current production findings
Production course ID: `60cfc5ea-6d3b-4dd1-abd6-cb68800930b5`.

Current production course record:
- public title: `Carpentry Fundamentals & Workplace Practice — Practical Skills Short Course`;
- duration: 8 Weeks;
- fee: R1,750;
- modules: 10.

Current lesson-table state:
- Modules 1–9 each contain 10 lesson records;
- Module 10 contains 0 lesson records;
- total lesson records: 90.

The existing Modules 1–9 lesson rows are legacy/misaligned with the approved 8-teaching-lesson structure. Several lesson-number-10 rows have zero content, and module names do not consistently align with the legacy lesson subject matter. The production lesson layer therefore must not be treated as the approved academic source.

Current assessment-table state:
- 20 active published module assessment records exist (formative + summative for Modules 1–10);
- delivery settings reflect 15 formative questions and 25 summative questions;
- the `assessment_questions` table currently has 0 linked questions for these Carpentry assessments;
- the legacy `assessments.questions` JSON arrays are also empty for these module assessments.

## Learner-data safety findings
Before any reconciliation mutation, production currently has:
- 1 course enrolment;
- 1 lesson-progress row associated with the Carpentry course;
- 1 assessment-attempt row associated with a Carpentry assessment.

These relationships must be preserved and inspected before lesson records or assessment records are deleted/recreated.

## Required reconciliation approach
1. Identify the exact progressed lesson ID and assessment-attempt relationship.
2. Preserve course ID, module IDs, enrolment and valid learner-history relationships.
3. Map the approved repository lessons to production module + lesson number.
4. Prefer in-place updates for lesson rows that carry learner progress.
5. Remove or archive superseded legacy lesson rows only after confirming they have no dependent learner history.
6. Create the missing Module 10 teaching lesson records from the approved repository source.
7. Load the approved secure formative and summative banks for all 10 modules into the protected assessment-question architecture.
8. Verify formative-before-summative locking, 70% pass standard, maximum 3 attempts and question-delivery counts.
9. Run post-reconciliation checks for lesson counts, learner progress, assessment attempts, bank counts and access control before declaring the Carpentry academic deployment complete.

## Public Course Overview decision
The public overview is intentionally based on the approved repository architecture rather than the stale production lesson count. It presents 10 modules and 80 teaching lessons, with assessment stages described separately. It also clearly states that the programme is a non-qualification practical skills short course and does not confer trade status, artisan recognition, occupational licensing or guaranteed employment.
